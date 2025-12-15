module.exports = {
  apps: [
    {
      name: "backend",
      script: "./app.js", // or app.js / index.js
      instances: 1, // or "max" for cluster mode
      exec_mode: "fork",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};
