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

// 列字段枚举
export enum AgentColumnField {
  AGENT_INFO = 'agentInfo',           // Agent名称/图标/简介
  SYMBOL = 'symbol',                  // 代币符号
  TYPE = 'type',                      // 类型标签
  HOLDERS_COUNT = 'holdersCount',     // 持有人数
  STATUS = 'status',                  // 状态标签
  INVESTED_XAA = 'investedXAA',       // 已投入XAA
  IAO_END_COUNTDOWN = 'iaoEndCountdown', // IAO结束倒计时
  IAO_START_COUNTDOWN = 'iaoStartCountdown', // IAO开始倒计时
  MARKET_CAP = 'marketCap',           // 市值
  CHANGE_24H = 'change24h',           // 24小时涨跌
  TOKEN_PRICE = 'price',              // Token价格
  VOLUME_24H = 'volume24h',           // 24小时交易量
  LIQUIDITY_POOL = 'lp',              // 流动性池
  CHAT = 'chat'                       // 聊天功能
}

// 定义每个状态下显示的列
export const STATUS_COLUMNS_MAP: Record<string, AgentColumnField[]> = {
  'ALL': [
    AgentColumnField.AGENT_INFO,
    AgentColumnField.SYMBOL,
    AgentColumnField.TYPE,
    AgentColumnField.HOLDERS_COUNT,
    AgentColumnField.STATUS,
    AgentColumnField.INVESTED_XAA,
    AgentColumnField.IAO_END_COUNTDOWN,
    AgentColumnField.IAO_START_COUNTDOWN,
    AgentColumnField.MARKET_CAP,
    AgentColumnField.CHANGE_24H,
    AgentColumnField.TOKEN_PRICE,
    AgentColumnField.VOLUME_24H,
    AgentColumnField.LIQUIDITY_POOL,
    AgentColumnField.CHAT
  ],
  'IAO_ONGOING': [
    AgentColumnField.AGENT_INFO,
    AgentColumnField.SYMBOL,
    AgentColumnField.TYPE,
    AgentColumnField.HOLDERS_COUNT,
    AgentColumnField.STATUS,
    AgentColumnField.INVESTED_XAA,
    AgentColumnField.IAO_END_COUNTDOWN,
    AgentColumnField.CHAT
  ],
  'TRADABLE': [
    AgentColumnField.AGENT_INFO,
    AgentColumnField.SYMBOL,
    AgentColumnField.TYPE,
    AgentColumnField.HOLDERS_COUNT,
    AgentColumnField.STATUS,
    AgentColumnField.INVESTED_XAA,
    AgentColumnField.MARKET_CAP,
    AgentColumnField.CHANGE_24H,
    AgentColumnField.TOKEN_PRICE,
    AgentColumnField.VOLUME_24H,
    AgentColumnField.LIQUIDITY_POOL,
    AgentColumnField.CHAT
  ],
  'IAO_COMING_SOON': [
    AgentColumnField.AGENT_INFO,
    AgentColumnField.SYMBOL,
    AgentColumnField.TYPE,
    AgentColumnField.STATUS,
    AgentColumnField.IAO_START_COUNTDOWN,  // 替换为开始倒计时
    AgentColumnField.CHAT
  ]
}

// 判断某个字段在当前状态下是否应该显示
export const shouldShowColumn = (status: string, field: AgentColumnField): boolean => {
  if (!field) return false;
  
  // 当status为空字符串时，表示"全部"状态
  const effectiveStatus = status === '' ? 'ALL' : status;
  const columns = STATUS_COLUMNS_MAP[effectiveStatus] || STATUS_COLUMNS_MAP['ALL'];
  
  console.log('Status Check:', {
    originalStatus: status,
    effectiveStatus,
    field,
    hasColumns: !!columns,
    isShown: columns.includes(field)
  });
  
  return columns.includes(field);
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

// 排序字段枚举
export enum AgentSortField {
  INVESTED_XAA = 'investedXAA',
  HOLDERS_COUNT = 'holdersCount',
  MARKET_CAP = 'marketCap',
  LATEST = 'createdAt', // 最新，实际使用 createdAt 字段
}

// 每个筛选项下可用的排序方式和默认值
export const STATUS_SORT_OPTIONS_MAP: Record<string, { 
  options: { value: AgentSortField, label: string }[], 
  default: AgentSortField 
}> = {
  '': {  // 全部状态
    options: [
      { value: AgentSortField.MARKET_CAP, label: 'marketCap' },
      { value: AgentSortField.LATEST, label: 'latest' },
    ],
    default: AgentSortField.MARKET_CAP,
  },
  'IAO_ONGOING': {
    options: [
      { value: AgentSortField.INVESTED_XAA, label: 'investedXAA' },
      { value: AgentSortField.LATEST, label: 'latest' },
    ],
    default: AgentSortField.INVESTED_XAA,
  },
  'TRADABLE': {
    options: [
      { value: AgentSortField.MARKET_CAP, label: 'marketCap' },
      { value: AgentSortField.LATEST, label: 'latest' },
    ],
    default: AgentSortField.MARKET_CAP,
  },
  'IAO_COMING_SOON': {
    options: [
      { value: AgentSortField.LATEST, label: 'latest' },
    ],
    default: AgentSortField.LATEST,
  },
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
  investedXAA?: number;
  holdersCount: number;
  iaoEndTime?: string;
  iaoEndCountdown?: string;
  iaoStartTime?: string;
  iaoStartCountdown?: string;  // 添加开始倒计时字段
  socialLinks?: string;
  marketCap?: string;
  change24h?: string;
  price?: string;
  volume24h?: string;
  lp?: string;
}

export interface AgentListProps {
  agents: Agent[];
  loading?: boolean;
  onStatusFilterChange: (newStatus: string) => void;
  currentStatusFilter: string;
} 