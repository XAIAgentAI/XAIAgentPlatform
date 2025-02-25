// 定时请求价格更新接口
async function updatePrices() {
  try {
    console.log('开始更新价格...', new Date().toLocaleString());
    
    const response = await fetch('http://localhost:3000/api/cron/update-prices');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('更新成功:', data);
    return data;
  } catch (error) {
    console.error('更新失败:', error);
    throw error;
  }
}

// 循环执行函数
async function runUpdateLoop() {
  const INTERVAL = 10000; // 10秒
  
  console.log('启动价格更新循环，间隔：10秒');
  
  while (true) {
    try {
      await updatePrices();
    } catch (error) {
      console.error('请求失败:', error);
    }
    
    // 等待10秒
    await new Promise(resolve => setTimeout(resolve, INTERVAL));
  }
}

// 根据环境决定是否循环执行
if (process.env.NODE_ENV === 'development') {
  // 开发环境：循环执行
  runUpdateLoop().catch(error => {
    console.error('循环执行失败:', error);
    process.exit(1);
  });
} else {
  // 生产环境：执行一次
  updatePrices()
    .then(() => {
      console.log('价格更新完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('价格更新失败:', error);
      process.exit(1);
    });
} 