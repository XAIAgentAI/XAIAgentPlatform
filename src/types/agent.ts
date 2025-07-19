import { type BadgeVariant } from "@/components/ui-custom/custom-badge"

export enum AgentStatus {
  TRADABLE = 'Tradable',
  IAO_ONGOING = 'IAO_ONGOING',
  IAO_COMING_SOON = 'IAO_COMING_SOON',
  TBA = 'TBA',
  CREATING = 'CREATING',
  ACTIVE = 'ACTIVE',
  FAILED = 'FAILED',
}

// 状态到颜色变体的映射
export const STATUS_VARIANT_MAP: Record<string, BadgeVariant> = {
  'TRADABLE': 'success',        // 深绿色
  'Tradable': 'success',        // 兼容原有格式
  'IAO_ONGOING': 'lightSuccess', // 浅绿色
  'IAO_COMING_SOON': 'warning',   // 橙色
  'TBA': 'coffee',               // 咖啡色
  'CREATING': 'lightSuccess',    // 浅绿色
  'ACTIVE': 'success',          // 深绿色
  'FAILED': 'error',            // 红色
  'failed': 'error',            // 兼容小写
  'PENDING': 'warning',         // 橙色
  'pending': 'warning',         // 兼容小写
};

// 状态标准化映射 - 将各种可能的状态值标准化为显示文本
export const STATUS_DISPLAY_MAP: Record<string, string> = {
  'TRADABLE': 'TRADABLE',
  'Tradable': 'TRADABLE',
  'IAO_ONGOING': 'IAO_ONGOING',
  'IAO_COMING_SOON': 'IAO_COMING_SOON',
  'TBA': 'TBA',
  'CREATING': 'CREATING',
  'ACTIVE': 'ACTIVE',
  'FAILED': 'FAILED',
  'failed': 'FAILED',
  'PENDING': 'PENDING',
  'pending': 'PENDING',
};

// 获取状态对应的颜色变体
export const getStatusVariant = (status: string): BadgeVariant => {
  return STATUS_VARIANT_MAP[status] || 'default';
};

// 获取标准化的状态显示文本
export const getStatusDisplayText = (status: string): string => {
  return STATUS_DISPLAY_MAP[status] || status;
};

export interface LocalAgent {
  id: string;
  name: string;
  description: string;
  descriptionJA?: string;
  descriptionKO?: string;
  descriptionZH?: string;

  longDescription?: string | null;
  category: string;
  avatar?: string;
  status: string;
  capabilities: string;
  rating: number;
  usageCount: number;
  marketCap: string;
  marketCapTokenNumber?: number;
  change24h: string;
  volume24h: string;
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
  type: string;
  tvl: string;
  holdersCount: number;
  socialLinks?: string;
  tokenAddress?: string;
  iaoContractAddress?: string;
  totalSupply?: number;
  useCases?: string[];
  useCasesJA?: string[];
  useCasesKO?: string[];
  useCasesZH?: string[];
  chatEntry?: string;
  symbol: string;
  tokenAddressTestnet?: string;
  iaoContractAddressTestnet?: string;
  projectDescription?: string;
  iaoTokenAmount?: number;
  paymentContractAddress?: string;
  miningRate?: number; // 挖矿速率（每年可挖矿的代币比例）
  containerLink?: string; // 容器链接
  // Owner管理相关状态字段
  tokensDistributed?: boolean;
  ownerTransferred?: boolean;
  liquidityAdded?: boolean;
  tokensBurned?: boolean;
  miningOwnerTransferred?: boolean;
}

export interface AgentPrice {
  marketCap: string;
  change24h: string;
  volume24h: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  descriptionJA?: string;
  descriptionKO?: string;
  descriptionZH?: string;
  status: string;
  statusJA?: string;
  statusKO?: string;
  statusZH?: string;
  avatar?: string;
  symbol: string;
  type: string;
  marketCap: string;
  change24h: string;
  tvl: string;
  holdersCount: number;
  volume24h: string;
  socialLinks?: string;
  priceChange24h?: string;
  price?: string;
  lp?: string;
  iaoTokenAmount?: number;
}

export interface AgentListProps {
  agents: Agent[];
  loading?: boolean;
  onStatusFilterChange: (newStatus: string) => void;
  currentStatusFilter: string;
} 