# 空投范围配置说明

## ✅ 新配置系统

现在支持精确指定发送范围：**第几页的第几个地址** 到 **第几页的第几个地址**

## 📊 当前配置

```javascript
airdropRange: {
    startPage: 1,        // 从第1页开始
    startIndex: 0,       // 页面内从第1个地址开始 (0-based，所以0=第1个)
    endPage: 1,          // 到第1页结束  
    endIndex: 5,         // 页面内到第6个地址结束 (0-based，所以5=第6个)
    amountPerAddress: "2" // 每个地址发送2个token
}
```

### 🎯 **实际效果**: 
- 发送给第1页的第1-6个地址
- 总共6个地址，每个2 tokens
- 总发送量: 12 tokens

## 📋 配置示例

### 示例1: 发送给第1页前3个地址
```javascript
airdropRange: {
    startPage: 1,
    startIndex: 0,      // 第1个
    endPage: 1, 
    endIndex: 2,        // 第3个
    amountPerAddress: "5"
}
// 结果: 第1页第1-3个地址，每个5 tokens
```

### 示例2: 发送给第2页第5-10个地址
```javascript
airdropRange: {
    startPage: 2,
    startIndex: 4,      // 第5个 (4+1)
    endPage: 2,
    endIndex: 9,        // 第10个 (9+1)  
    amountPerAddress: "1"
}
// 结果: 第2页第5-10个地址，每个1 token
```

### 示例3: 跨页发送（第1页最后2个 + 第2页前3个）
```javascript
airdropRange: {
    startPage: 1,
    startIndex: 47,     // 第1页第48个 (假设第1页有49个)
    endPage: 2,
    endIndex: 2,        // 第2页第3个
    amountPerAddress: "10"
}
// 结果: 跨页发送，总共5个地址
```

## 🔍 索引说明

**重要**: 索引从0开始计算！

| 配置值 | 实际位置 |
|--------|----------|
| 0      | 第1个    |
| 1      | 第2个    |
| 2      | 第3个    |
| ...    | ...      |
| 48     | 第49个   |

## 📄 执行输出示例

```
📍 提取范围: 第1页第1个 到 第1页第6个

📄 第1页: 提取第1-6个地址
✅ 总共提取了 6 个地址

📋 详细空投列表
   1. 0x0D0707963952f2fBA59dD06f2b425ace40b492Fe
       📍 位置: 第1页第1个 | 💰 发送: 2 tokens | 📊 持有: 1137437.23

   2. 0xa9fBfd15BD80b0D624eA9fF912280c314A22064b  
       📍 位置: 第1页第2个 | 💰 发送: 2 tokens | 📊 持有: 70792.55

   3. 0xaF20ef77b7b3d6C580f89f9dEdb1165897Bb7cad
       📍 位置: 第1页第3个 | 💰 发送: 2 tokens | 📊 持有: 24629.66
       
   ... (显示所有地址)
```

## ⚙️ 其他设置

### 批次配置
```javascript
execution: {
    batchSize: 2,        // 每批2个地址
    batchDelay: 5000,    // 批次间延迟5秒
    requestDelay: 1000,  // 请求间延迟1秒
    skipContracts: true, // 跳过合约地址
    testMode: false      // 生产模式
}
```

### 执行流程
```
6个地址 ÷ 2个/批 = 3个批次

批次1: 地址1-2 → 发送4 tokens
批次2: 地址3-4 → 发送4 tokens  
批次3: 地址5-6 → 发送4 tokens

总计: 12 tokens
```

## 🚀 使用方法

### 1. 修改配置
编辑 `batch-airdrop.js` 中的 `airdropRange` 部分

### 2. 执行空投
```bash
cd E:\BeepBrainChain\XAIAgentPlatform\airdrop
node batch-airdrop.js
```

### 3. 确认信息
程序会显示详细的发送列表，包括每个地址的：
- 完整地址
- 页面位置（第几页第几个）
- 发送数量
- 原始持有量

### 4. 确认执行
按 Enter 键确认开始发送，Ctrl+C 取消

## ⚠️ 重要提示

1. **精确控制**: 现在可以精确到具体的地址位置
2. **范围灵活**: 支持单页内范围、跨页范围
3. **地址显示**: 执行前会显示所有目标地址的完整列表
4. **位置追踪**: 每个操作都会显示地址在原始数据中的位置

---

*更新时间: 2025-08-15*  
*配置系统: v2.0 - 支持精确范围控制*