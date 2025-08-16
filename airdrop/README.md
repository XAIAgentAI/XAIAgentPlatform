# 区块链数据爬取平台

这是一个模块化的区块链数据爬取平台，支持代币持有者和原生币地址列表的爬取，具有智能分页、地址过滤、断点续抓等功能。

## 🚀 功能特性

- ✅ 支持代币持有者数据爬取
- ✅ 支持原生币地址排行榜爬取
- ✅ 智能分页控制和断点续抓
- ✅ 支持排除指定地址和合约地址
- ✅ 限制爬取数量（maxHolders）
- ✅ 自动错误处理和重试机制
- ✅ 详细的爬取结果统计
- ✅ 模块化设计，代码复用
- ✅ 合约地址智能识别和过滤

## 📁 项目结构

```
airdrop/
├── token/                           # 代币爬虫目录
│   ├── config.js                    # 代币爬取配置文件
│   ├── main.js                      # 代币爬取主流程（一键执行）
│   └── token-holders-scraper.js     # 代币爬取核心模块
├── native/                          # 原生币爬虫目录
│   ├── config.js                    # 原生币爬取配置文件
│   ├── main.js                      # 原生币爬取主流程（一键执行）
│   └── native-holders-scraper.js    # 原生币爬取核心模块
├── utils/                           # 通用工具目录
│   ├── 02-check-status.js           # 数据状态检查工具
│   ├── 03-retry-failed.js           # 失败页面重试工具
│   └── 05-check-contract-address.js # 合约地址检查工具
├── data/                            # 数据输出目录
│   ├── holders_pages.json           # 代币持有者数据
│   └── native_holders_pages.json    # 原生币地址数据
├── convert-to-excel.js              # 数据转换为Excel工具
├── advanced-convert.js              # 高级数据转换工具
├── separated-convert.js             # 分离式数据转换工具
├── demo-convert.js                  # 数据转换演示工具
├── package.json                     # 项目依赖配置
└── README.md                        # 项目文档
```

## 📋 文件详细说明

### 🔧 配置文件
- **`token/config.js`** - 代币爬取配置文件
  - 定义目标代币地址、输出路径、爬取参数
  - 配置排除地址列表和合约地址处理选项
  - 设置请求延迟、数据条数限制等

- **`native/config.js`** - 原生币爬取配置文件
  - 定义输出路径、爬取参数
  - 配置合约地址排除和保存选项
  - 设置请求延迟、数据条数限制等

### 🚀 主流程脚本（推荐使用）
- **`token/main.js`** - 代币爬取一键执行脚本
  - 自动执行完整流程：爬取 → 检查 → 重试 → 补充 → 最终检查
  - 完整的错误处理和状态报告
  - 适合生产环境使用

- **`native/main.js`** - 原生币爬取一键执行脚本
  - 自动执行完整流程：爬取 → 检查 → 重试 → 补充 → 最终检查
  - 完整的错误处理和状态报告
  - 适合生产环境使用



### 🧠 核心爬取模块
- **`token/token-holders-scraper.js`** - 代币持有者爬取核心模块
  - 实现代币持有者数据的智能爬取
  - 支持分页控制、地址过滤、合约地址处理
  - 提供完整的错误处理和重试机制

- **`native/native-holders-scraper.js`** - 原生币地址爬取核心模块
  - 实现原生币地址排行榜的智能爬取
  - 支持分页控制、地址过滤、合约地址处理
  - 提供完整的错误处理和重试机制

### 🛠️ 工具脚本
- **`utils/02-check-status.js`** - 数据状态检查工具
  - 检查爬取数据的完整性和状态
  - 统计成功/失败页面数量
  - 计算总数据量和完成度
  - 识别缺失页面和错误原因

- **`utils/03-retry-failed.js`** - 失败页面重试工具
  - 自动识别失败页面
  - 重新请求API获取数据
  - 更新失败页面的状态



- **`utils/05-check-contract-address.js`** - 合约地址检查工具
  - 检查钱包地址是否为合约地址
  - 支持多种检查方法：RPC调用、区块浏览器API、合约创建者检查
  - 综合判断结果，提供置信度评分
  - 支持单个地址、批量地址、文件批量检查
  - 自动生成统计报告和结果文件

### 📊 数据转换工具
- **`convert-to-excel.js`** - 基础数据转换为Excel工具
  - 将JSON格式的爬取数据转换为Excel文件
  - 支持基本的格式化和排序

- **`advanced-convert.js`** - 高级数据转换工具
  - 提供更复杂的数据转换功能
  - 支持数据过滤、聚合、统计等

- **`separated-convert.js`** - 分离式数据转换工具
  - 将数据按不同维度分离转换
  - 支持多种输出格式

- **`demo-convert.js`** - 数据转换演示工具
  - 展示各种数据转换功能的使用方法
  - 适合学习和测试

### 📁 数据文件
- **`data/holders_pages.json`** - 代币持有者数据文件
  - 存储代币持有者的分页数据
  - 包含钱包地址、持有数量、分页信息等

- **`data/native_holders_pages.json`** - 原生币地址数据文件
  - 存储原生币地址排行榜的分页数据
  - 包含钱包地址、余额、分页信息等

## 🔄 调用流程

### 代币爬取流程
```
token/main.js (一键执行)
    ↓
token/token-holders-scraper.js (核心爬取模块)
    ↓
输出到 data/holders_pages.json

utils/02-check-status.js (检查数据状态)
    ↓
如果发现失败页面
    ↓
utils/03-retry-failed.js (重试失败页面)
```

