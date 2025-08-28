import { defineConfig } from 'vitest/config'
import path from 'path'
import { loadEnv } from 'vite'
import dotenv from 'dotenv'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig(({ mode }) => {
  // 按优先级加载所有环境文件
  // .env.local > .env.development/.env.test > .env
  dotenv.config({ path: '.env' })
  dotenv.config({ path: '.env.local', override: true })
  
  // 也使用 vite 的 loadEnv 作为备用
  const env = loadEnv(mode, process.cwd(), '')
  
  // 确保关键环境变量被加载
  console.log('🔍 检查环境变量加载状态:')
  console.log('  - SERVER_WALLET_PRIVATE_KEY 存在:', !!process.env.SERVER_WALLET_PRIVATE_KEY)
  console.log('  - JWT_SECRET 存在:', !!process.env.JWT_SECRET)
  
  return {
    plugins: [tsconfigPaths()], // 添加 tsconfig paths 插件
    test: {
      environment: 'node',
      // 集成测试需要更长的超时时间
      testTimeout: 30000,
      // 集成测试通常需要顺序执行，避免数据库冲突
      pool: 'forks',
      poolOptions: {
        forks: {
          singleFork: true
        }
      },
      // 合并环境变量
      env: {
        ...env,
        ...process.env // 使用 dotenv 加载后的 process.env
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})