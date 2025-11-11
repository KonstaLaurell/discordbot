const { Client, GatewayIntentBits, EmbedBuilder, Collection } = require('discord.js');
const cron = require('node-cron');
const dotenv = require('dotenv');

// Load environment variables BEFORE requiring other modules
dotenv.config();

const githubTracker = require('./githubTracker');
const { loadChannelMappings, saveChannelMappings } = require('./database');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// Store channel-to-repo mappings
let channelMappings = {};

client.once('ready', async () => {
    console.log(`✅ Bot is online as ${client.user.tag}`);
    
    // Check GitHub token status
    const githubUser = await githubTracker.getAuthenticatedUser();
    if (githubUser) {
        console.log(`🔑 GitHub authenticated as: ${githubUser.login}`);
    } else {
        console.log('⚠️  No GitHub token configured or authentication failed');
        console.log('   Check GITHUB_TOKEN in .env file');
    }
    
    // Load existing channel mappings
    channelMappings = await loadChannelMappings();
    console.log(`📚 Loaded ${Object.keys(channelMappings).length} channel mappings`);
    
    // Schedule commit checks every 10 minutes
    cron.schedule('*/10 * * * *', async () => {
        console.log('🔍 Checking for new commits...');
        await checkAllRepositories();
    });
    
    console.log('⏰ Scheduler started - checking commits every 10 minutes');
});

client.on('messageCreate', async (message) => {
    // Ignore bot messages
    if (message.author.bot) return;
    
    // Only respond to messages starting with !
    if (!message.content.startsWith('!')) return;
    
    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    
    try {
        switch (command) {
            case 'link':
                await handleLinkCommand(message, args);
                break;
            case 'unlink':
                await handleUnlinkCommand(message, args);
                break;
            case 'list':
                await handleListCommand(message);
                break;
            case 'check':
                await handleCheckCommand(message);
                break;
            case 'help':
                await handleHelpCommand(message);
                break;
            case 'token':
            case 'whoami':
                await handleTokenCommand(message);
                break;
        }
    } catch (error) {
        console.error('Error handling command:', error);
        message.reply('❌ An error occurred while processing your command.');
    }
});

async function handleLinkCommand(message, args) {
    if (args.length < 2) {
        return message.reply('❌ Usage: `!link <owner/repo> [branch]`\nExample: `!link facebook/react main`');
    }
    
    const repo = args[0];
    const branch = args[1] || 'main';
    
    // Validate repo format
    if (!repo.includes('/')) {
        return message.reply('❌ Invalid repository format. Use: `owner/repo`');
    }
    
    const [owner, repoName] = repo.split('/');
    
    // Verify repository exists
    const isValid = await githubTracker.verifyRepository(owner, repoName);
    if (!isValid) {
        return message.reply('❌ Repository not found or is private. Make sure it exists and is public.');
    }
    
    // Link channel to repository
    channelMappings[message.channel.id] = {
        owner,
        repo: repoName,
        branch,
        lastChecked: null,
        lastCommitSha: null
    };
    
    await saveChannelMappings(channelMappings);
    
    const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('✅ Repository Linked')
        .setDescription(`This channel is now tracking:\n**${owner}/${repoName}** (${branch} branch)`)
        .setTimestamp();
    
    message.reply({ embeds: [embed] });
}

async function handleUnlinkCommand(message, args) {
    if (!channelMappings[message.channel.id]) {
        return message.reply('❌ This channel is not linked to any repository.');
    }
    
    const mapping = channelMappings[message.channel.id];
    delete channelMappings[message.channel.id];
    
    await saveChannelMappings(channelMappings);
    
    message.reply(`✅ Unlinked **${mapping.owner}/${mapping.repo}** from this channel.`);
}

async function handleListCommand(message) {
    const mapping = channelMappings[message.channel.id];
    
    if (!mapping) {
        return message.reply('❌ This channel is not linked to any repository.');
    }
    
    const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('📚 Repository Information')
        .addFields(
            { name: 'Repository', value: `${mapping.owner}/${mapping.repo}`, inline: true },
            { name: 'Branch', value: mapping.branch, inline: true },
            { name: 'Last Checked', value: mapping.lastChecked ? new Date(mapping.lastChecked).toLocaleString() : 'Never', inline: false }
        )
        .setTimestamp();
    
    message.reply({ embeds: [embed] });
}

async function handleCheckCommand(message) {
    const mapping = channelMappings[message.channel.id];
    
    if (!mapping) {
        return message.reply('❌ This channel is not linked to any repository.');
    }
    
    message.reply('🔍 Checking for new commits...');
    await checkRepository(message.channel.id);
}

