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
      kill_timeout: 5000,
      listen_timeout: 10000,
      wait_ready: true,
      // Opcional: força o PM2 a esperar pelo evento 'ready' do Next (já emitido internamente)
    }
  ]
};
