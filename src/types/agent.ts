import { type BadgeVariant } from "@/components/ui-custom/custom-badge"

export enum AgentStatus {
  TRADABLE = 'TRADABLE',
  IAO_ONGOING = 'IAO_ONGOING',
  IAO_COMING_SOON = 'IAO_COMING_SOON',
  TBA = 'TBA',
  CREATING = 'CREATING',
  ACTIVE = 'ACTIVE',
  FAILED = 'FAILED',
}

export const STATUS_VARIANT_MAP: Record<AgentStatus, BadgeVariant> = {
  [AgentStatus.TRADABLE]: 'success',        // 深绿色
  [AgentStatus.IAO_ONGOING]: 'lightSuccess', // 浅绿色
  [AgentStatus.IAO_COMING_SOON]: 'warning',   // 橙色
  [AgentStatus.TBA]: 'coffee',               // 咖啡色
  [AgentStatus.CREATING]: 'lightSuccess',          // 浅绿色
  [AgentStatus.ACTIVE]: 'success',          // 深绿色
  [AgentStatus.FAILED]: 'error',            // 红色
}

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
} 