# 🚀 空投转换工具

这个工具专门用于将两个JSON文件转换为Excel格式，分别为Native Token和XAA Token生成独立的Excel文件。

## 📁 输入文件

- `../data/native_holders_pages.json` - Native Token持有者数据（DBC单位）
- `../data/xaa_token_holders_pages.json` - XAA Token持有者数据（XAA单位）

## 📊 输出文件

- `../data/airdrop_native_dbc.xlsx` - Native Token独立Excel文件
- `../data/airdrop_xaa_new.xlsx` - XAA Token独立Excel文件

每个Excel文件都包含两个工作表：
1. **空投发放表** - 适合发放空投的地址
2. **排除地址表** - 合约地址和特殊地址

## 🎯 工作表说明

### 空投发放表
适合发放空投的地址，包含：
- Token（代币类型）
- Page（页码）
- Wallet Address（钱包地址）
- Amount（持有数量，Native显示DBC，XAA显示XAA）
- Status（状态）

### 排除地址表
不适合空投的地址，包含：
- Token（代币类型）
- Page（页码）
- Wallet Address（钱包地址）
- Amount（持有数量）
- Type（类型：Contract/Special）
- Reason（排除原因）

## 🚀 使用方法

### 方法1：在转换excel文件夹中运行
```bash
cd "转换excel"
npm install
node airdrop-converter.js
```

### 方法2：从airdrop根目录运行
```bash
cd airdrop
node "转换excel/airdrop-converter.js"
```

### 方法3：从项目根目录运行
```bash
node "airdrop/转换excel/airdrop-converter.js"
```

## ✨ 功能特点

- ✅ 分别生成两个独立的Excel文件
- ✅ Native Token使用DBC单位
- ✅ XAA Token使用XAA单位
- ✅ 智能识别合约地址和特殊地址
- ✅ 自动排除不适合空投的地址
- ✅ 生成详细的统计报告
- ✅ 智能路径处理，支持多种运行位置

## 📈 统计信息

转换完成后会显示：
- Native Token持有者统计（DBC单位）
- XAA Token持有者统计（XAA单位）
- 每个文件的空投发放表地址数量
- 每个文件的排除地址表地址数量

## 🔧 路径处理

脚本使用智能路径处理，自动识别：
- 脚本所在目录
- 数据文件目录（`../data/`）
- 输出文件目录

无论从哪个位置运行，都能正确找到数据文件。

## ⚠️ 注意事项

1. 确保两个JSON文件都在 `../data/` 目录中
2. 首次使用前必须运行 `npm install`
3. 生成的Excel文件会保存在 `../data/` 目录中
4. 合约地址和特殊地址会自动排除
5. 支持从任意位置运行脚本
6. Native Token显示为DBC单位，XAA Token显示为XAA单位

## 📊 示例输出

```
🚀 开始空投转换...
📁 脚本目录: E:\BeepBrainChain\XAIAgentPlatform\airdrop\转换excel
📁 数据目录: E:\BeepBrainChain\XAIAgentPlatform\airdrop\data
📁 输出目录: E:\BeepBrainChain\XAIAgentPlatform\airdrop\data
📖 读取文件:
   - Native: E:\BeepBrainChain\XAIAgentPlatform\airdrop\data\native_holders_pages.json
   - XAA:    E:\BeepBrainChain\XAIAgentPlatform\airdrop\data\xaa_token_holders_pages.json
✅ Native Token数据处理完成，共 202 条记录
✅ XAA Token数据处理完成，共 219 条记录
📋 Native Token: 普通 200 个, 合约 2 个, 总计 202
📋 XAA Token:    普通 200 个, 合约 19 个, 总计 219
✅ 已生成 Native Excel: E:\BeepBrainChain\XAIAgentPlatform\airdrop\data\airdrop_native_dbc.xlsx
   - 空投发放表: 199 条
   - 排除地址表: 3 条
✅ 已生成 XAA Excel: E:\BeepBrainChain\XAIAgentPlatform\airdrop\data\airdrop_xaa_new.xlsx
   - 空投发放表: 199 条
   - 排除地址表: 20 条
🎉 转换完成：已分别生成 Native 与 XAA 的独立Excel！
``` 