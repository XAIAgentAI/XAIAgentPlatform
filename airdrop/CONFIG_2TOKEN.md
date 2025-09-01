# 2 Token 空投配置说明

## 当前配置概述

已将空投配置为每个符合条件的地址发送固定的 **2 个 token**。

## 配置详情

### 📊 空投规则
```javascript
airdropRules: {
    minHoldingWei: '2000000000000000000', // 最小持有量: 2 tokens
    calculateAirdropAmount: function() {
        return "2"; // 固定发送 2 个 token
    }
}
```

### ⚙️ 执行控制
```javascript
execution: {
    skipContracts: true,    // 跳过合约地址
    batchSize: 10,          // 每批处理 10 个地址
    batchDelay: 5000,       // 批次间延迟 5 秒
    requestDelay: 1000,     // 请求间延迟 1 秒
    maxProcessCount: 10,    // 限制处理 10 个地址（测试用）
    testMode: true          // 启用测试模式（不会实际发送）
}
```

### 🎯 筛选条件
- **最小持有量**: 必须持有至少 2 个原生代币
- **跳过合约**: 不向合约地址发送空投
- **地址格式**: 必须是有效的以太坊地址格式

## 使用方法

### 1. 测试模式运行（推荐）
```bash
# 当前配置已启用测试模式，直接运行即可
node batch-airdrop.js
```

### 2. 生产模式运行
```javascript
// 如需实际发送，修改配置文件：
CONFIG.execution.testMode = false;
CONFIG.execution.maxProcessCount = 0; // 处理全部符合条件的地址
```

## 预期效果

### 📋 空投预览示例
```
📋 空投示例 (前10个)
  1. 0x1234...7890 -> 2 tokens (持有: 5.50)
  2. 0x2234...7891 -> 2 tokens (持有: 10.25)
  3. 0x3234...7892 -> 2 tokens (持有: 2.01)
  ...
```

### 💰 计算说明
- **固定数量**: 每个符合条件的地址都将收到正好 2 个 token
- **总成本**: 如果有 100 个符合条件的地址，总共需要 200 个 token
- **公平性**: 无论原始持有量多少，都按固定数量发送

## 风险提示

### ⚠️ 测试模式
- 当前已启用测试模式，不会实际发送代币
- 建议先运行测试模式验证地址列表和数量

### 🔒 生产模式注意事项
- 执行前务必确认代币地址正确
- 确保服务器钱包有足够的代币余额
- 操作不可撤销，请谨慎执行

## 配置修改

### 修改空投数量
```javascript
// 修改为发送其他数量，例如 5 个 token
calculateAirdropAmount: function(holdingAmountWei) {
    return "5";
}
```

### 修改最小持有量
```javascript
// 修改最小持有量为 1 个 token
minHoldingWei: '1000000000000000000', // 1 token in wei
```

### 修改处理限制
```javascript
// 处理全部符合条件的地址
maxProcessCount: 0,

// 或限制处理特定数量
maxProcessCount: 50,
```

## 执行日志示例

```
🚀 空投执行确认

📊 基本信息
   代币地址: 0x8a88a1D2bD0a13BA245a4147b7e11Ef1A9d15C8a
   总发送数量: 20 tokens
   接收地址数量: 10 个地址

📄 执行计划
   批次大小: 10 个/批次
   总批次数: 1 批次
   预估执行时间: 约 1 分钟

🧪 测试模式 - 按 Enter 键开始测试，Ctrl+C 取消
```

---

*配置更新时间: 2025-08-15*  
*下次执行前请检查测试模式设置*