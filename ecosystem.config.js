module.exports = {
  apps: [
    {
      name: 'lojisto-api',
      script: 'dist/main.js',
      cwd: '/home/ubuntu/lojisto-api',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 8000
      },
      error_file: '/home/ubuntu/logs/lojisto-api-error.log',
      out_file: '/home/ubuntu/logs/lojisto-api-out.log',
      log_file: '/home/ubuntu/logs/lojisto-api-combined.log',
      time: true
    }
  ]
};
