/**
 * Next.js Instrumentation Hook
 * 在服务器启动时自动执行，用于初始化后台服务
 * 
 * 文档: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // 只在服务器端执行
  if (process.env.NEXT_RUNTIME === 'nodejs') {
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
          
          // 重试机制
          console.log('⏰ 30秒后重试启动事件监听器...');
          setTimeout(async () => {
            try {
              await startContractEventListener();
              console.log('✅ 事件监听器重试启动成功');
            } catch (retryError) {
              console.error('❌ 事件监听器重试失败:', retryError);
              console.log('💡 可以通过 API 手动启动: POST /api/events/start');
            }
          }, 30000);
        }
      }, 5000); // 5秒后启动
      
    } catch (error) {
      console.error('❌ 初始化后台服务失败:', error);
    }
  }
}
