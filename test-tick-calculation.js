// 测试tick计算逻辑
console.log('🧮 测试tick计算逻辑...\n');

// 模拟不同的当前tick值
const testTicks = [0, 100, -100, 1000, -1000, 5000, -5000, 16000, -16000];

const tickSpacing = 10;
const tickRange = 1000;

console.log('📊 测试结果:');
console.log('当前tick | tickLower | tickUpper | 价格下限 | 价格上限');
console.log('---------|----------|----------|----------|----------');

testTicks.forEach(currentTick => {
  const tickLower = Math.floor((currentTick - tickRange) / tickSpacing) * tickSpacing;
  const tickUpper = Math.floor((currentTick + tickRange) / tickSpacing) * tickSpacing;
  
  const priceLower = Math.pow(1.0001, tickLower);
  const priceUpper = Math.pow(1.0001, tickUpper);
  
  console.log(`${currentTick.toString().padStart(8)} | ${tickLower.toString().padStart(9)} | ${tickUpper.toString().padStart(9)} | ${priceLower.toFixed(4).padStart(8)} | ${priceUpper.toFixed(4).padStart(8)}`);
});

console.log('\n🔍 分析原始错误的tick范围:');
const originalTickLower = -16100;
const originalTickUpper = 16090;
const originalPriceLower = Math.pow(1.0001, originalTickLower);
const originalPriceUpper = Math.pow(1.0001, originalTickUpper);

console.log(`原始tickLower: ${originalTickLower}`);
console.log(`原始tickUpper: ${originalTickUpper}`);
console.log(`原始价格下限: ${originalPriceLower.toFixed(6)}`);
console.log(`原始价格上限: ${originalPriceUpper.toFixed(6)}`);

console.log('\n💡 问题分析:');
console.log('原始的tick范围是固定的 -16100 到 16090，对应价格范围约 0.2 到 5.0');
console.log('如果当前池子的tick不在这个范围内，就会出现 "Price slippage check" 错误');
console.log('');
console.log('修复方案:');
console.log('1. 动态获取当前池子的tick值');
console.log('2. 基于当前tick计算合理的范围（上下各1000个tick）');
console.log('3. 确保当前tick始终在tickLower和tickUpper之间');

console.log('\n✅ 修复后的优势:');
console.log('- 适应任何价格的池子');
console.log('- 避免固定价格范围的限制');
console.log('- 确保流动性添加成功');
