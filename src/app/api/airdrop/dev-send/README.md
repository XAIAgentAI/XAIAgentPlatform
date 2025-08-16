# 开发环境空投接口

## 概述

这是一个专门为开发环境设计的空投接口，允许开发者在测试网上给指定钱包地址发送任意ERC20代币。**此接口只在开发环境和测试网上生效**。

## 接口地址

```
POST /api/airdrop/dev-send
GET /api/airdrop/dev-send
```

## 环境要求

- `NODE_ENV` 必须为 `development`
- `NEXT_PUBLIC_IS_TEST_ENV` 必须为 `true`（确保是测试网环境）
- 服务端钱包必须有足够的ETH支付gas费用

## 数据库表

### DevAirdropRecord 表

接口会自动记录所有空投操作到 `DevAirdropRecord` 数据库表中，包括：

- 空投请求详情
- 交易状态跟踪
- 成功/失败记录
- 详细的元数据

**注意**: 在数据库迁移完成之前，接口使用临时存储（控制台日志），不会持久化到数据库。

详细设置说明请参考: [DATABASE_SETUP.md](./DATABASE_SETUP.md)

## 使用方法

### 发送空投 (POST)

**请求体示例：**

```json
{
  "walletAddress": "0xf9E35854306FDC9C4b75318e7F4c4a4596408B64",
  "amount": "100.5",
  "tokenAddress": "0x16d83F6B17914a4e88436251589194CA5AC0f452",
  "description": "测试空投"
}
```

**参数说明：**

- `walletAddress` (必填): 接收空投的钱包地址，必须是有效的以太坊地址格式
- `amount` (必填): 空投数量，支持小数
- `tokenAddress` (必填): 代币合约地址，必须是有效的ERC20合约地址
- `description` (可选): 空投描述，用于记录和追踪

**成功响应：**

```json
{
  "success": true,
  "message": "Airdrop sent successfully",
  "data": {
    "recordId": "uuid-here",
    "walletAddress": "0xf9E35854306FDC9C4b75318e7F4c4a4596408B64",
    "amount": "100.5",
    "tokenAddress": "0x16d83F6B17914a4e88436251589194CA5AC0f452",
    "transactionHash": "0x...",
    "blockNumber": 12345,
    "gasUsed": "65000"
  }
}
```

**错误响应：**

```json
{
  "success": false,
  "message": "Insufficient balance for gas fees. Current balance: 0.005 ETH",
  "error": "Error stack trace (only in development)"
}
```

### 检查服务状态和历史记录 (GET)

用于检查开发环境空投服务状态和获取历史记录。

**查询参数：**

- `page`: 页码（默认: 1）
- `limit`: 每页数量（默认: 10）
- `status`: 过滤状态（pending, success, failed）
- `tokenAddress`: 过滤代币合约地址
- `walletAddress`: 过滤钱包地址

**示例请求：**

```bash
# 获取第一页记录
GET /api/airdrop/dev-send

# 获取特定状态的记录
GET /api/airdrop/dev-send?status=success&page=1&limit=20

# 获取特定代币的记录
GET /api/airdrop/dev-send?tokenAddress=0x16d83F6B17914a4e88436251589194CA5AC0f452

# 获取特定钱包的记录
GET /api/airdrop/dev-send?walletAddress=0x...
```

**成功响应：**

```json
{
  "success": true,
  "message": "Development airdrop service is active",
  "data": {
    "serverWalletAddress": "0x...",
    "network": "DeepBrainChain Testnet",
    "chainId": 19850818,
    "environment": "development",
    "isTestnet": true,
    "records": [
      {
        "id": "uuid",
        "walletAddress": "0x...",
        "amount": "100",
        "tokenAddress": "0x16d83F6B17914a4e88436251589194CA5AC0f452",
        "status": "success",
        "transactionHash": "0x...",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalCount": 25,
      "totalPages": 3
    },
    "stats": {
      "success": { "count": 20, "totalAmount": "2000" },
      "failed": { "count": 3, "totalAmount": "300" },
      "pending": { "count": 2, "totalAmount": "200" }
    }
  }
}
```

## 安全特性

1. **环境限制**: 只在开发环境和测试网上可用
2. **地址验证**: 验证钱包地址和合约地址格式
3. **余额检查**: 检查服务端钱包是否有足够ETH支付gas
4. **交易确认**: 等待区块链确认交易成功
5. **完整记录**: 记录所有空投操作到数据库
6. **状态跟踪**: 实时跟踪交易状态（pending → success/failed）

