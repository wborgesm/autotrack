module.exports = {
  apps: [
    {
      name: "autotrack",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "/var/www/html/autotrack",
      exec_mode: "cluster",
      instances: 2,
      env: {
        NODE_ENV: "production",
        PORT: 3000
      },
      // Aguarda 5s entre o kill e o restart (graceful shutdown)
      kill_timeout: 5000,
      // Aguarda a nova instância estar pronta antes de matar a antiga
      listen_timeout: 10000
    }
  ]
};
