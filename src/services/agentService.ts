import { LocalAgent } from "@/types/agent"
import { DBCToken } from "@/services/dbcScan"
import { getBatchTokenPrices } from "./swapService"

// 格式化数字
export const formatNumber = (num: string | number | undefined, decimals: number = 6): string => {
  const numValue = Number(num);
  if (isNaN(numValue) || !isFinite(numValue)) return '0';
  if (numValue === 0) return '0';
  if (numValue < 0.000001) return numValue.toExponential(decimals);
  return numValue.toFixed(decimals).replace(/\.?0+$/, '');
};

// 将 API 响应数据转换为 LocalAgent 对象
export const transformToLocalAgent = (item: any): LocalAgent => ({
  id: (item.id),
  name: item.name,
  description: item.description,
  longDescription: item.longDescription || item.description,
  category: item.category,
  avatar: item.avatar || '/images/default-avatar.png',
  status: item.status,
  capabilities: Array.isArray(item.capabilities) ? item.capabilities.join(',') : '',
  rating: item.rating || 0,
  usageCount: item.usageCount || 0,
  marketCap: item.marketCap || "$0",
  change24h: item.change24h || "0%",
  volume24h: item.volume24h || "$0",
  creatorId: item.creatorAddress,
  createdAt: new Date(item.createdAt),
  updatedAt: new Date(item.createdAt),
  symbol: item.symbol || '',
  type: item.type || item.category || 'Unknown',
  tvl: item.tvl || "$0",
  holdersCount: item.holdersCount || 0,
  socialLinks: item.socialLinks || '',
  tokenAddress: item.tokenAddress || '',
  iaoContractAddress: item.iaoContractAddress || '',
  tokenAddressTestnet: item.tokenAddressTestnet || '',
  iaoContractAddressTestnet: item.iaoContractAddressTestnet || '',
  totalSupply: item.totalSupply || 0,
  marketCapTokenNumber: item.marketCapTokenNumber || 0,
  iaoTokenAmount: item.iaoTokenAmount || 0,
});

// 更新代理列表的代币持有者信息
export const updateAgentsWithTokens = (agents: LocalAgent[], tokens: DBCToken[]): LocalAgent[] => {
  return agents.map(agent => {
    const tokenData = tokens.find(token => token.address === agent.tokenAddress)
    if (tokenData) {
      return {
        ...agent,
        holdersCount: parseInt(tokenData.holders)
      }
    }
    return agent
  })
};

// 更新代理列表的价格信息
export const updateAgentsWithPrices = async (agents: LocalAgent[]): Promise<LocalAgent[]> => {
  const tokenInfos = agents
    .filter(agent => agent.tokenAddress && agent.symbol)
    .map(agent => ({
      address: agent.tokenAddress as string,
      symbol: agent.symbol
    }));

  if (tokenInfos.length === 0) {
    return agents;
  }

  try {
    const tokenSwapDatas = await getBatchTokenPrices(tokenInfos);

    // 记录获取到的价格变化数据，用于调试
    console.log('首页获取到的价格变化数据:',
      Object.entries(tokenSwapDatas).map(([symbol, data]) => ({
        symbol,
        priceChange24h: data.priceChange24h
      }))
    );



    const newAgents = agents.map(agent => {
      console.log('agent', agent)
      if (agent.tokenAddress && tokenSwapDatas[agent.symbol]) {
        const tokenSwapInfo = tokenSwapDatas[agent.symbol];
        const usdPrice = tokenSwapInfo.usdPrice || 0;

        // 确保价格变化格式一致，保留两位小数
        const priceChange = tokenSwapInfo.priceChange24h || 0;
        const formattedPriceChange = priceChange === 0 ? "0.00" : priceChange.toFixed(2);

        return {
          ...agent,
          marketCap: `$${formatNumber(usdPrice * (agent.totalSupply || 0))}`,
          tvl: `$${formatNumber(tokenSwapInfo.tvl || 0)}`,
          volume24h: `$${formatNumber(tokenSwapInfo.volume24h || 0)}`,
          price: `$${formatNumber(usdPrice, 8)}`,
          priceChange24h: formattedPriceChange,
          lp: `$${formatNumber(tokenSwapInfo.lp || 0)}`
        };
      }

      return agent;
    });


    return newAgents;
  } catch (error) {
    console.error('获取代币价格失败:', error);
    return agents;
  }
}; 