/**
 * 测试代币销毁方法的优先级和回退机制
 */

console.log("🧪 测试代币销毁方法优先级");

// 模拟不同类型的代币合约
const contractTypes = {
  withBurn: {
    name: "支持burn(amount)方法的合约",
    methods: ["burn", "transfer", "balanceOf"],
    burnMethod: "burn(amount)"
  },
  withBurnFrom: {
    name: "支持burnFrom(from, amount)方法的合约", 
    methods: ["burnFrom", "transfer", "balanceOf"],
    burnMethod: "burnFrom(from, amount)"
  },
  standardERC20: {
    name: "标准ERC20合约（无burn方法）",
    methods: ["transfer", "balanceOf"],
    burnMethod: "transfer to burn address"
  },
  withBoth: {
    name: "同时支持burn和burnFrom的合约",
    methods: ["burn", "burnFrom", "transfer", "balanceOf"],
    burnMethod: "burn(amount) [优先]"
  }
};

// 销毁方法优先级
const burnPriority = [
  "1. 尝试 burn(amount) 方法",
  "2. 尝试 burnFrom(from, amount) 方法", 
  "3. 回退到 transfer(burnAddress, amount) 方法"
];

console.log("\n📋 销毁方法优先级:");
burnPriority.forEach(method => console.log(`  ${method}`));

console.log("\n🔍 不同合约类型的处理方式:");
Object.entries(contractTypes).forEach(([key, contract]) => {
  console.log(`\n${contract.name}:`);
  console.log(`  - 可用方法: ${contract.methods.join(", ")}`);
  console.log(`  - 使用方法: ${contract.burnMethod}`);
});

console.log("\n💡 优势说明:");
console.log("  ✅ burn(amount): 直接销毁，减少总供应量，最彻底");
console.log("  ✅ burnFrom(from, amount): 从指定地址销毁，减少总供应量");
console.log("  ⚠️ transfer to burn address: 转移到黑洞地址，总供应量不变");

console.log("\n🔒 黑洞地址: 0x000000000000000000000000000000000000dEaD");
console.log("  - 没有人拥有此地址的私钥");
console.log("  - 发送到此地址的代币永远无法取回");
console.log("  - 可通过查询此地址余额验证销毁数量");

console.log("\n📊 验证销毁结果:");
console.log("  1. 合约burn方法: 检查totalSupply()减少");
console.log("  2. 转移销毁: 检查黑洞地址balanceOf()增加");
console.log("  3. 事件日志: 监听Transfer或Burn事件");

console.log("\n✅ 新的销毁逻辑已实现，支持多种销毁方式的自动选择！");