## 使用示例

### cURL 示例

```bash
# 发送空投
curl -X POST http://localhost:3000/api/airdrop/dev-send \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0xf9E35854306FDC9C4b75318e7F4c4a4596408B64",
    "amount": "50",
    "tokenAddress": "0x16d83F6B17914a4e88436251589194CA5AC0f452",
    "description": "开发测试空投"
  }'

# 检查服务状态
curl http://localhost:3000/api/airdrop/dev-send

# 获取成功记录
curl "http://localhost:3000/api/airdrop/dev-send?status=success&page=1&limit=5"

# 获取特定代币的记录
curl "http://localhost:3000/api/airdrop/dev-send?tokenAddress=0x16d83F6B17914a4e88436251589194CA5AC0f452"
```

### JavaScript/TypeScript 示例

```typescript
// 发送空投
async function sendDevAirdrop() {
  try {
    const response = await fetch('/api/airdrop/dev-send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress: '0xf9E35854306FDC9C4b75318e7F4c4a4596408B64',
        amount: '100',
        tokenAddress: '0x16d83F6B17914a4e88436251589194CA5AC0f452',
        description: '开发测试'
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('空投成功:', result.data);
      console.log('记录ID:', result.data.recordId);
    } else {
      console.error('空投失败:', result.message);
    }
  } catch (error) {
    console.error('请求失败:', error);
  }
}

// 检查服务状态和历史记录
async function checkDevAirdropStatus() {
  try {
    const response = await fetch('/api/airdrop/dev-send?page=1&limit=10');
    const result = await response.json();
    
    if (result.success) {
      console.log('服务可用:', result.data);
      console.log('总记录数:', result.data.pagination.totalCount);
      console.log('成功记录:', result.data.stats.success);
    } else {
      console.log('服务不可用:', result.message);
    }
  } catch (error) {
    console.error('检查失败:', error);
  }
}

// 批量查询特定钱包的空投历史
async function getWalletAirdropHistory(walletAddress: string) {
  try {
    const response = await fetch(
      `/api/airdrop/dev-send?walletAddress=${walletAddress}&limit=50`
    );
    const result = await response.json();
    
    if (result.success) {
      return result.data.records;
    }
    return [];
  } catch (error) {
    console.error('查询失败:', error);
    return [];
  }
}

// 查询特定代币的空投记录
async function getTokenAirdropHistory(tokenAddress: string) {
  try {
    const response = await fetch(
      `/api/airdrop/dev-send?tokenAddress=${tokenAddress}&limit=50`
    );
    const result = await response.json();
    
    if (result.success) {
      return result.data.records;
    }
    return [];
  } catch (error) {
    console.error('查询失败:', error);
    return [];
  }
}
```

## 注意事项

1. **仅限开发环境**: 此接口在生产环境中会被拒绝访问
2. **仅限测试网**: 只能在测试网上使用，确保不会影响主网资产
3. **Gas费用**: 服务端钱包需要有足够的ETH支付gas费用
4. **代币余额**: 服务端钱包需要有足够的代币余额进行空投
5. **交易确认**: 接口会等待交易确认，可能需要一些时间
6. **数据库依赖**: 完整功能需要数据库表设置完成
7. **合约地址**: 确保提供的合约地址是有效的ERC20代币合约

## 错误处理

常见错误及解决方案：

- **环境错误**: 确保在开发环境和测试网上使用
- **余额不足**: 给服务端钱包充值ETH
- **地址格式错误**: 检查钱包地址和合约地址格式是否正确
- **合约地址错误**: 确保提供的合约地址是有效的ERC20代币合约
- **网络错误**: 检查测试网连接是否正常
- **数据库错误**: 检查数据库连接和表结构

## 日志记录

所有空投操作都会记录到：

1. **控制台日志**: 实时显示操作状态
2. **数据库记录**: 持久化存储（需要数据库设置完成）
3. **区块链**: 交易记录永久保存在区块链上

## 数据库设置

要启用完整的数据库记录功能，请：

1. 运行数据库迁移: `npx prisma migrate dev --name add_dev_airdrop_table`
2. 生成Prisma客户端: `npx prisma generate`
3. 重启应用服务

详细设置说明请参考: [DATABASE_SETUP.md](./DATABASE_SETUP.md) 