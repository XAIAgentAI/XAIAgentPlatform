export interface LocalAgent {
  id: number;
  name: string;
  description: string;
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
  token?: string;
  tokenAddress?: string;
  totalSupply?: number;
  useCases?: string[];
  useCasesJA?: string[];
  useCasesKO?: string[];
  useCasesZH?: string[];
  chatEntry?: string;
  symbol: string;
}

export interface AgentPrice {
  marketCap: string;
  change24h: string;
  volume24h: string;
} 