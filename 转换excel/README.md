# 🚀 空投转换工具

这个工具专门用于将两个JSON文件转换为Excel格式，生成空投发放表和排除地址表。

## 📁 输入文件

- `../data/native_holders_pages.json` - Native Token持有者数据
- `../data/xaa_token_holders_pages.json` - XAA Token持有者数据

## 📊 输出文件

- `../data/airdrop_holders.xlsx` - 包含两个工作表的Excel文件

## 🎯 工作表说明

### 1. 空投发放表
适合发放空投的地址，包含：
- Source（数据来源）
- Page（页码）
- Wallet Address（钱包地址）
- Native Amount（Native Token数量）
- XAA Amount（XAA Token数量）
- Status（状态）

### 2. 排除地址表
不适合空投的地址，包含：
- Source（数据来源）
- Page（页码）
- Wallet Address（钱包地址）
- Amount（持有数量）
- Type（类型：Contract/Special）
- Reason（排除原因）

## 🚀 使用方法

### 1. 安装依赖
```bash
cd "转换excel"
npm install
```

### 2. 运行转换
```bash
node airdrop-converter.js
```

或者使用npm脚本：
```bash
npm run convert
```

## ✨ 功能特点

- ✅ 自动处理两个JSON文件
- ✅ 智能识别合约地址和特殊地址
- ✅ 生成格式化的金额显示
- ✅ 自动排除不适合空投的地址
- ✅ 生成详细的统计报告
- ✅ 两个独立的工作表，便于管理

## 📈 统计信息

转换完成后会显示：
- Native Token持有者统计
- XAA Token持有者统计
- 空投发放表地址数量
- 排除地址表地址数量

## ⚠️ 注意事项

1. 确保两个JSON文件都在 `../data/` 目录中
2. 首次使用前必须运行 `npm install`
3. 生成的Excel文件会保存在 `../data/` 目录中
4. 合约地址和特殊地址会自动排除 