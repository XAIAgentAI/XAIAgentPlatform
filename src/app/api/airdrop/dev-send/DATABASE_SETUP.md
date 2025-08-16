# 数据库设置说明

## 概述

开发环境空投功能需要一个新的数据库表 `DevAirdropRecord` 来记录所有的空投操作。本文档说明如何设置数据库。

## 数据库表结构

### DevAirdropRecord 表

```sql
-- 开发环境空投记录表
CREATE TABLE "DevAirdropRecord" (
  "id" TEXT NOT NULL,
  "walletAddress" TEXT NOT NULL,
  "amount" TEXT NOT NULL,
  "tokenAddress" TEXT NOT NULL,
  "description" TEXT,
  "transactionHash" TEXT,
  "blockNumber" BIGINT,
  "gasUsed" TEXT,
  "status" TEXT NOT NULL,
  "environment" TEXT NOT NULL DEFAULT 'development',
  "errorMessage" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "DevAirdropRecord_pkey" PRIMARY KEY ("id")
);

-- 创建索引
CREATE INDEX "DevAirdropRecord_walletAddress_idx" ON "DevAirdropRecord"("walletAddress");
CREATE INDEX "DevAirdropRecord_tokenAddress_idx" ON "DevAirdropRecord"("tokenAddress");
CREATE INDEX "DevAirdropRecord_status_idx" ON "DevAirdropRecord"("status");
CREATE INDEX "DevAirdropRecord_createdAt_idx" ON "DevAirdropRecord"("createdAt");
CREATE INDEX "DevAirdropRecord_environment_idx" ON "DevAirdropRecord"("environment");
```

## 设置步骤

### 1. 运行数据库迁移

```bash
# 生成迁移文件
npx prisma migrate dev --name add_dev_airdrop_table

# 或者如果数据库连接有问题，可以手动创建表
npx prisma db push
```

### 2. 生成 Prisma 客户端

```bash
# 生成包含新模型的 Prisma 客户端
npx prisma generate
```

### 3. 验证设置

```bash
# 检查数据库连接
npx prisma studio

# 或者运行测试
node scripts/test-dev-airdrop.js
```

## 字段说明

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `id` | TEXT | 唯一标识符（UUID） |
| `walletAddress` | TEXT | 接收空投的钱包地址 |
| `amount` | TEXT | 空投数量（字符串格式，支持任意精度） |
| `tokenAddress` | TEXT | 代币合约地址 |
| `description` | TEXT | 空投描述（可选） |
| `transactionHash` | TEXT | 交易哈希（可选） |
| `blockNumber` | BIGINT | 区块号（可选） |
| `gasUsed` | TEXT | 使用的gas数量（可选） |
| `status` | TEXT | 状态：pending, success, failed |
| `environment` | TEXT | 环境标识（默认：development） |
| `errorMessage` | TEXT | 错误信息（如果失败，可选） |
| `metadata` | JSONB | 额外的元数据（JSON格式，可选） |
| `createdAt` | TIMESTAMP | 创建时间 |
| `updatedAt` | TIMESTAMP | 更新时间 |

## 状态说明

- **pending**: 空投请求已创建，交易已发送但未确认
- **success**: 空投交易已确认成功
- **failed**: 空投失败（网络错误、余额不足等）

## 索引说明

- `walletAddress`: 支持按钱包地址查询
- `tokenAddress`: 支持按代币合约地址查询
- `status`: 支持按状态查询
- `createdAt`: 支持按时间排序和查询
- `environment`: 支持按环境查询

## 临时解决方案

在数据库迁移完成之前，API接口使用临时的内存存储来记录空投操作。所有记录都会输出到控制台，但不会持久化到数据库。

## 迁移完成后

数据库迁移完成后，你需要：

1. 删除 `src/app/api/airdrop/dev-send/route.ts` 中的临时函数
2. 将所有的临时函数调用替换为实际的 Prisma 调用
3. 重新生成 Prisma 客户端
4. 测试数据库功能

## 示例查询

### 查询所有成功的空投
```sql
SELECT * FROM "DevAirdropRecord" 
WHERE status = 'success' 
ORDER BY "createdAt" DESC;
```

### 查询特定钱包的空投历史
```sql
SELECT * FROM "DevAirdropRecord" 
WHERE "walletAddress" = '0x...' 
ORDER BY "createdAt" DESC;
```

### 查询特定代币的空投记录
```sql
SELECT * FROM "DevAirdropRecord" 
WHERE "tokenAddress" = '0x16d83F6B17914a4e88436251589194CA5AC0f452' 
ORDER BY "createdAt" DESC;
```

### 统计各状态的空投数量
```sql
SELECT status, COUNT(*) as count, SUM(CAST(amount AS DECIMAL)) as total_amount
FROM "DevAirdropRecord" 
GROUP BY status;
```

### 按代币地址统计空投情况
```sql
SELECT "tokenAddress", COUNT(*) as count, SUM(CAST(amount AS DECIMAL)) as total_amount
FROM "DevAirdropRecord" 
WHERE status = 'success'
GROUP BY "tokenAddress"
ORDER BY total_amount DESC;
```

## 注意事项

1. **环境限制**: 此表只在开发环境中使用
2. **数据清理**: 定期清理旧的测试数据
3. **备份**: 在生产环境中不要包含此表
4. **权限**: 确保只有开发人员可以访问此表
5. **合约地址**: 确保记录的合约地址是有效的ERC20代币合约 