import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSuccessResponse, handleError, ApiError } from '@/lib/error';
import { verify } from 'jsonwebtoken';
import { getBatchTokenPrices } from '@/services/swapService';
import { fetchDBCTokens } from '@/services/dbcScan';

const JWT_SECRET = 'xaiagent-jwt-secret-2024';

// 获取 Agent 列表
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const searchKeyword = searchParams.get('searchKeyword') || '';
    const category = searchParams.get('category');
    const status = searchParams.get('status');

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
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 组装token信息
    const tokenInfos = items
      .filter(item => (process.env.NEXT_PUBLIC_IS_TEST_ENV === 'true' ? item.tokenAddressTestnet : item.tokenAddress) && item.symbol)
      .map(item => ({
        address: (process.env.NEXT_PUBLIC_IS_TEST_ENV === 'true' ? item.tokenAddressTestnet : item.tokenAddress) || '',
        symbol: item.symbol || '',
      }));

    // 并行获取价格和持有者数据
    const [tokenPrices, dbcTokens] = await Promise.all([
      getBatchTokenPrices(tokenInfos),
      fetchDBCTokens()
    ]);

    // 处理返回数据
    const formattedItems = items
      .map(item => {
        const priceInfo = item.symbol ? tokenPrices[item.symbol] : undefined;
        const tokenAddress = process.env.NEXT_PUBLIC_IS_TEST_ENV === 'true' ? item.tokenAddressTestnet : item.tokenAddress;
        const tokenInfo = dbcTokens.find(token => token.address === tokenAddress);
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
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return createSuccessResponse({
      items: formattedItems,
      total,
      page,
      pageSize,
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