module.exports = {
    apps: [
      {
        name: 'xaiagentplatform-dev',
        script: 'server.js',
        env: {
          NODE_ENV: 'development',
          PORT: 3000
        }
      },
      {
        name: 'xaiagentplatform-prod',
        script: 'server.js',
        env: {
          NODE_ENV: 'production',
          PORT: 3001
        }
      }
    ]
  } 