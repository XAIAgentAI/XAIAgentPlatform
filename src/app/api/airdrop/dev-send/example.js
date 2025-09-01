/**
 * 开发环境空投接口使用示例
 * 这些示例展示了如何在代码中使用空投接口
 */

// 示例1: 基本空投请求
async function basicAirdrop() {
  try {
    const response = await fetch('/api/airdrop/dev-send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress: '0xf9E35854306FDC9C4b75318e7F4c4a4596408B64',
        amount: '100',
        tokenType: 'XAA',
        description: '开发测试空投'
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('空投成功!', result.data);
      return result.data;
    } else {
      console.error('空投失败:', result.message);
      return null;
    }
  } catch (error) {
    console.error('请求失败:', error);
    return null;
  }
}

// 示例2: 批量空投
async function batchAirdrop(wallets, amount, tokenType = 'XAA') {
  const results = [];
  
  for (const wallet of wallets) {
    try {
      console.log(`正在给 ${wallet} 发送空投...`);
      
      const response = await fetch('/api/airdrop/dev-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: wallet,
          amount: amount.toString(),
          tokenType,
          description: `批量空投 - ${amount} ${tokenType}`
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ ${wallet} 空投成功`);
        results.push({ wallet, success: true, data: result.data });
      } else {
        console.error(`❌ ${wallet} 空投失败:`, result.message);
        results.push({ wallet, success: false, error: result.message });
      }
      
      // 添加延迟，避免请求过快
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`❌ ${wallet} 请求失败:`, error.message);
      results.push({ wallet, success: false, error: error.message });
    }
  }
  
  return results;
}

// 示例3: 检查服务状态
async function checkServiceStatus() {
  try {
    const response = await fetch('/api/airdrop/dev-send');
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ 空投服务可用');
      console.log('服务信息:', result.data);
      return result.data;
    } else {
      console.log('❌ 空投服务不可用:', result.message);
      return null;
    }
  } catch (error) {
    console.error('检查服务状态失败:', error);
    return null;
  }
}

// 示例4: 带重试的空投
async function airdropWithRetry(walletAddress, amount, tokenType = 'XAA', maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`尝试 ${attempt}/${maxRetries} 给 ${walletAddress} 发送空投...`);
      
      const response = await fetch('/api/airdrop/dev-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          amount: amount.toString(),
          tokenType,
          description: `重试空投 (${attempt}/${maxRetries})`
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ 空投成功 (尝试 ${attempt})`);
        return result.data;
      } else {
        console.log(`⚠️ 空投失败 (尝试 ${attempt}):`, result.message);
        
        if (attempt === maxRetries) {
          throw new Error(`空投失败，已重试 ${maxRetries} 次: ${result.message}`);
        }
        
        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
    } catch (error) {
      console.error(`❌ 请求失败 (尝试 ${attempt}):`, error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

// 示例5: 空投历史记录
async function getAirdropHistory() {
  // 这里可以调用你的数据库或日志系统来获取空投历史
  // 示例返回模拟数据
  return [
    {
      timestamp: new Date().toISOString(),
      walletAddress: '0xf9E35854306FDC9C4b75318e7F4c4a4596408B64',
      amount: '100',
      tokenType: 'XAA',
      status: 'success',
      transactionHash: '0x...',
      description: '开发测试空投'
    }
  ];
}

// 导出所有示例函数
export {
  basicAirdrop,
  batchAirdrop,
  checkServiceStatus,
  airdropWithRetry,
  getAirdropHistory
};

// 如果直接运行此文件，执行示例
if (typeof window !== 'undefined') {
  // 浏览器环境
  window.devAirdropExamples = {
    basicAirdrop,
    batchAirdrop,
    checkServiceStatus,
    airdropWithRetry,
    getAirdropHistory
  };
  
  console.log('🚀 开发环境空投示例已加载到 window.devAirdropExamples');
  console.log('使用方法:');
  console.log('- 单个空投: devAirdropExamples.basicAirdrop()');
  console.log('- 检查状态: devAirdropExamples.checkServiceStatus()');
  console.log('- 批量空投: devAirdropExamples.batchAirdrop([address1, address2], 100)');
} 