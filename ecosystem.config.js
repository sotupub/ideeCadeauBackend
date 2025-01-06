module.exports = {
  apps: [{
    name: "ideecadeau-backend",
    script: "./dist/src/server.js",
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "1G",
    env: {
      NODE_ENV: "development",
    },
    env_production: {
      NODE_ENV: "production"
    }
  }]
}
