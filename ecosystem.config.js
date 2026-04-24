module.exports = {
  apps: [
    {
      name: "autotrack",
      cwd: "/var/www/html/autotrack",
      script: "node_modules/.bin/next",
      args: "start",
      exec_mode: "fork",
      instances: 1,
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};
