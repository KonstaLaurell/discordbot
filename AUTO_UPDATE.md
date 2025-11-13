# Auto-Update Setup

This bot can automatically pull updates from Git and restart itself.

## Method 1: Using PM2 (Recommended)

### Install PM2
```bash
npm install -g pm2
```

### Start the bot with PM2
```bash
pm2 start ecosystem.config.js
```

### Useful PM2 commands
```bash
pm2 status              # Check bot status
pm2 logs discord-bot    # View logs
pm2 restart discord-bot # Restart bot
pm2 stop discord-bot    # Stop bot
pm2 delete discord-bot  # Remove from PM2
```

### Auto-start on server reboot
```bash
pm2 startup
pm2 save
```

### Auto-update with cron
Make the script executable:
```bash
chmod +x auto-update.sh
```

Add to crontab to check for updates every 5 minutes:
```bash
crontab -e
```

Add this line:
```
*/5 * * * * /home/tyhjyys/Projects/discordbot/auto-update.sh >> /home/tyhjyys/Projects/discordbot/logs/auto-update.log 2>&1
```

## Method 2: Simple systemd service

Create service file:
```bash
sudo nano /etc/systemd/system/discord-bot.service
```

Add this content:
```ini
[Unit]
Description=Discord GitHub Tracker Bot
After=network.target

[Service]
Type=simple
User=tyhjyys
WorkingDirectory=/home/tyhjyys/Projects/discordbot
ExecStart=/usr/bin/node /home/tyhjyys/Projects/discordbot/index.js
Restart=always
RestartSec=10
StandardOutput=append:/home/tyhjyys/Projects/discordbot/logs/output.log
StandardError=append:/home/tyhjyys/Projects/discordbot/logs/error.log

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable discord-bot
sudo systemctl start discord-bot
sudo systemctl status discord-bot
```

Then use the auto-update.sh script with cron as described above.

## Method 3: GitHub Webhooks (Advanced)

For instant updates when you push to GitHub, you can set up a webhook endpoint. This requires:
1. A web server to receive webhooks
2. Public IP or domain
3. Additional security setup

Let me know if you want me to set this up!
