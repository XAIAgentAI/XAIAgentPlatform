import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSuccessResponse, handleError, ApiError } from '@/lib/error';
import { verify } from 'jsonwebtoken';
import { getBatchTokenPrices } from '@/services/swapService';
import { fetchDBCTokens } from '@/services/dbcScan';
import { getBatchContractTimeInfo } from '@/services/contractService';

const JWT_SECRET = 'xaiagent-jwt-secret-2024';

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
  [key: string]: any; // 添加索引签名
}

// 在文件顶部添加一个用于跟踪最后更新时间的变量
let lastPriceUpdateTime: Record<string, number> = {};
// 价格数据缓存
let tokenPriceCache: Record<string, any> = {};
// DBC令牌缓存
let dbcTokensCache: any[] = [];
// 缓存Agent总数
let agentCountCache: {count: number, timestamp: number, cacheKey: string} = {count: 0, timestamp: 0, cacheKey: ''};
// 缓存合约时间信息
let contractTimeCache: {data: Record<string, { startTime: number; endTime: number }>, timestamp: number} = {data: {}, timestamp: 0};
// 缓存有效期，单位：秒
const CACHE_TTL = process.env.PRICE_CACHE_TTL ? parseInt(process.env.PRICE_CACHE_TTL) : 120; // 默认2分钟
// 总数缓存时间
const COUNT_CACHE_TTL = 120; // 2分钟
// 合约时间信息缓存时间
const CONTRACT_TIME_CACHE_TTL = 600; // 10分钟

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

