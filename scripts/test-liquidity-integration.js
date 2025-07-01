/**
 * 测试流动性集成脚本
 * 用于验证流动性添加功能是否正确集成到代币分发流程中
 */

const API_BASE_URL = 'http://localhost:3000';

// 测试数据
const TEST_DATA = {
  agentId: 'test-agent-id',
  tokenAddress: '0x80122dBaB24574E625A07d4DFAF90ff96d917363',
  totalSupply: '1000000'
};

/**
 * 测试代币分发接口（包含流动性添加）
 */
async function testTokenDistribution() {
  console.log('🧪 测试代币分发接口（包含流动性添加）...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/token/distribute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agentId: TEST_DATA.agentId,
        totalSupply: TEST_DATA.totalSupply,
        tokenAddress: TEST_DATA.tokenAddress,
        includeBurn: false
      })
    });

    const result = await response.json();
    
    console.log('📊 代币分发结果:');
    console.log(`  - 状态码: ${result.code}`);
    console.log(`  - 消息: ${result.message}`);
    
    if (result.data?.transactions) {
      console.log(`  - 交易数量: ${result.data.transactions.length}`);
      
      // 查找流动性交易
      const liquidityTx = result.data.transactions.find(tx => tx.type === 'liquidity');
      if (liquidityTx) {
        console.log('💧 流动性交易详情:');
        console.log(`    - 状态: ${liquidityTx.status}`);
        console.log(`    - 数量: ${liquidityTx.amount}`);
        console.log(`    - 交易哈希: ${liquidityTx.txHash}`);
        console.log(`    - 池子地址: ${liquidityTx.toAddress}`);
        if (liquidityTx.error) {
          console.log(`    - 错误: ${liquidityTx.error}`);
        }
      } else {
        console.log('⚠️ 未找到流动性交易');
      }
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ 代币分发测试失败:', error);
    return null;
  }
}

/**
 * 测试单独的流动性分发接口
 */
async function testLiquidityDistribution() {
  console.log('\n🧪 测试单独的流动性分发接口...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/distribution/liquidity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'single',
        agentId: TEST_DATA.agentId,
        tokenAddress: TEST_DATA.tokenAddress,
        totalSupply: TEST_DATA.totalSupply,
        xaaPrice: 1
      })
    });

    const result = await response.json();
    
    console.log('📊 流动性分发结果:');
    console.log(`  - 状态码: ${result.code}`);
    console.log(`  - 消息: ${result.message}`);
    
    if (result.data) {
      console.log('💧 流动性详情:');
      console.log(`    - 成功: ${result.data.success || result.success}`);
      console.log(`    - 池子地址: ${result.data.poolAddress || 'N/A'}`);
      console.log(`    - 交易哈希: ${result.data.txHash || 'N/A'}`);
      console.log(`    - 代币数量: ${result.data.tokenAmount || 'N/A'}`);
      console.log(`    - XAA数量: ${result.data.xaaAmount || 'N/A'}`);
      if (result.data.error || result.error) {
        console.log(`    - 错误: ${result.data.error || result.error}`);
      }
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ 流动性分发测试失败:', error);
    return null;
  }
}

/**
 * 测试流动性分发状态查询
 */
async function testLiquidityStatus() {
  console.log('\n🧪 测试流动性分发状态查询...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/distribution/liquidity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'status',
        agentId: TEST_DATA.agentId
      })
    });

    const result = await response.json();
    
    console.log('📊 状态查询结果:');
    console.log(`  - 状态码: ${result.code}`);
    console.log(`  - 消息: ${result.message}`);
    
    if (result.data) {
      console.log('📋 Agent状态:');
      console.log(`    - Agent ID: ${result.data.agentId}`);
      console.log(`    - 流动性已添加: ${result.data.liquidityAdded}`);
      console.log(`    - 代币地址: ${result.data.tokenAddress || 'N/A'}`);
      console.log(`    - 计算的代币数量: ${result.data.calculatedTokenAmount || 'N/A'}`);
      console.log(`    - 计算的XAA数量: ${result.data.calculatedXaaAmount || 'N/A'}`);
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ 状态查询测试失败:', error);
    return null;
  }
}

/**
 * 主测试函数
 */
async function runTests() {
  console.log('🚀 开始流动性集成测试...');
  console.log(`📝 测试数据: Agent ID = ${TEST_DATA.agentId}`);
  console.log(`📝 代币地址: ${TEST_DATA.tokenAddress}`);
  console.log(`📝 总供应量: ${TEST_DATA.totalSupply}`);
  console.log('=' .repeat(60));
  
  // 测试1: 代币分发接口（包含流动性）
  const distributionResult = await testTokenDistribution();
  
  // 测试2: 单独的流动性分发接口
  const liquidityResult = await testLiquidityDistribution();
  
  // 测试3: 状态查询
  const statusResult = await testLiquidityStatus();
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 测试总结:');
  console.log(`  - 代币分发测试: ${distributionResult ? '✅ 完成' : '❌ 失败'}`);
  console.log(`  - 流动性分发测试: ${liquidityResult ? '✅ 完成' : '❌ 失败'}`);
  console.log(`  - 状态查询测试: ${statusResult ? '✅ 完成' : '❌ 失败'}`);
  
  console.log('\n💡 使用说明:');
  console.log('1. 确保服务器运行在 http://localhost:3000');
  console.log('2. 确保环境变量 SERVER_WALLET_PRIVATE_KEY 已配置');
  console.log('3. 确保测试Agent存在且有有效的代币地址');
  console.log('4. 检查服务端钱包是否有足够的代币和XAA余额');
  console.log('');
  console.log('🔧 新配置:');
  console.log('- 手续费: 0.05% (500)');
  console.log('- Tick间距: 10');
  console.log('- 价格范围: 20% - 500%');
  console.log('- 代币价格: IAO结束价格 + 2%');
}

// 运行测试
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testTokenDistribution,
  testLiquidityDistribution,
  testLiquidityStatus,
  runTests
};
