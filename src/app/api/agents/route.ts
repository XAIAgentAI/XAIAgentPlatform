import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSuccessResponse, handleError, ApiError } from '@/lib/error';
import { verify } from 'jsonwebtoken';
import { getBatchTokenPrices } from '@/services/swapService';
import { fetchDBCTokens } from '@/services/dbcScan';

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
  [key: string]: any; // 添加索引签名
}

// 在文件顶部添加一个用于跟踪最后更新时间的变量
let lastPriceUpdateTime: Record<string, number> = {};
// 价格数据缓存
let tokenPriceCache: Record<string, any> = {};
// 缓存有效期，单位：秒
const PRICE_CACHE_TTL = process.env.PRICE_CACHE_TTL ? parseInt(process.env.PRICE_CACHE_TTL) : 10; // 默认10秒

// 获取 Agent 列表
export async function GET(request: Request) {
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

    // 查询总数
    const total = await prisma.agent.count({ where });

    // 查询数据
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
        // 总是加载最新的价格数据用于缓存比较
        prices: {
          orderBy: {
            timestamp: 'desc',
          },
          take: 1,
        }
      },
      orderBy,
    });

    // 组装token信息
    const tokenInfos = items
      .filter(item => (process.env.NEXT_PUBLIC_IS_TEST_ENV === 'true' ? item.tokenAddressTestnet : item.tokenAddress) && item.symbol)
      .map(item => ({
        address: (process.env.NEXT_PUBLIC_IS_TEST_ENV === 'true' ? item.tokenAddressTestnet : item.tokenAddress) || '',
        symbol: item.symbol || '',
      }));

    // 获取当前时间戳(秒)
    const now = Math.floor(Date.now() / 1000);
    
    // 决定是否需要调用API获取最新价格
    let needFetchPrices = forceRefresh || tokenInfos.some(info => {
      const cacheKey = `${info.symbol}-${info.address}`;
      const lastUpdate = tokenPriceCache[cacheKey]?.timestamp || 0;
      return now - lastUpdate > PRICE_CACHE_TTL;
    });

    // 并行获取价格和持有者数据
    const [tokenPrices, dbcTokens] = await Promise.all([
      // 条件性地获取价格数据
      needFetchPrices ? getBatchTokenPrices(tokenInfos).then(prices => {
        // 更新缓存
        Object.entries(prices).forEach(([symbol, data]) => {
          const tokenInfo = tokenInfos.find(info => info.symbol === symbol);
          if (tokenInfo) {
            const cacheKey = `${symbol}-${tokenInfo.address}`;
            tokenPriceCache[cacheKey] = {
              ...data,
              timestamp: now
            };
          }
        });
        return prices;
      }) : Promise.resolve({} as Record<string, any>),
      fetchDBCTokens()
    ]);

    // 处理返回数据
    let formattedItems: AgentWithSortData[] = items
      .map(item => {
        const tokenAddress = process.env.NEXT_PUBLIC_IS_TEST_ENV === 'true' ? item.tokenAddressTestnet : item.tokenAddress;
        const tokenInfo = dbcTokens.find(token => token.address === tokenAddress);
        let priceInfo;
        
        // 如果有symbol，检查是否需要更新价格
        if (item.symbol) {
          const cacheKey = `${item.symbol}-${tokenAddress}`;
          
          // 优先使用API获取的最新价格数据（如果有）
          if (needFetchPrices && tokenPrices[item.symbol]) {
            priceInfo = tokenPrices[item.symbol];
            // 更新最后更新时间
            lastPriceUpdateTime[item.id] = now;
            
            // 保存到数据库，但不等待结果，避免影响响应时间
            if (priceInfo?.usdPrice) {
              prisma.agentPrice.create({
                data: {
                  agentId: item.id,
                  price: priceInfo.usdPrice,
                }
              }).catch(err => console.error(`保存价格数据失败 (${item.id}):`, err));
              
              // 同时更新Agent表中的字段
              prisma.agent.update({
                where: { id: item.id },
                data: {
                  volume24h: priceInfo.volume24h ? `$${priceInfo.volume24h}` : item.volume24h,
                  tvl: priceInfo.tvl ? `$${priceInfo.tvl}` : item.tvl,
                  change24h: priceInfo.priceChange24h !== undefined ? `${priceInfo.priceChange24h.toFixed(2)}` : item.change24h,
                  marketCap: priceInfo.usdPrice && item.totalSupply ? `$${(priceInfo.usdPrice * Number(item.totalSupply)).toFixed(2)}` : item.marketCap
                }
              }).catch(err => console.error(`更新Agent价格字段失败 (${item.id}):`, err));
            }
          } 
          // 其次使用缓存数据
          else if (tokenPriceCache[cacheKey]) {
            priceInfo = tokenPriceCache[cacheKey];
          } 
          // 最后使用数据库中最近的价格数据
          else {
            const recentPrice = item.prices?.[0];
            if (recentPrice) {
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
        }
        
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
          iaoContractAddress: process.env.NEXT_PUBLIC_IS_TEST_ENV === 'true' ? item.iaoContractAddressTestnet : item.iaoContractAddress,
          iaoTokenAmount: item.iaoTokenAmount ? Number(item.iaoTokenAmount) : null,
          price: priceInfo?.usdPrice ? `$${priceInfo.usdPrice}` : undefined,
          priceChange24h: priceInfo?.priceChange24h,
          lp: priceInfo?.lp,
          // 保存原始数值用于排序
          _usdPrice: priceInfo?.usdPrice || 0,
          _volume24h: priceInfo?.volume24h || 0,
          _tvl: priceInfo?.tvl || 0,
          _marketCap: priceInfo?.usdPrice && item.totalSupply ? priceInfo.usdPrice * Number(item.totalSupply) : 0,
          _lp: priceInfo?.lp || 0,
          _priceChange24h: priceInfo?.priceChange24h || 0,
        };
      });

    // 如果需要按价格相关字段排序，在内存中进行排序
    if (['usdPrice', 'volume24h', 'tvl', 'marketCap', 'lp', 'priceChange24h'].includes(sortBy)) {
      const sortField = `_${sortBy}`;
      formattedItems = formattedItems.sort((a, b) => {
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
      formattedItems = formattedItems.sort((a, b) => {
        const scoreA = (a._marketCap || 0) * 0.5 + (a._volume24h || 0) * 0.3 + (a.usageCount || 0) * 0.2;
        const scoreB = (b._marketCap || 0) * 0.5 + (b._volume24h || 0) * 0.3 + (b.usageCount || 0) * 0.2;
        return sortOrder === 'desc' ? scoreB - scoreA : scoreA - scoreB;
      });
    } 
    else if (sortBy === 'trending') {
      // "趋势"排序：主要看价格变化和交易量
      formattedItems = formattedItems.sort((a, b) => {
        // 价格变化的绝对值乘以交易量
        const scoreA = Math.abs(a._priceChange24h || 0) * (a._volume24h || 1);
        const scoreB = Math.abs(b._priceChange24h || 0) * (b._volume24h || 1);
        return sortOrder === 'desc' ? scoreB - scoreA : scoreA - scoreB;
      });
    }

    // 清理超时的缓存项
    Object.keys(tokenPriceCache).forEach(key => {
      if (now - tokenPriceCache[key].timestamp > PRICE_CACHE_TTL * 2) {
        delete tokenPriceCache[key];
      }
    });

    return createSuccessResponse({
      items: formattedItems,
      total,
      page,
      pageSize,
      priceDataFreshness: needFetchPrices ? 'fresh' : 'cached',
    });
  } catch (error) {
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