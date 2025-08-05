import { prisma } from '@/lib/prisma';
import { checkIaoSuccess } from '@/utils/iao-success-checker';
import { calculateDynamicStatus } from './iao-utils';

// 定义排序字段接口
interface AgentWithSortData {
  id: string;
  name: string;
  description: string;
  category: string;
  avatar: string | null;
  status: string;
  capabilities: any;
  rating: number;
  usageCount: number;
  creatorAddress: string;
  reviewCount: number;
  createdAt: Date;
  symbol: string | null;
  totalSupply: number | null;
  tvl: string | null;
  holdersCount: number | null;
  volume24h: string | null;
  marketCap: string | null;
  marketCapTokenNumber: number | null;
  change24h: string | number | null;
  type: string | null;
  socialLinks: string | null;
  tokenAddress: string | null;
  iaoContractAddress: string | null;
  iaoTokenAmount: number | null;
  price: string | undefined;
  priceChange24h: number | undefined;
  lp: number | undefined;
  _usdPrice: number;
  _volume24h: number;
  _tvl: number;
  _marketCap: number;
  _lp: number;
  _priceChange24h: number;
  startTime?: number;
  endTime?: number;
  iaoContractAddressTestnet?: string | null;
  _iaoFundingAmount?: number;
  // IAO成功状态字段
  iaoSuccessful?: boolean;
  [key: string]: any; // 添加索引签名
}

// Agent数据库记录接口定义
interface AgentRecord {
  id: string;
  name: string;
  description: string;
  category: string;
  avatar: string | null;
  status: string;
  capabilities: string;
  rating: number;
  usageCount: number;
  symbol: string | null;
  totalSupply: any; // Decimal in prisma
  tvl: string | null;
  holdersCount: number | null;
  volume24h: string | null;
  marketCap: string | null;
  marketCapTokenNumber: any; // Decimal in prisma
  change24h: string | number | null;
  type: string | null;
  socialLinks: string | null;
  tokenAddress: string | null;
  tokenAddressTestnet: string | null;
  iaoContractAddress: string | null;
  iaoContractAddressTestnet: string | null;
  iaoTokenAmount: any; // Decimal in prisma
  iaoStartTime: bigint | null;
  iaoEndTime: bigint | null;
  createdAt: Date;
  // 其他字段...
}

// 处理 BigInt 序列化的辅助函数
export function safeJSONStringify(obj: any): string {
  return JSON.stringify(obj, (key, value) => {
    // 检测是否为 BigInt 类型
    if (typeof value === 'bigint') {
      return Number(value); // 将 BigInt 转换为 Number
    }
    return value;
  });
}

// 安全地转换 BigInt 类型
export function safeConvertBigInt(value: bigint | null): number | undefined {
  if (value === null || value === undefined) return undefined;
  try {
    return Number(value);
  } catch (error) {
    console.error('转换 BigInt 失败:', error);
    return undefined;
  }
}

// 更新价格数据到数据库（异步操作）
export const updatePriceData = async (agentId: string, priceInfo: any, item: any) => {
  if (!priceInfo?.usdPrice) return;
  
  // 异步保存价格数据，不等待结果
  prisma.agentPrice.create({
    data: {
      agentId: agentId,
      price: priceInfo.usdPrice,
    }
  }).catch(err => console.error(`保存价格数据失败 (${agentId}):`, err));
  
  // 同时更新Agent表中的字段
  prisma.agent.update({
    where: { id: agentId },
    data: {
      volume24h: priceInfo.volume24h ? `$${priceInfo.volume24h}` : item.volume24h,
      tvl: priceInfo.tvl ? `$${priceInfo.tvl}` : item.tvl,
      change24h: priceInfo.priceChange24h !== undefined ? `${priceInfo.priceChange24h.toFixed(2)}` : item.change24h,
      marketCap: priceInfo.usdPrice && item.totalSupply ? `$${(priceInfo.usdPrice * Number(item.totalSupply)).toFixed(2)}` : item.marketCap
    }
  }).catch(err => console.error(`更新Agent价格字段失败 (${agentId}):`, err));
};

// 计算市值
export function calculateMarketCap(priceInfo: any, item: any): number {
  let calculatedMarketCap = 0;
  if (priceInfo?.usdPrice && item.totalSupply) {
    calculatedMarketCap = priceInfo.usdPrice * Number(item.totalSupply);
  } else if (item.marketCap) {
    try {
      const marketCapStr = item.marketCap.replace(/[$,]/g, '');
      const marketCapNum = parseFloat(marketCapStr);
      if (!isNaN(marketCapNum)) {
        calculatedMarketCap = marketCapNum;
      }
    } catch (e) {
      console.error(`无法从 ${item.marketCap} 提取市值用于项目 ${item.name}:`, e);
    }
  }
  return calculatedMarketCap;
}