// 更新价格数据到数据库（异步操作）
const updatePriceData = async (agentId: string, priceInfo: any, item: any) => {
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

// 已移除：合约时间信息现在通过事件监听自动同步到数据库
// 不再需要在API查询时更新合约时间

// 获取外部数据（Token价格和DBC令牌信息）
// 注意：合约时间信息现在通过事件监听自动同步，不再需要主动获取
interface ExternalDataResult {
  tokenPrices: Record<string, any>;
  dbcTokens: any[];
  needFetchData: boolean;
}

async function fetchExternalData(
  tokenInfos: { address: string; symbol: string }[],
  forceRefresh: boolean
): Promise<ExternalDataResult> {
  const now = Math.floor(Date.now() / 1000);
  console.log(`[性能] 开始检查是否需要获取外部数据`);
  const priceCheckStartTime = Date.now();

  // 检查是否需要获取价格和token数据
  let needFetchData = forceRefresh || (dbcTokensCache.length === 0) || tokenInfos.some(info => {
    const cacheKey = `${info.symbol}-${info.address}`;
    const lastUpdate = tokenPriceCache[cacheKey]?.timestamp || 0;
    return now - lastUpdate > CACHE_TTL;
  });

  console.log(`[性能] 检查缓存耗时: ${Date.now() - priceCheckStartTime}ms`);
  console.log(`[性能] 是否需要获取外部数据: ${needFetchData}`);

  // 默认使用缓存数据
  let tokenPrices = {} as Record<string, any>;
  let dbcTokens = dbcTokensCache;
  
  // 创建一个Promise数组来并行获取所有外部数据
  const externalDataPromises: Promise<any>[] = [];

  if (needFetchData) {
    if (tokenInfos.length > 0) {
      externalDataPromises.push(getBatchTokenPrices(tokenInfos));
    }
    externalDataPromises.push(fetchDBCTokens());
  }
  
  if (externalDataPromises.length > 0) {
    console.log(`[性能] 开始获取外部数据`);
    const fetchDataStartTime = Date.now();
    
    // 并行请求外部API数据
    const results = await Promise.all(externalDataPromises);
    
    // 根据Promise数组的顺序提取结果
    let resultIndex = 0;
    
    if (needFetchData) {
      if (tokenInfos.length > 0) {
        tokenPrices = results[resultIndex++];
      }
      dbcTokens = results[resultIndex++];

      // 更新缓存
      dbcTokensCache = dbcTokens;
      Object.entries(tokenPrices).forEach(([symbol, data]) => {
        const tokenInfo = tokenInfos.find(info => info.symbol === symbol);
        if (tokenInfo) {
          const cacheKey = `${symbol}-${tokenInfo.address}`;
          tokenPriceCache[cacheKey] = {
            ...data,
            timestamp: now
          };
        }
      });
    }
    
    console.log(`[性能] 获取外部数据完成，总耗时: ${Date.now() - fetchDataStartTime}ms`);
  } else {
    console.log(`[性能] 使用缓存数据`);
  }
  
  return {
    tokenPrices,
    dbcTokens,
    needFetchData
  };
}

// 格式化Agent数据
function formatAgentData(
  items: any[],
  dbcTokens: any[],
  tokenPrices: Record<string, any>,
  needFetchData: boolean
): { formattedItems: AgentWithSortData[], updateOperations: Promise<void>[] } {
  const now = Math.floor(Date.now() / 1000);
  console.log(`[性能] 开始处理返回数据`);
  const processingStartTime = Date.now();
  
  // 异步操作集合，用于等待所有数据库操作完成
  const updateOperations: Promise<void>[] = [];
  
  const formattedItems: AgentWithSortData[] = items.map(item => {
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
      const cacheKey = `${item.symbol}-${tokenAddress}`;
      
      // 检查是否有新获取的价格数据
      if (needFetchData && tokenPrices[item.symbol]) {
        priceInfo = tokenPrices[item.symbol];
        lastPriceUpdateTime[item.id] = now;
        
        // 创建异步更新操作但不等待
        const updateOp = updatePriceData(item.id, priceInfo, item);
        updateOperations.push(updateOp);
      } 
      // 其次使用缓存数据
      else if (tokenPriceCache[cacheKey]) {
        priceInfo = tokenPriceCache[cacheKey];
      } 
      // 最后使用数据库中最近的价格数据
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

    return {
      id: item.id,
      name: item.name,
      description: item.description,
      category: item.category,
      avatar: item.avatar,
      status: item.status,
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
      iaoTokenAmount: item.iaoTokenAmount ? Number(item.iaoTokenAmount) : null,
      price: priceInfo?.usdPrice ? `$${priceInfo.usdPrice}` : undefined,
      priceChange24h: priceInfo?.priceChange24h,
      lp: priceInfo?.lp,
      // 合约时间信息 - 直接使用数据库中的时间戳（通过事件监听自动同步）
      startTime: agent.iaoStartTime ? Number(agent.iaoStartTime) : undefined,
      endTime: agent.iaoEndTime ? Number(agent.iaoEndTime) : undefined,
      // 保存原始数值用于排序
      _usdPrice: priceInfo?.usdPrice || 0,
      _volume24h: priceInfo?.volume24h || 0,
      _tvl: priceInfo?.tvl || 0,
      _marketCap: priceInfo?.usdPrice && item.totalSupply ? priceInfo.usdPrice * Number(item.totalSupply) : 0,
      _lp: priceInfo?.lp || 0,
      _priceChange24h: priceInfo?.priceChange24h || 0,
    };
  });
    
  console.log(`[性能] 数据格式化耗时: ${Date.now() - processingStartTime}ms`);
  
  return { formattedItems, updateOperations };
}

// 根据指定字段对数据进行排序
function sortAgentData(
  items: AgentWithSortData[], 
  sortBy: string, 
  sortOrder: string
): AgentWithSortData[] {
  console.log(`[性能] 开始排序数据`);
  const sortStartTime = Date.now();
  
  let result = [...items]; // 创建副本以避免修改原数组
  
  if (['usdPrice', 'volume24h', 'tvl', 'marketCap', 'lp', 'priceChange24h'].includes(sortBy)) {
    const sortField = `_${sortBy}`;
    result = result.sort((a, b) => {
      if (sortOrder === 'desc') {
        return (b[sortField] || 0) - (a[sortField] || 0);
      } else {
        return (a[sortField] || 0) - (b[sortField] || 0);
      }
    });
  } 
  // 支持更复杂的排序组合
  else if (sortBy === 'hot') {
    // "热门"排序：结合市值、交易量和使用次数
    result = result.sort((a, b) => {
      const scoreA = (a._marketCap || 0) * 0.5 + (a._volume24h || 0) * 0.3 + (a.usageCount || 0) * 0.2;
      const scoreB = (b._marketCap || 0) * 0.5 + (b._volume24h || 0) * 0.3 + (b.usageCount || 0) * 0.2;
      return sortOrder === 'desc' ? scoreB - scoreA : scoreA - scoreB;
    });
  } 
  else if (sortBy === 'trending') {
    // "趋势"排序：主要看价格变化和交易量
    result = result.sort((a, b) => {
      // 价格变化的绝对值乘以交易量
      const scoreA = Math.abs(a._priceChange24h || 0) * (a._volume24h || 1);
      const scoreB = Math.abs(b._priceChange24h || 0) * (b._volume24h || 1);
      return sortOrder === 'desc' ? scoreB - scoreA : scoreA - scoreB;
    });
  }
  
  console.log(`[性能] 排序数据耗时: ${Date.now() - sortStartTime}ms`);
  
  return result;
}

// 清理过期缓存
function cleanExpiredCache(): void {
  const now = Math.floor(Date.now() / 1000);
  const cacheCleanStartTime = Date.now();

  Object.keys(tokenPriceCache).forEach(key => {
    if (now - tokenPriceCache[key].timestamp > CACHE_TTL * 2) {
      delete tokenPriceCache[key];
    }
  });

  console.log(`[性能] 清理缓存耗时: ${Date.now() - cacheCleanStartTime}ms`);
}

// 获取 Agent 列表
export async function GET(request: Request) {
  const startTime = Date.now();
  console.log(`[性能] API请求开始`);
  
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const searchKeyword = searchParams.get('searchKeyword') || '';
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    
    /**
     * 排序参数支持以下字段:
     * - createdAt: 创建时间（默认）
     * - usdPrice: 代币价格
     * - marketCap: 市值
     * - volume24h: 24小时交易量
     * - tvl: 总锁仓价值
     * - lp: 流动性池
     * - priceChange24h: 24小时价格变化
     * - rating: 评分
     * - usageCount: 使用次数
     * 
     * 复合排序字段:
     * - hot: 热门排序 (综合市值、交易量和使用次数)
     * - trending: 热度排序 (基于价格变化和交易量)
     */
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // 是否强制刷新价格数据，忽略缓存
    const forceRefresh = searchParams.get('forceRefresh') === 'true';

    const paramsTime = Date.now();
    console.log(`[性能] 参数处理耗时: ${paramsTime - startTime}ms`);

    // 构建查询条件
    const where = {
      AND: [
        // 搜索关键词
        searchKeyword ? {
          OR: [
            { name: { contains: searchKeyword } },
            { description: { contains: searchKeyword } },
          ],
        } : {},
        // 分类筛选
        category ? { category } : {},
        // 状态筛选
        status ? { status } : {},
      ],
    };

    // 构建排序条件
    let orderBy: any = {};
    
    // 处理特殊排序方式
    const specialSortFields = ['usdPrice', 'volume24h', 'tvl', 'marketCap', 'lp', 'priceChange24h', 'hot', 'trending'];
    
    // 根据价格等字段排序时使用不同的查询策略
    if (specialSortFields.includes(sortBy)) {
      // 默认使用创建时间排序，后续通过程序处理排序
      orderBy = { createdAt: 'desc' };
    } else {
      // 对于标准字段，直接使用数据库排序
      orderBy = { [sortBy]: sortOrder };
    }

    // 生成缓存键，用于缓存查询总数
    const countCacheKey = JSON.stringify({where});
    const now = Math.floor(Date.now() / 1000);
    
    // 查询总数（使用缓存）
    console.log(`[性能] 开始查询总数`);
    const countStartTime = Date.now();
    
    let total;
    // 如果缓存有效，直接使用缓存的总数
    if (agentCountCache.cacheKey === countCacheKey && 
        now - agentCountCache.timestamp < COUNT_CACHE_TTL && 
        !forceRefresh) {
      total = agentCountCache.count;
      console.log(`[性能] 使用缓存的查询总数`);
    } else {
      // 缓存无效，执行查询
      total = await prisma.agent.count({ where });
      // 更新缓存
      agentCountCache = {
        count: total,
        timestamp: now,
        cacheKey: countCacheKey
      };
    }
    
    console.log(`[性能] 查询总数耗时: ${Date.now() - countStartTime}ms`);

    // 查询数据
    console.log(`[性能] 开始查询数据`);
    const queryStartTime = Date.now();
    
    const items = await prisma.agent.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        creator: {
          select: {
            address: true,
          },
        },
        _count: {
          select: {
            reviews: true,
          },
        },
        // 只在缓存无效时请求价格数据
        prices: (forceRefresh) ? {
          orderBy: {
            timestamp: 'desc',
          },
          take: 1,
        } : false
      },
      orderBy,
    });
    
    console.log(`[性能] 查询数据耗时: ${Date.now() - queryStartTime}ms`);

    // 组装token信息
    const tokenAssemblyStartTime = Date.now();
    
    const tokenInfos = items
      .filter(item => (process.env.NEXT_PUBLIC_IS_TEST_ENV === 'true' ? item.tokenAddressTestnet : item.tokenAddress) && item.symbol)
      .map(item => ({
        address: (process.env.NEXT_PUBLIC_IS_TEST_ENV === 'true' ? item.tokenAddressTestnet : item.tokenAddress) || '',
        symbol: item.symbol || '',
      }));
    
    console.log(`[性能] 组装token信息耗时: ${Date.now() - tokenAssemblyStartTime}ms`);
    
    // 获取外部数据（不再需要获取合约时间，通过事件监听自动同步）
    const externalData = await fetchExternalData(tokenInfos, forceRefresh);
    const { tokenPrices, dbcTokens, needFetchData } = externalData;
    
    // 格式化数据
    const { formattedItems, updateOperations } = formatAgentData(
      items,
      dbcTokens,
      tokenPrices,
      needFetchData
    );
    
    // 排序数据
    const sortedItems = sortAgentData(formattedItems, sortBy, sortOrder);
    
    // 清理过期缓存
    cleanExpiredCache();
    
    console.log(`[性能] API请求总耗时: ${Date.now() - startTime}ms`);

    return createSuccessResponse({
      items: sortedItems,
      total,
      page,
      pageSize,
      priceDataFreshness: needFetchData ? 'fresh' : 'cached',
      timeDataSource: 'database_synced_by_events', // 说明时间数据来源
    });
  } catch (error) {
    console.log(`[性能] API请求异常，总耗时: ${Date.now() - startTime}ms`);
    return handleError(error);
  }
}

