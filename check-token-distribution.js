const { createPublicClient, http, formatEther } = require('viem');
const { base } = require('viem/chains');

// 配置
const TOKEN_ADDRESS = '0xc182ce5305681BbE4Ec90Feb3ECE5C9f476e46a1'; // 从错误日志中获取
const TOTAL_SUPPLY = '100000000000'; // 1000亿

// 相关地址
const ADDRESSES = {
  SERVER_WALLET: '0x417Dd0DDAA54E651e304A12c9810173F57876159',
  CREATOR: '0xde184a6809898d81186def5c0823d2107c001da2',
  IAO_CONTRACT: '0x17EbDa9BEB150EA73a2B0dd690266ACaFCd40295',
  AIRDROP_WALLET: '0x8ef54e57dFB0b84Eb909072B699057Ef9517704a',
  MINING_CONTRACT: '0x6B0B8F74aaCe9731a2f5fc45c64bbd72075dBfDB'
};

// ERC20 ABI (只需要balanceOf和totalSupply)
const ERC20_ABI = [
  {
    "inputs": [{"name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

async function checkTokenDistribution() {
  try {
    // 创建公共客户端
    const publicClient = createPublicClient({
      chain: base,
      transport: http(),
    });

    console.log('🔍 检查代币分配情况...');
    console.log(`代币地址: ${TOKEN_ADDRESS}`);
    console.log(`理论总供应量: ${TOTAL_SUPPLY} (1000亿)\n`);

    // 1. 检查实际总供应量
    const actualTotalSupply = await publicClient.readContract({
      address: TOKEN_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'totalSupply',
    });

    const actualTotalSupplyFormatted = (Number(actualTotalSupply) / 1e18).toFixed(0);
    console.log(`📊 实际总供应量: ${actualTotalSupplyFormatted} (${actualTotalSupply.toString()} wei)`);
    console.log(`总供应量匹配: ${actualTotalSupplyFormatted === TOTAL_SUPPLY ? '✅' : '❌'}\n`);

    // 2. 检查各地址余额
    console.log('💰 各地址代币余额:');
    
    let totalChecked = BigInt(0);
    const results = [];

    for (const [name, address] of Object.entries(ADDRESSES)) {
      try {
        const balance = await publicClient.readContract({
          address: TOKEN_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [address],
        });

        const balanceFormatted = (Number(balance) / 1e18).toFixed(0);
        const percentage = (Number(balance) * 100 / Number(actualTotalSupply)).toFixed(2);
        
        totalChecked += balance;
        results.push({
          name,
          address,
          balance: balanceFormatted,
          percentage,
          wei: balance.toString()
        });

        console.log(`  ${name}:`);
        console.log(`    地址: ${address}`);
        console.log(`    余额: ${balanceFormatted} (${percentage}%)`);
        console.log(`    Wei: ${balance.toString()}\n`);
      } catch (error) {
        console.log(`  ${name}: 查询失败 - ${error.message}\n`);
      }
    }

    // 3. 汇总分析
    const totalCheckedFormatted = (Number(totalChecked) / 1e18).toFixed(0);
    const accountedPercentage = (Number(totalChecked) * 100 / Number(actualTotalSupply)).toFixed(2);
    
    console.log('📈 分配汇总:');
    console.log(`已检查地址总余额: ${totalCheckedFormatted} (${accountedPercentage}%)`);
    console.log(`未分配/其他地址: ${(Number(actualTotalSupply) - Number(totalChecked)) / 1e18} (${(100 - Number(accountedPercentage)).toFixed(2)}%)`);

    // 4. 理论分配对比
    console.log('\n🎯 理论分配对比:');
    const expectedDistribution = {
      'CREATOR': { expected: 33, actual: 0 },
      'IAO_CONTRACT': { expected: 15, actual: 0 },
      'SERVER_WALLET': { expected: 52, actual: 0 }, // 应该是剩余的52% (100% - 33% - 15%)
      'AIRDROP_WALLET': { expected: 2, actual: 0 },
      'MINING_CONTRACT': { expected: 40, actual: 0 }
    };

    results.forEach(result => {
      if (expectedDistribution[result.name]) {
        expectedDistribution[result.name].actual = parseFloat(result.percentage);
      }
    });

    for (const [name, data] of Object.entries(expectedDistribution)) {
      const status = Math.abs(data.expected - data.actual) < 1 ? '✅' : '❌';
      console.log(`  ${name}: 期望${data.expected}%, 实际${data.actual}% ${status}`);
    }

    // 5. 问题诊断
    console.log('\n🔍 问题诊断:');
    const serverWalletResult = results.find(r => r.name === 'SERVER_WALLET');
    if (serverWalletResult) {
      const serverBalance = parseFloat(serverWalletResult.balance);
      if (serverBalance === 10000000000) { // 100亿
        console.log('✅ 服务端钱包确实只有100亿代币 (10%)');
        console.log('💡 这说明代币创建时就按比例分配了，而不是全部给服务端钱包');
      }
    }

  } catch (error) {
    console.error('❌ 检查失败:', error);
  }
}

// 运行检查
checkTokenDistribution();