// 格式化Agent数据
export async function formatAgentData(
  items: any[],
  dbcTokens: any[],
  tokenPrices: Record<string, any>
): Promise<{ formattedItems: AgentWithSortData[], updateOperations: Promise<void>[] }> {
  const now = Math.floor(Date.now() / 1000);

  // 异步操作集合，用于等待所有数据库操作完成
  const updateOperations: Promise<void>[] = [];

  // 使用Promise.all处理异步IAO成功检查
  const formattedItemsPromises = items.map(async item => {
    const tokenAddress = process.env.NEXT_PUBLIC_IS_TEST_ENV === 'true'
      ? item.tokenAddressTestnet
      : item.tokenAddress;

    const contractAddress = process.env.NEXT_PUBLIC_IS_TEST_ENV === 'true'
      ? item.iaoContractAddressTestnet
      : item.iaoContractAddress;

    const tokenInfo = dbcTokens.find(token => token.address === tokenAddress);
    let priceInfo = null;

    // 获取价格信息
    if (item.symbol) {
      // 使用新获取的价格数据
      if (tokenPrices[item.symbol]) {
        priceInfo = tokenPrices[item.symbol];
        // 创建异步更新操作但不等待
        const updateOp = updatePriceData(item.id, priceInfo, item);
        updateOperations.push(updateOp);
      }
      // 使用数据库中最近的价格数据
      else if (item.prices?.[0]) {
        const recentPrice = item.prices[0];
        // 构造与API返回相似的价格信息对象
        priceInfo = {
          usdPrice: recentPrice.price,
          // 尝试从Agent表已有字段解析历史数据
          tvl: parseFloat(item.tvl?.replace(/[$,]/g, '') || '0'),
          volume24h: parseFloat(item.volume24h?.replace(/[$,]/g, '') || '0'),
          priceChange24h: typeof item.change24h === 'string' ?
            parseFloat(item.change24h.replace(/[%,]/g, '')) :
            (typeof item.change24h === 'number' ? item.change24h : 0),
          lp: 0 // 默认值
        };
      }
    }

    // 合约时间信息现在直接从数据库获取（通过事件监听自动同步）

    // 使用类型断言确保类型安全
    const agent = item as unknown as AgentRecord;

    // 检查IAO成功状态
    const iaoSuccessStatus = await checkIaoSuccess(agent);

    // 将iaoSuccessful字段添加到item对象中，供calculateDynamicStatus使用
    const itemWithIaoStatus = {
      ...item,
      iaoSuccessful: iaoSuccessStatus.isSuccessful
    };

    // 计算动态状态
    const dynamicStatus = calculateDynamicStatus(itemWithIaoStatus, now);
    
    // 计算市值 - 优先使用priceInfo和totalSupply计算，如果无法计算则尝试从marketCap字符串提取
    const calculatedMarketCap = calculateMarketCap(priceInfo, item);
    
    const formattedItem: AgentWithSortData = {
      id: item.id,
      name: item.name,
      description: item.description,
      category: item.category,
      avatar: item.avatar,
      status: dynamicStatus,
      capabilities: JSON.parse(item.capabilities),
      rating: item.rating,
      usageCount: item.usageCount,
      creatorAddress: item.creator.address,
      reviewCount: item._count.reviews,
      createdAt: item.createdAt,
      symbol: item.symbol,
      totalSupply: item.totalSupply ? Number(item.totalSupply) : null,
      tvl: priceInfo?.tvl ? `$${priceInfo.tvl}` : item.tvl,
      holdersCount: tokenInfo?.holders ? parseInt(tokenInfo.holders) : item.holdersCount,
      volume24h: priceInfo?.volume24h ? `$${priceInfo.volume24h}` : item.volume24h,
      marketCap: priceInfo?.usdPrice && item.totalSupply ? `$${(priceInfo.usdPrice * Number(item.totalSupply)).toFixed(2)}` : item.marketCap,
      marketCapTokenNumber: item.marketCapTokenNumber ? Number(item.marketCapTokenNumber) : null,
      change24h: priceInfo?.priceChange24h ?? item.change24h,
      type: item.type,
      socialLinks: item.socialLinks,
      tokenAddress,
      iaoContractAddress: contractAddress,
      iaoContractAddressTestnet: item.iaoContractAddressTestnet,
      iaoTokenAmount: item.iaoTokenAmount ? Number(item.iaoTokenAmount) : null,
      price: priceInfo?.usdPrice ? `$${priceInfo.usdPrice}` : undefined,
      priceChange24h: priceInfo?.priceChange24h,
      lp: priceInfo?.lp,
      // 合约时间信息 - 使用安全的 BigInt 转换
      iaoStartTime: safeConvertBigInt(agent.iaoStartTime),
      iaoEndTime: safeConvertBigInt(agent.iaoEndTime),
      // 管理状态字段
      tokensDistributed: item.tokensDistributed,
      liquidityAdded: item.liquidityAdded,
      tokensBurned: item.tokensBurned,
      ownerTransferred: item.ownerTransferred,
      miningOwnerTransferred: item.miningOwnerTransferred,
      // 保存原始数值用于排序
      _usdPrice: priceInfo?.usdPrice || 0,
      _volume24h: priceInfo?.volume24h || 0,
      _tvl: priceInfo?.tvl || 0,
      _marketCap: calculatedMarketCap,
      _lp: priceInfo?.lp || 0,
      _priceChange24h: priceInfo?.priceChange24h || 0,
      // 默认的 investedXAA 字段，将在排序时被实际值覆盖
      investedXAA: 0,
      // IAO成功状态
      iaoSuccessful: iaoSuccessStatus.isSuccessful ?? undefined,
    };

    return formattedItem;
  });

  const formattedItems = await Promise.all(formattedItemsPromises);

  return { formattedItems, updateOperations };
} 