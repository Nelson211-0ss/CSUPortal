// PM2 process definition for the VPS. Usage:
//   pm2 start ecosystem.config.cjs
//   pm2 save && pm2 startup   (so it survives a reboot)
module.exports = {
  apps: [
    {
      name: "csu-portal-api",
      script: "server/index.js",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
      },
      // .env (see .env.example) is loaded by the app itself via dotenv.
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "300M",
    },
  ],
};
