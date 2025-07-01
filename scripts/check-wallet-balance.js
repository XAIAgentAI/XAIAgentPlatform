/**
 * 检查服务端钱包余额脚本
 * 用于诊断流动性添加失败的原因
 */

const { createPublicClient, createWalletClient, http, formatEther, parseEther } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');

// 配置
const RPC_URL = 'https://rpc.dbcchain.ai';
const SERVER_PRIVATE_KEY = process.env.SERVER_WALLET_PRIVATE_KEY;
const XAA_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000'; // 需要实际的XAA地址
const TEST_TOKEN_ADDRESS = '0x80122dBaB24574E625A07d4DFAF90ff96d917363';

// ERC20 ABI
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }]
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }]
  }
];

/**
 * 检查代币余额
 */
async function checkTokenBalance(publicClient, tokenAddress, walletAddress, tokenName) {
  try {
    console.log(`\n🔍 检查 ${tokenName} 余额...`);
    console.log(`  - 代币地址: ${tokenAddress}`);
    console.log(`  - 钱包地址: ${walletAddress}`);

    const [balance, symbol, decimals] = await Promise.all([
      publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [walletAddress],
      }),
      publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'symbol',
        args: [],
      }).catch(() => 'UNKNOWN'),
      publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'decimals',
        args: [],
      }).catch(() => 18)
    ]);

    const balanceFormatted = formatEther(balance);
    
    console.log(`💰 ${tokenName} (${symbol}) 余额:`);
    console.log(`  - 原始余额: ${balance.toString()}`);
    console.log(`  - 格式化余额: ${balanceFormatted}`);
    console.log(`  - 小数位数: ${decimals}`);

    return {
      balance: balance.toString(),
      formatted: balanceFormatted,
      symbol,
      decimals
    };

  } catch (error) {
    console.error(`❌ 检查 ${tokenName} 余额失败:`, error.message);
    return null;
  }
}

/**
 * 计算流动性需求
 */
function calculateLiquidityRequirements(totalSupply, xaaPrice = 0.001) {
  console.log(`\n🧮 计算流动性需求...`);
  console.log(`  - 总供应量: ${totalSupply}`);
  console.log(`  - XAA价格比例: ${xaaPrice}`);

  const totalSupplyNum = parseFloat(totalSupply);
  const tokenAmount = totalSupplyNum * 0.1; // 10%
  const xaaAmount = tokenAmount * xaaPrice;

  console.log(`📊 计算结果:`);
  console.log(`  - 需要代币数量: ${tokenAmount} (10%)`);
  console.log(`  - 需要XAA数量: ${xaaAmount}`);

  return {
    tokenAmount: tokenAmount.toString(),
    xaaAmount: xaaAmount.toString()
  };
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始检查服务端钱包余额...');

  // 检查环境变量
  if (!SERVER_PRIVATE_KEY) {
    console.error('❌ 环境变量 SERVER_WALLET_PRIVATE_KEY 未设置');
    process.exit(1);
  }

  try {
    // 创建客户端
    const publicClient = createPublicClient({
      transport: http(RPC_URL)
    });

    const account = privateKeyToAccount(SERVER_PRIVATE_KEY);
    console.log(`🔑 服务端钱包地址: ${account.address}`);

    // 检查测试代币余额
    const tokenBalance = await checkTokenBalance(
      publicClient, 
      TEST_TOKEN_ADDRESS, 
      account.address, 
      '测试代币'
    );

    // 检查XAA余额（如果有XAA地址）
    let xaaBalance = null;
    if (XAA_TOKEN_ADDRESS !== '0x0000000000000000000000000000000000000000') {
      xaaBalance = await checkTokenBalance(
        publicClient, 
        XAA_TOKEN_ADDRESS, 
        account.address, 
        'XAA'
      );
    } else {
      console.log('\n⚠️ XAA代币地址未配置，跳过XAA余额检查');
    }

    // 计算流动性需求
    const requirements = calculateLiquidityRequirements('100000000000', 0.001);

    // 分析余额是否足够
    console.log('\n📊 余额分析:');
    
    if (tokenBalance) {
      const tokenSufficient = parseFloat(tokenBalance.formatted) >= parseFloat(requirements.tokenAmount);
      console.log(`  - 代币余额: ${tokenSufficient ? '✅ 充足' : '❌ 不足'}`);
      console.log(`    当前: ${tokenBalance.formatted}, 需要: ${requirements.tokenAmount}`);
    }

    if (xaaBalance) {
      const xaaSufficient = parseFloat(xaaBalance.formatted) >= parseFloat(requirements.xaaAmount);
      console.log(`  - XAA余额: ${xaaSufficient ? '✅ 充足' : '❌ 不足'}`);
      console.log(`    当前: ${xaaBalance.formatted}, 需要: ${requirements.xaaAmount}`);
    }

    // 建议
    console.log('\n💡 建议:');
    console.log('1. 确保服务端钱包有足够的代币余额');
    console.log('2. 确保服务端钱包有足够的XAA余额');
    console.log('3. 检查代币地址是否正确');
    console.log('4. 检查XAA代币地址配置');
    console.log('5. 考虑调整XAA价格比例以减少XAA需求');

    // 关于流动性添加的说明
    console.log('\n📚 关于流动性添加:');
    console.log('- Uniswap V3 流动性添加需要两种代币');
    console.log('- 代币A: 您的项目代币 (10%总供应量)');
    console.log('- 代币B: XAA代币 (根据价格比例计算)');
    console.log('- 两种代币都必须在服务端钱包中有足够余额');
    console.log('- 价格比例决定了需要多少XAA代币');

  } catch (error) {
    console.error('❌ 检查失败:', error);
  }
}

// 运行脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, checkTokenBalance, calculateLiquidityRequirements };
