module.exports = {
    apps: [{
      name: "xaiagentplatform-prod",    // 修改为生产环境的应用名称
      script: "server.js",              // 直接使用 server.js
      instances: 1,                     // 限制实例数量为1个
      exec_mode: "fork",                // 使用 fork 模式
      watch: false,                     // 生产环境关闭 watch
      max_memory_restart: "1G",         // 内存限制
      node_args: "--max-old-space-size=1024",
      listen_timeout: 50000,
      kill_timeout: 5000,
      max_restarts: 5,
      min_uptime: "5m",
      source_map_support: false,
      autorestart: true,
      exp_backoff_restart_delay: 100,
      env: {
        NODE_ENV: "production",
        PORT: 3001
      }
    },
    {
      name: "xaiagentplatform",     // 开发/测试环境
      script: "server.js",              
      instances: 1,
      exec_mode: "fork",
      watch: true,                      
      ignore_watch: ["node_modules", "logs"], 
      max_memory_restart: "1G",
      node_args: "--max-old-space-size=1024",
      listen_timeout: 50000,
      kill_timeout: 5000,
      max_restarts: 5,
      min_uptime: "5m",
      source_map_support: true,         
      autorestart: true,
      exp_backoff_restart_delay: 100,
      env: {
        NODE_ENV: "production",             
        PORT: 3000
      }
    }]
  } 