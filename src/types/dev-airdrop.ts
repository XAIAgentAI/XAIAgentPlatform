// 开发环境空投相关类型定义

export interface DevAirdropRecord {
  id: string;
  walletAddress: string;
  amount: string;
  tokenAddress: string; // 代币合约地址
  description?: string;
  transactionHash?: string;
  blockNumber?: bigint;
  gasUsed?: string;
  status: 'pending' | 'success' | 'failed';
  environment: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAirdropRecordData {
  walletAddress: string;
  amount: string;
  tokenAddress: string; // 代币合约地址
  description?: string;
  status: 'pending' | 'success' | 'failed';
  environment: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface UpdateAirdropRecordData {
  transactionHash?: string;
  blockNumber?: bigint;
  gasUsed?: string;
  status?: 'pending' | 'success' | 'failed';
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface AirdropStats {
  count: number;
  totalAmount: string | null;
}

export interface AirdropResponse {
  success: boolean;
  message: string;
  data?: {
    recordId?: string;
    walletAddress: string;
    amount: string;
    tokenAddress: string;
    transactionHash?: string;
    blockNumber?: bigint;
    gasUsed?: string;
  };
  error?: string;
}

export interface AirdropStatusResponse {
  success: boolean;
  message: string;
  data: {
    serverWalletAddress: string;
    network: string;
    chainId: number;
    environment: string;
    isTestnet: boolean;
    records: DevAirdropRecord[];
    pagination: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
    };
    stats: Record<string, AirdropStats>;
  };
}

// 扩展Prisma客户端类型
declare global {
  namespace PrismaJson {
    type DevAirdropMetadata = Record<string, any>;
  }
}

// 临时Prisma客户端扩展（在数据库迁移完成后可以移除）
export interface ExtendedPrismaClient {
  devAirdropRecord: {
    create: (data: { data: CreateAirdropRecordData }) => Promise<DevAirdropRecord>;
    update: (data: { where: { id: string }; data: UpdateAirdropRecordData }) => Promise<DevAirdropRecord>;
    findMany: (params: any) => Promise<DevAirdropRecord[]>;
    count: (params: any) => Promise<number>;
    groupBy: (params: any) => Promise<any[]>;
  };
} 