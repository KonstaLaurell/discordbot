#!/bin/bash

# Auto-update script for Discord bot
# This script pulls latest changes from git and restarts the bot

cd "$(dirname "$0")"

echo "🔍 Checking for updates..."

# Fetch latest changes
git fetch origin main

# Check if there are updates
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" != "$REMOTE" ]; then
    echo "📥 New changes detected, pulling..."
    git pull origin main
    
    echo "📦 Installing dependencies..."
    npm install
    
    echo "🔄 Restarting bot..."
    
    # If using PM2
    if command -v pm2 &> /dev/null; then
        pm2 restart discord-bot || pm2 start index.js --name discord-bot
    else
        echo "⚠️  PM2 not found. Please restart manually or install PM2."
        echo "   To install PM2: npm install -g pm2"
    fi
    
    echo "✅ Bot updated and restarted!"
else
    echo "✅ Already up to date"
fi
