/**
 * Next.js Instrumentation Hook
 * 在服务器启动时自动执行，用于初始化后台服务
 * 
 * 文档: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

let isInitialized = false; // 防止重复初始化

export async function register() {
  // 只在服务器端执行
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    if (isInitialized) {
      console.log('⚠️ 后台服务已初始化，跳过重复初始化');
      return;
    }

    isInitialized = true;
    console.log('🔧 Next.js 服务器启动，开始初始化后台服务...');

    try {
      // 动态导入避免在客户端执行
      const { startContractEventListener } = await import('./services/contractEventListener');

      // 延迟启动，确保数据库等基础设施就绪
      setTimeout(async () => {
        try {
          console.log('📡 启动合约事件监听器...');
          await startContractEventListener();
          console.log('✅ 合约事件监听器启动成功');
        } catch (error) {
          console.error('❌ 合约事件监听器启动失败:', error);
          console.log('💡 可以通过 API 手动启动: POST /api/restart-listener');
          // 移除自动重试，避免无限循环
        }
      }, 5000); // 5秒后启动

    } catch (error) {
      console.error('❌ 初始化后台服务失败:', error);
    }
  }
}
