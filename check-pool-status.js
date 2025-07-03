const { createPublicClient, http } = require('viem');
const { base } = require('viem/chains');

// 配置
const POOL_ADDRESS = '0x4beaBad211A47516433cA4d0974EcF68a57bb18d'; // 从错误日志中获取的token地址
const XAA_TOKEN_ADDRESS = '0x8a88a1D2bD0a13BA245a4147b7e11Ef1A9d15C8a';
const V3_FACTORY = '0x33128a8fC17869897dcE68Ed026d694621f6FDfD';
const FEE = 500;

// ABI
const POOL_ABI = [
  {
    "inputs": [],
    "name": "slot0",
    "outputs": [
      {"internalType": "uint160", "name": "sqrtPriceX96", "type": "uint160"},
      {"internalType": "int24", "name": "tick", "type": "int24"},
      {"internalType": "uint16", "name": "observationIndex", "type": "uint16"},
      {"internalType": "uint16", "name": "observationCardinality", "type": "uint16"},
      {"internalType": "uint16", "name": "observationCardinalityNext", "type": "uint16"},
      {"internalType": "uint8", "name": "feeProtocol", "type": "uint8"},
      {"internalType": "bool", "name": "unlocked", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

const V3_FACTORY_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "tokenA", "type": "address"},
      {"internalType": "address", "name": "tokenB", "type": "address"},
      {"internalType": "uint24", "name": "fee", "type": "uint24"}
    ],
    "name": "getPool",
    "outputs": [{"internalType": "address", "name": "pool", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
];

async function checkPoolStatus() {
  try {
    // 创建公共客户端
    const publicClient = createPublicClient({
      chain: base,
      transport: http(),
    });

    console.log('🔍 检查池子状态...');
    console.log(`Token地址: ${POOL_ADDRESS}`);
    console.log(`XAA地址: ${XAA_TOKEN_ADDRESS}`);
    console.log(`手续费: ${FEE}`);

    // 1. 获取池子地址
    const poolAddress = await publicClient.readContract({
      address: V3_FACTORY,
      abi: V3_FACTORY_ABI,
      functionName: 'getPool',
      args: [POOL_ADDRESS, XAA_TOKEN_ADDRESS, FEE],
    });

    console.log(`\n📍 池子地址: ${poolAddress}`);

    if (!poolAddress || poolAddress === '0x0000000000000000000000000000000000000000') {
      console.log('❌ 池子不存在！');
      return;
    }

    // 2. 获取池子状态
    const slot0 = await publicClient.readContract({
      address: poolAddress,
      abi: POOL_ABI,
      functionName: 'slot0',
    });

    const [sqrtPriceX96, tick, observationIndex, observationCardinality, observationCardinalityNext, feeProtocol, unlocked] = slot0;

    console.log('\n📊 池子状态:');
    console.log(`sqrtPriceX96: ${sqrtPriceX96.toString()}`);
    console.log(`当前tick: ${tick}`);
    console.log(`observationIndex: ${observationIndex}`);
    console.log(`observationCardinality: ${observationCardinality}`);
    console.log(`observationCardinalityNext: ${observationCardinalityNext}`);
    console.log(`feeProtocol: ${feeProtocol}`);
    console.log(`unlocked: ${unlocked}`);

    // 3. 计算当前价格
    if (sqrtPriceX96 > 0) {
      // price = (sqrtPriceX96 / 2^96)^2
      const price = Math.pow(Number(sqrtPriceX96) / Math.pow(2, 96), 2);
      console.log(`\n💰 当前价格: ${price}`);
    } else {
      console.log('\n❌ 池子未初始化 (sqrtPriceX96 = 0)');
    }

    // 4. 分析tick范围问题
    console.log('\n🎯 Tick范围分析:');
    console.log(`当前tick: ${tick}`);
    console.log(`错误日志中的tickLower: -16100`);
    console.log(`错误日志中的tickUpper: 16090`);
    
    const tickLower = -16100;
    const tickUpper = 16090;
    
    console.log(`\n📈 Tick范围检查:`);
    console.log(`当前tick (${tick}) >= tickLower (${tickLower}): ${tick >= tickLower}`);
    console.log(`当前tick (${tick}) < tickUpper (${tickUpper}): ${tick < tickUpper}`);
    console.log(`tick在范围内: ${tick >= tickLower && tick < tickUpper}`);

    // 5. 计算建议的tick范围
    console.log('\n💡 建议的tick范围计算:');
    
    // 对于0.05%手续费，tick间距是10
    const tickSpacing = 10;
    
    // 基于当前tick计算合理的范围
    const currentTickRounded = Math.floor(tick / tickSpacing) * tickSpacing;
    const suggestedTickLower = currentTickRounded - 1000; // 向下1000个tick
    const suggestedTickUpper = currentTickRounded + 1000; // 向上1000个tick
    
    // 确保tick符合间距要求
    const finalTickLower = Math.floor(suggestedTickLower / tickSpacing) * tickSpacing;
    const finalTickUpper = Math.floor(suggestedTickUpper / tickSpacing) * tickSpacing;
    
    console.log(`当前tick (rounded): ${currentTickRounded}`);
    console.log(`建议tickLower: ${finalTickLower}`);
    console.log(`建议tickUpper: ${finalTickUpper}`);
    
    // 6. 计算价格范围
    const priceLower = Math.pow(1.0001, finalTickLower);
    const priceUpper = Math.pow(1.0001, finalTickUpper);
    const currentPrice = Math.pow(1.0001, tick);
    
    console.log(`\n💰 价格范围:`);
    console.log(`当前价格: ${currentPrice.toFixed(6)}`);
    console.log(`价格下限: ${priceLower.toFixed(6)}`);
    console.log(`价格上限: ${priceUpper.toFixed(6)}`);

  } catch (error) {
    console.error('❌ 检查失败:', error);
  }
}

// 运行检查
checkPoolStatus();
