/**
 * 服务端钱包管理类型定义
 */

// 分配请求参数
export interface DistributionRequest {
  agentId: string;
  totalSupply: string;
  tokenAddress: string;
}

// 分配结果
export interface DistributionResult {
  success: boolean;
  taskId?: string;
  data?: {
    transactions: TransactionResult[];
    totalDistributed: string;
  };
  error?: string;
}

// 批量交易结果
export interface BatchTransactionResult {
  completedCount: number;
  failedCount: number;
  transactions: Array<{
    txHash: string;
    status: 'success' | 'failed';
    error?: string;
  }>;
}

// 单笔交易结果
export interface TransactionResult {
  type: 'creator' | 'iao' | 'liquidity' | 'airdrop' | 'mining' | 'burn';
  amount: string;
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  toAddress: string | null; // 允许为 null，表示地址未知
  error?: string;
  batchResult?: BatchTransactionResult; // 批量交易结果，用于批量操作
}

// 钱包余额信息
export interface WalletBalance {
  balance: string;
  formatted: string;
}

// 分配比例配置
export interface DistributionConfig {
  CREATOR: number;    // 33%
  IAO: number;        // 15%
  LIQUIDITY: number;  // 10%
  AIRDROP: number;    // 2%
  MINING: number;     // 40%
}

// 固定分配地址
export interface DistributionAddresses {
  LIQUIDITY: `0x${string}`;  // DBCSwap流动性
  AIRDROP: `0x${string}`;    // 空投地址
  // IAO合约地址和创建者地址从数据库获取
}

// Agent信息
export interface AgentInfo {
  id: string;
  creator: {
    address: string;
  };
  iaoContractAddress?: string;
  tokenAddress: string;
}

// 分配数量计算结果
export interface DistributionAmounts {
  creator: string;
  iao: string;
  liquidity: string;
  airdrop: string;
  mining: string;
}

// 任务状态
export type TaskStatus = 'PENDING' | 'COMPLETED' | 'PARTIAL_FAILED' | 'FAILED';

// 交易状态
export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

// 分配类型
export type DistributionType = 'creator' | 'iao' | 'liquidity' | 'airdrop' | 'mining';

// 任务数据（存储在history表的error字段中）
export interface TaskData {
  totalSupply: string;
  tokenAddress: string;
  createdBy: string;
  status: TaskStatus;
  completedAt?: string;
  transactions?: TransactionResult[];
}

// 客户端实例
export interface WalletClients {
  walletClient: any;
  publicClient: any;
  serverAccount: any;
}