// 创建新的 Agent
export async function POST(request: Request) {
  try {
    // 验证 token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, '未授权');
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = verify(token, JWT_SECRET);
    } catch (error) {
      throw new ApiError(401, 'token无效');
    }

    const userId = (decoded as any).userId;
    const body = await request.json();
    const {
      name,
      description,
      longDescription,
      category,
      avatar,
      capabilities,
      examples,
    } = body;

    // 验证必填字段
    if (!name || !description || !category || !capabilities) {
      throw new ApiError(400, '缺少必要参数');
    }

    // 创建 Agent
    const agent = await prisma.agent.create({
      data: {
        name,
        description,
        longDescription,
        category,
        avatar,
        capabilities: JSON.stringify(capabilities),
        creatorId: userId,
        // 创建示例
        examples: examples?.length > 0
          ? {
              createMany: {
                data: examples.map((example: any) => ({
                  title: example.title,
                  description: example.description,
                  prompt: example.prompt,
                })),
              },
            }
          : undefined,
      },
      include: {
        creator: {
          select: {
            address: true,
          },
        },
        examples: true,
      },
    });

    return createSuccessResponse({
      ...agent,
      capabilities: JSON.parse(agent.capabilities),
      creatorAddress: agent.creator.address,
    }, '创建成功');
  } catch (error) {
    return handleError(error);
  }
} 