# NFT Token ID 集成修改总结

## 概述
为了在添加流动性池子后将NFT Token ID像poolAddress一样存储到数据库中，我们进行了以下修改：

## 1. 数据库Schema修改

### 文件: `prisma/schema.prisma`
```prisma
// 池子相关字段
poolAddress               String? // 流动性池地址
nftTokenId                String? // NFT Token ID  ← 新增字段
poolCreated               Boolean      @default(false) // 池子是否已创建
initialLiquidityAmount    Decimal? // 初始流动性代币数量
initialXaaAmount          Decimal? // 初始流动性XAA数量
```

## 2. 类型定义修改

### 文件: `src/lib/server-wallet/types.ts`
```typescript
// 单笔交易结果
export interface TransactionResult {
  type: 'creator' | 'iao' | 'liquidity' | 'airdrop' | 'mining' | 'burn';
  amount: string;
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  toAddress: string | null;
  error?: string;
  batchResult?: BatchTransactionResult;
  nftTokenId?: string; // ← 新增字段，用于流动性交易
}
```

### 文件: `src/lib/token-distribution/liquidity-distribution.ts`
```typescript
export interface LiquidityDistributionResult {
  success: boolean;
  poolAddress?: string;
  nftTokenId?: string; // ← 新增字段
  txHash?: string;
  tokenAmount?: string;
  xaaAmount?: string;
  blockNumber?: string;
  error?: string;
}
```

## 3. 核心逻辑修改

### 文件: `src/lib/server-wallet/index.ts`

#### 修改 addLiquidityToPool 函数返回类型
```typescript
async function addLiquidityToPool(
  tokenAddress: string,
  tokenAmount: string,
  agentId: string
): Promise<{
  success: boolean;
  txHash?: string;
  poolAddress?: string;
  nftTokenId?: string; // ← 新增字段
  error?: string;
}>
```

#### 修改流动性交易结果创建
```typescript
const liquidityTx: TransactionResult = {
  type: 'liquidity',
  amount: distributions.liquidity,
  txHash: liquidityResult.txHash || 'N/A',
  status: liquidityResult.success ? 'confirmed' : 'failed',
  toAddress: liquidityResult.poolAddress || null,
  error: liquidityResult.error,
  nftTokenId: liquidityResult.nftTokenId // ← 新增字段
};
```

### 文件: `src/lib/token-distribution/liquidity-distribution.ts`

#### 修改数据库更新逻辑
```typescript
// 5. 更新数据库状态
await prisma.agent.update({
  where: { id: params.agentId },
  data: {
    liquidityAdded: true,
    poolAddress: result.poolAddress,
    nftTokenId: result.tokenId // ← 新增字段
  } as any // 临时使用any类型，直到数据库迁移完成
});
```

#### 修改返回结果
```typescript
return {
  success: true,
  poolAddress: result.poolAddress,
  nftTokenId: result.tokenId, // ← 新增字段
  txHash: result.txHash,
  tokenAmount: result.tokenAmount,
  xaaAmount: result.xaaAmount,
  blockNumber: result.blockNumber
};
```

### 文件: `src/app/api/token/distribute/route.ts`

#### 修改任务完成时的Agent更新逻辑
```typescript
// 如果任务完成，更新Agent的tokensDistributed状态和NFT Token ID
if (taskStatus === 'COMPLETED') {
  const updateData: any = { tokensDistributed: true };
  
  // 如果有NFT Token ID，也更新到Agent记录中
  if (nftTokenId) {
    updateData.nftTokenId = nftTokenId;
    console.log(`🔍 [DEBUG] 更新Agent NFT Token ID: ${nftTokenId}`);
  }
  
  await prisma.agent.update({
    where: { id: agentId },
    data: updateData
  });
}
```

## 4. 数据库迁移

### 手动迁移SQL
```sql
-- 添加 nftTokenId 字段到 Agent 表
ALTER TABLE "Agent" ADD COLUMN "nftTokenId" TEXT;

-- 添加注释
COMMENT ON COLUMN "Agent"."nftTokenId" IS 'NFT Token ID for liquidity position';
```

### 迁移脚本
创建了 `scripts/add-nft-token-id-migration.js` 用于手动执行迁移。

## 5. 数据流程

1. **流动性添加**: `PoolManager.addLiquidity()` 返回包含 `tokenId` 的结果
2. **传递到分发**: `LiquidityDistributionManager` 接收并传递 `tokenId`
3. **存储到交易**: 流动性交易结果包含 `nftTokenId` 字段
4. **更新Agent**: 任务完成时，NFT Token ID 被存储到 Agent 表的 `nftTokenId` 字段

## 6. 使用方式

### 查询Agent的NFT Token ID
```typescript
const agent = await prisma.agent.findUnique({
  where: { id: agentId },
  select: {
    poolAddress: true,
    nftTokenId: true, // ← 新增字段
    liquidityAdded: true
  }
});

console.log(`池子地址: ${agent.poolAddress}`);
console.log(`NFT Token ID: ${agent.nftTokenId}`);
```

## 7. 注意事项

1. **数据库迁移**: 需要手动执行SQL迁移或运行迁移脚本
2. **类型安全**: 临时使用 `as any` 类型，迁移完成后可以移除
3. **向后兼容**: 新增字段为可选，不会影响现有数据
4. **错误处理**: 如果流动性添加失败，`nftTokenId` 将为 `undefined`

## 8. 测试建议

1. 测试流动性添加流程，确认NFT Token ID被正确获取
2. 验证数据库中的 `nftTokenId` 字段被正确填充
3. 测试查询功能，确认能正确获取NFT Token ID
4. 验证错误处理，确认失败情况下不会影响其他功能 