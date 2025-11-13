module.exports = {
  apps: [{
    name: "discord-bot",
    script: "index.js",
    watch: false,
    instances: 1,
    autorestart: true,
    max_restarts: 10,
    min_uptime: "10s",
    env: {
      NODE_ENV: "production"
    },
    error_file: "logs/error.log",
    out_file: "logs/output.log",
    log_date_format: "YYYY-MM-DD HH:mm:ss Z"
  }]
};