async function handleHelpCommand(message) {
    const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('🤖 GitHub Commit Tracker Bot - Help')
        .setDescription('Track GitHub repository commits in your Discord channels!')
        .addFields(
            { name: '!link <owner/repo> [branch]', value: 'Link a GitHub repository to this channel\nExample: `!link facebook/react main`', inline: false },
            { name: '!unlink', value: 'Unlink the repository from this channel', inline: false },
            { name: '!list', value: 'Show the repository linked to this channel', inline: false },
            { name: '!check', value: 'Manually check for new commits now', inline: false },
            { name: '!token (or !whoami)', value: 'Check which GitHub account is authenticated', inline: false },
            { name: '!help', value: 'Show this help message', inline: false }
        )
        .setFooter({ text: 'The bot automatically checks for commits every 10 minutes' })
        .setTimestamp();
    
    message.reply({ embeds: [embed] });
}

async function handleTokenCommand(message) {
    const user = await githubTracker.getAuthenticatedUser();
    
    if (!user) {
        const embed = new EmbedBuilder()
            .setColor(0xFFA500)
            .setTitle('⚠️ No GitHub Token')
            .setDescription('No GitHub token is configured. The bot is using unauthenticated requests.')
            .addFields(
                { name: 'Rate Limit', value: '60 requests/hour', inline: true },
                { name: 'Access', value: 'Public repos only', inline: true }
            )
            .setFooter({ text: 'Add GITHUB_TOKEN to .env for private repo access and higher rate limits' });
        
        return message.reply({ embeds: [embed] });
    }
    
    const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('✅ GitHub Authentication')
        .setDescription(`Authenticated as **${user.login}**`)
        .addFields(
            { name: 'Name', value: user.name || 'Not set', inline: true },
            { name: 'Account Type', value: user.type, inline: true },
            { name: 'Public Repos', value: user.public_repos.toString(), inline: true },
            { name: 'Rate Limit', value: '5,000 requests/hour', inline: true },
            { name: 'Access', value: 'Public + Private repos', inline: true }
        )
        .setThumbnail(user.avatar_url)
        .setTimestamp();
    
    if (user.bio) {
        embed.setFooter({ text: user.bio });
    }
    
    message.reply({ embeds: [embed] });
}

async function checkAllRepositories() {
    const channels = Object.keys(channelMappings);
    
    for (const channelId of channels) {
        await checkRepository(channelId);
    }
}

async function checkRepository(channelId) {
    const mapping = channelMappings[channelId];
    if (!mapping) return;
    
    try {
        const commits = await githubTracker.getRecentCommits(
            mapping.owner,
            mapping.repo,
            mapping.branch,
            mapping.lastCommitSha
        );
        
        if (commits.length === 0) return;
        
        const channel = await client.channels.fetch(channelId);
        if (!channel) {
            console.log(`Channel ${channelId} not found, removing mapping`);
            delete channelMappings[channelId];
            await saveChannelMappings(channelMappings);
            return;
        }
        
        // Post commits (newest last)
        const commitsToPost = commits.reverse().slice(0, 5); // Limit to 5 commits at a time
        
        for (const commit of commitsToPost) {
            // Get full commit message, truncate if too long (Discord limit is 4096 chars for description)
            const fullMessage = commit.commit.message.substring(0, 4000);
            
            const embed = new EmbedBuilder()
                .setColor(0x6e5494)
                .setTitle(`📝 New Commit to ${mapping.owner}/${mapping.repo}`)
                .setURL(commit.html_url)
                .setDescription(fullMessage)
                .addFields(
                    { name: 'Author', value: commit.commit.author.name, inline: true },
                    { name: 'Branch', value: mapping.branch, inline: true },
                    { name: 'SHA', value: `\`${commit.sha.substring(0, 7)}\``, inline: true }
                )
                .setTimestamp(new Date(commit.commit.author.date))
                .setFooter({ text: `${mapping.owner}/${mapping.repo}` });
            
            if (commit.author?.avatar_url) {
                embed.setThumbnail(commit.author.avatar_url);
            }
            
            await channel.send({ embeds: [embed] });
        }
        
        // Update last commit SHA and check time
        channelMappings[channelId].lastCommitSha = commits[0].sha;
        channelMappings[channelId].lastChecked = new Date().toISOString();
        await saveChannelMappings(channelMappings);
        
    } catch (error) {
        console.error(`Error checking repository for channel ${channelId}:`, error.message);
    }
}

client.login(process.env.DISCORD_TOKEN);
