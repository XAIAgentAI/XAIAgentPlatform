import { prisma } from '@/lib/prisma';

export interface TokenListVersion {
  major: number;
  minor: number;
  patch: number;
}

export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  chainId: number;
  decimals: number;
  logoURI: string;
}

interface AgentToken {
  tokenAddress: string | null;
  tokenAddressTestnet: string | null;
  name: string;
  symbol: string | null;
  avatar: string | null;
}

export class TokenListService {
  // 获取所有可交易的代币列表
  static async getActiveTokens() {
    const now = Math.floor(Date.now() / 1000);

    const tokens = await prisma.agent.findMany({
      where: {
        // 只获取IAO已结束且有代币地址的代币
        AND: [
          { iaoEndTime: { lte: now } },
          {
            OR: [
              { tokenAddress: { not: null } },
              { tokenAddressTestnet: { not: null } }
            ]
          }
        ]
      },
      select: {
        tokenAddress: true,
        tokenAddressTestnet: true,
        name: true,
        symbol: true,
        avatar: true,
      }
    });

    return {
      name: "DBCSwap",
      logoURI: "https://dbcswap.io/favicon.png",
      keywords: [
        "deepchain",
        "defi",
        "dex"
      ],
      timestamp: new Date().toISOString(),
      tokens: tokens.map((token: AgentToken) => ({
        address: process.env.NEXT_PUBLIC_IS_TEST_ENV === 'true' 
          ? token.tokenAddressTestnet! 
          : token.tokenAddress!,
        name: token.name,
        symbol: token.symbol || '',
        chainId: 19880818, // 使用固定的链ID
        decimals: 18, // 使用固定的精度
        logoURI: token.avatar || `https://app.xaiagent.io/logo/${token.name}.png`
      })),
      version: {
        major: 4,
        minor: 2,
        patch: 0
      }
    };
  }

  // 检查代币是否可交易
  static async tokenExists(address: string): Promise<boolean> {
    const now = Math.floor(Date.now() / 1000);
    const count = await prisma.agent.count({
      where: {
        AND: [
          { iaoEndTime: { lte: now } },
          {
            OR: [
              { tokenAddress: address },
              { tokenAddressTestnet: address }
            ]
          }
        ]
      }
    });
    return count > 0;
  }

  // 根据代理ID获取代币
  static async getTokenByAgentId(agentId: string) {
    const now = Math.floor(Date.now() / 1000);
    return prisma.agent.findFirst({
      where: {
        AND: [
          { id: agentId },
          { iaoEndTime: { lte: now } },
          {
            OR: [
              { tokenAddress: { not: null } },
              { tokenAddressTestnet: { not: null } }
            ]
          }
        ]
      },
      select: {
        tokenAddress: true,
        tokenAddressTestnet: true,
        name: true,
        symbol: true,
        avatar: true
      }
    });
  }

  // 根据地址获取代币
  static async getTokenByAddress(address: string) {
    const now = Math.floor(Date.now() / 1000);
    return prisma.agent.findFirst({
      where: {
        AND: [
          { iaoEndTime: { lte: now } },
          {
            OR: [
              { tokenAddress: address },
              { tokenAddressTestnet: address }
            ]
          }
        ]
      },
      select: {
        tokenAddress: true,
        tokenAddressTestnet: true,
        name: true,
        symbol: true,
        avatar: true
      }
    });
  }
} 