export interface LocalAgent {
  id: number;
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

}

export interface AgentPrice {
  marketCap: string;
  change24h: string;
  volume24h: string;
} 