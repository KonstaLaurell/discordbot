# Discord GitHub Commit Tracker Bot

A Discord bot that tracks GitHub repository commit history and posts updates to specific Discord channels. Each channel can be linked to a different GitHub repository.

## Features

- 🔗 Link GitHub repositories to specific Discord channels
- 📝 Automatic commit notifications every 10 minutes
- 🎨 Beautiful embed messages with commit details
- 👤 Shows commit author and avatar
- 🔄 Tracks multiple repositories across different channels
- 💾 Persistent storage of channel-repository mappings
- ⚡ Manual commit checking on demand

## Prerequisites

- Node.js 16.x or higher
- A Discord Bot Token
- (Optional) GitHub Personal Access Token for higher API rate limits

## Installation

1. **Clone or download this repository**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create a Discord Bot**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Click "New Application" and give it a name
   - Go to the "Bot" section and click "Add Bot"
   - Under "Privileged Gateway Intents", enable:
     - Message Content Intent
     - Server Members Intent (optional)
   - Copy the bot token

4. **Invite the bot to your server**
   - Go to "OAuth2" > "URL Generator"
   - Select scopes: `bot`
   - Select permissions:
     - Send Messages
     - Embed Links
     - Read Messages/View Channels
     - Read Message History
   - Copy the generated URL and open it in your browser to invite the bot

5. **Configure the bot**
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` and add your Discord bot token:
     ```
     DISCORD_TOKEN=your_discord_bot_token_here
     ```
   - (Optional) Add a GitHub token for higher rate limits:
     ```
     GITHUB_TOKEN=your_github_token_here
     ```
   - To create a GitHub token:
     - Go to [GitHub Settings > Tokens](https://github.com/settings/tokens)
     - Generate a new token with `public_repo` scope

6. **Start the bot**
   ```bash
   npm start
   ```

## Usage

### Commands

All commands start with `!`:

#### `!link <owner/repo> [branch]`
Link a GitHub repository to the current channel.
- **Example:** `!link facebook/react main`
- **Example:** `!link torvalds/linux master`
- Default branch is `main` if not specified

#### `!unlink`
Unlink the repository from the current channel.

#### `!list`
Show information about the repository linked to this channel.

#### `!check`
Manually check for new commits right now (doesn't wait for the scheduled check).

#### `!token` or `!whoami`
Check which GitHub account is authenticated and verify your token is working.
- Shows if a token is configured
- Displays the authenticated username
- Shows access level (public only vs public + private repos)

#### `!help`
Display help information with all available commands.

### How It Works

1. **Link a repository** to a channel using `!link owner/repo branch`
2. The bot will immediately fetch the latest commit
3. Every 10 minutes, the bot checks all linked repositories for new commits
4. When new commits are found, they are posted as embed messages
5. Each channel can track a different repository independently

### Example Workflow

```
# In #frontend-updates channel
!link facebook/react main

# In #backend-updates channel
!link expressjs/express master

# In #linux-kernel channel
!link torvalds/linux master
```

Now each channel will receive commit notifications for its respective repository!

## File Structure

```
discordbot/
├── index.js              # Main bot file with Discord client and commands
├── githubTracker.js      # GitHub API integration
├── database.js           # JSON-based storage for channel mappings
├── package.json          # Node.js dependencies
├── .env                  # Configuration (create from .env.example)
├── .env.example          # Example configuration file
├── .gitignore           # Git ignore file
├── README.md            # This file
└── data/                # Created automatically
    └── channelMappings.json  # Stores channel-repo links
```

## Configuration

### Check Interval
By default, the bot checks for new commits every 10 minutes. To change this, edit the cron schedule in `index.js`:

```javascript
// Current: every 10 minutes
cron.schedule('*/10 * * * *', async () => {

// Every 5 minutes:
cron.schedule('*/5 * * * *', async () => {

// Every hour:
cron.schedule('0 * * * *', async () => {
```

### API Rate Limits

- **Without GitHub token:** 60 requests/hour
- **With GitHub token:** 5,000 requests/hour

Each repository check uses 1 API request. Plan accordingly based on how many repositories you're tracking.

## Troubleshooting

### Bot doesn't respond to commands
- Make sure "Message Content Intent" is enabled in Discord Developer Portal
- Check that the bot has permission to read and send messages in the channel

### "Repository not found" error
- Verify the repository exists and is public
- Check the format: `owner/repo` (e.g., `facebook/react`)
- Private repositories require a GitHub token with appropriate permissions

### API rate limit errors
- Add a GitHub Personal Access Token to `.env`
- Reduce the number of tracked repositories
- Increase the check interval

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License - feel free to use this bot for any purpose!
