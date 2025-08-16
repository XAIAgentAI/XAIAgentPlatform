#!/usr/bin/env node

/**
 * 开发环境空投接口测试脚本
 * 使用方法: node scripts/test-dev-airdrop.js
 */

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const API_ENDPOINT = `${BASE_URL}/api/airdrop/dev-send`;

// 测试钱包地址（从你的数据中获取的）
const TEST_WALLET = '0xf9E35854306FDC9C4b75318e7F4c4a4596408B64';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// 测试用例
const testCases = [
  {
    name: '检查服务状态',
    method: 'GET',
    body: null
  },
  {
    name: '发送XAA代币空投',
    method: 'POST',
    body: {
      walletAddress: TEST_WALLET,
      amount: '10',
      tokenType: 'XAA',
      description: '测试空投 - XAA代币'
    }
  },
  {
    name: '发送USERAGENT代币空投',
    method: 'POST',
    body: {
      walletAddress: TEST_WALLET,
      amount: '5.5',
      tokenType: 'USERAGENT',
      description: '测试空投 - USERAGENT代币'
    }
  },
  {
    name: '发送SIC代币空投',
    method: 'POST',
    body: {
      walletAddress: TEST_WALLET,
      amount: '20',
      tokenType: 'SIC',
      description: '测试空投 - SIC代币'
    }
  },
  {
    name: '测试无效钱包地址',
    method: 'POST',
    body: {
      walletAddress: '0xinvalid',
      amount: '1',
      tokenType: 'XAA'
    }
  },
  {
    name: '测试无效数量',
    method: 'POST',
    body: {
      walletAddress: TEST_WALLET,
      amount: 'abc',
      tokenType: 'XAA'
    }
  }
];

async function runTest(testCase) {
  logInfo(`\n🧪 运行测试: ${testCase.name}`);
  
  try {
    const options = {
      method: testCase.method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (testCase.body) {
      options.body = JSON.stringify(testCase.body);
    }

    const response = await fetch(API_ENDPOINT, options);
    const data = await response.json();

    if (response.ok && data.success) {
      logSuccess(`${testCase.name} - 成功`);
      if (data.data) {
        console.log('   响应数据:', JSON.stringify(data.data, null, 2));
      }
    } else {
      logWarning(`${testCase.name} - 预期失败`);
      console.log('   错误信息:', data.message);
      if (data.error) {
        console.log('   错误详情:', data.error);
      }
    }

    return { success: response.ok, data };

  } catch (error) {
    logError(`${testCase.name} - 请求失败`);
    console.log('   错误:', error.message);
    return { success: false, error: error.message };
  }
}

async function runAllTests() {
  log(`\n${colors.bright}🚀 开始测试开发环境空投接口${colors.reset}`);
  log(`📍 接口地址: ${API_ENDPOINT}`);
  log(`🔑 测试钱包: ${TEST_WALLET}`);
  log(`⏰ 开始时间: ${new Date().toLocaleString()}\n`);

  const results = [];
  
  for (const testCase of testCases) {
    const result = await runTest(testCase);
    results.push({
      name: testCase.name,
      ...result
    });
    
    // 添加延迟，避免请求过快
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // 输出测试总结
  log(`\n${colors.bright}📊 测试总结${colors.reset}`);
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  log(`总测试数: ${totalCount}`);
  log(`成功: ${successCount}`, successCount === totalCount ? 'green' : 'yellow');
  log(`失败: ${totalCount - successCount}`, successCount === totalCount ? 'green' : 'red');
  
  if (successCount < totalCount) {
    logWarning('\n⚠️  部分测试失败，请检查：');
    results.forEach(result => {
      if (!result.success) {
        console.log(`   - ${result.name}: ${result.error || '请求失败'}`);
      }
    });
  } else {
    logSuccess('\n🎉 所有测试通过！');
  }

  log(`\n⏰ 结束时间: ${new Date().toLocaleString()}`);
}

// 检查环境
function checkEnvironment() {
  logInfo('🔍 检查运行环境...');
  
  if (process.env.NODE_ENV === 'production') {
    logWarning('当前环境为生产环境，建议在开发环境中运行测试');
  } else {
    logSuccess('当前环境为开发环境');
  }
  
  if (process.env.NEXT_PUBLIC_IS_TEST_ENV === 'true') {
    logSuccess('测试网环境已启用');
  } else {
    logWarning('测试网环境未启用，某些功能可能不可用');
  }
  
  logInfo('环境检查完成\n');
}

// 主函数
async function main() {
  try {
    checkEnvironment();
    await runAllTests();
  } catch (error) {
    logError('测试运行失败');
    console.error(error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { runAllTests, runTest }; 