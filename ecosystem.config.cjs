module.exports = {
  apps: [
    {
      name: 'fitness-server',
      cwd: './server',
      script: 'dist/index.js',
      interpreter: 'node',
      env: { NODE_ENV: 'production' },
      instances: 1,
      exec_mode: 'fork',
    },
  ],
};