### 原生币爬取流程
```
native/main.js (一键执行)
    ↓
native/native-holders-scraper.js (核心爬取模块)
    ↓
输出到 data/native_holders_pages.json

utils/02-check-status.js (检查数据状态)
    ↓
如果发现失败页面
    ↓
utils/03-retry-failed.js (重试失败页面)
```

## 🚀 快速开始

### 代币爬取
```bash
# 进入代币爬虫目录
cd token

# 一键执行完整流程（推荐）
node main.js
```

### 原生币爬取
```bash
# 进入原生币爬虫目录
cd native

# 一键执行完整流程（推荐）
node main.js
```

### 通用工具使用
```bash
# 检查数据状态（适用于代币和原生币数据）
node ../utils/02-check-status.js

# 重试失败页面（适用于代币和原生币数据）
node ../utils/03-retry-failed.js

# 检查合约地址（适用于代币和原生币数据）
node ../utils/05-check-contract-address.js 0x1234567890123456789012345678901234567890
node ../utils/05-check-contract-address.js --file ../data/holders_pages.json
node ../utils/05-check-contract-address.js --addresses 0x123... 0x456... 0x789...
```

### 数据转换
```bash
# 基础转换
node convert-to-excel.js

# 高级转换
node advanced-convert.js

# 分离式转换
node separated-convert.js

# 演示转换
node demo-convert.js
```

## ⚙️ 配置选项

### 代币爬取配置
```javascript
const CONFIG = {
    TOKEN_ADDRESS: '0x16d83F6B17914a4e88436251589194CA5AC0f452',
    OUTPUT_PATH: path.join(__dirname, '../data', 'holders_pages.json'),
    ITEMS_COUNT: 50,
    REQUEST_DELAY: 1000,
    VERBOSE: true,
    MAX_HOLDERS: 10000,
    EXCLUDE_CONTRACTS: true,   // 是否排除合约地址
    SAVE_CONTRACTS: true,      // 是否保存合约地址到单独字段
    EXCLUDE_ADDRESSES: [
        '0xD7EA4Da7794c7d09bceab4A21a6910D9114Bc936'
    ]
};
```

### 原生币爬取配置
```javascript
const CONFIG = {
    OUTPUT_PATH: path.join(__dirname, '../data', 'native_holders_pages.json'),
    ITEMS_COUNT: 50,
    REQUEST_DELAY: 200,
    VERBOSE: true,
    MAX_HOLDERS: 200,
    EXCLUDE_CONTRACTS: true,   // 是否排除合约地址
    SAVE_CONTRACTS: true,      // 是否保存合约地址到单独字段
    EXCLUDE_ADDRESSES: []      // 保留空数组，用于向后兼容
};
```

## 📊 输出数据格式

### 代币持有者数据
```json
[
    {
        "page": 1,
        "status": "ok",
        "data": [
            {
                "wallet_address": "0x...",
                "amount": "10000000000000000000000000000",
                "is_contract": false
            }
        ],
        "contract_data": [
            {
                "wallet_address": "0x...",
                "amount": "5000000000000000000000000000",
                "is_contract": true
            }
        ],
        "next_page_params": {
            "address_hash": "0x...",
            "items_count": 50,
            "value": "10000000000000000000000000000"
        }
    }
]
```

### 原生币地址数据
```json
[
    {
        "page": 1,
        "status": "ok",
        "data": [
            {
                "wallet_address": "0x...",
                "amount": "1137437231538218251167107000",
                "is_contract": false
            }
        ],
        "contract_data": [
            {
                "wallet_address": "0x...",
                "amount": "5000000000000000000000000000",
                "is_contract": true
            }
        ],
        "next_page_params": {
            "items_count": 50,
            "value": "1137437231538218251167107000"
        }
    }
]
```

## 🔧 高级功能

### 智能过滤
支持排除指定地址和合约地址，在爬取过程中实时过滤：
```javascript
const excludeAddresses = [
    '0xD7EA4Da7794c7d09bceab4A21a6910D9114Bc936'
];
const excludeContracts = true;  // 自动排除合约地址
```

### 数量限制
精确控制爬取的数据量：
```javascript
const maxHolders = 10000; // 最多爬取1万条数据
```

### 断点续抓
支持从指定分页参数继续爬取，避免重复工作：
```javascript
const options = {
    resumeFromParams: lastPageParams,    // 从指定分页参数继续
    startPageNumber: currentMaxPage + 1  // 指定起始页码
};
```

### 合约地址处理
智能识别和处理合约地址：
```javascript
const options = {
    excludeContracts: true,  // 排除合约地址
    saveContracts: true      // 保存合约地址到单独字段
};
```

## 📋 使用建议

### 首次使用
1. 根据需求选择代币或原生币爬取
2. 配置目标地址、输出路径、数量限制等
3. 运行主爬取脚本
4. 使用状态检查脚本验证结果

### 日常维护
1. 定期运行状态检查脚本
2. 发现失败页面时使用重试脚本
3. 监控爬取进度和错误日志

### 性能优化
1. 调整 `REQUEST_DELAY` 避免API限制
2. 合理设置 `ITEMS_COUNT` 平衡速度和稳定性
3. 使用断点续抓功能处理中断情况

## ⚠️ 注意事项

1. **API限制**: 建议设置适当的请求延迟避免被限制
2. **文件权限**: 确保有写入输出文件的权限
3. **网络连接**: 需要稳定的网络连接
4. **Node.js版本**: 需要Node.js 18+或安装node-fetch
5. **数据备份**: 重要数据建议定期备份
6. **路径配置**: 注意配置中的相对路径，确保输出到正确的data目录
7. **合约地址**: 合约地址处理功能需要API支持is_contract字段

## �� 许可证

MIT License 