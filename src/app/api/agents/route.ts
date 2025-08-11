import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSuccessResponse, handleError, ApiError } from '@/lib/error';
import { createCorsPreflightResponse } from '@/lib/cors';
import { verify } from 'jsonwebtoken';
import { 
  getStatusTimeFilter, 
  safeJSONStringify, 
  fetchExternalData, 
  sortAgentData, 
  buildOrderBy,
  formatAgentData
} from './utils';
import { checkIaoSuccess } from '@/utils/iao-success-checker';

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

    // 第一步：处理IAO已结束但未检查成功状态的数据
    const now = Math.floor(Date.now() / 1000);
    
    // 使用Prisma查询待检查的Agent
    const pendingIaoCheckAgents = await prisma.agent.findMany({
      where: {
        // iaoSuccessChecked: false,
        iaoEndTime: {
          not: null,
          lte: now
        },
        OR: [
          { iaoContractAddress: { not: null } },
          { iaoContractAddressTestnet: { not: null } }
        ]
      },
      select: {
        id: true,
        name: true,
        symbol: true,
        iaoEndTime: true,
        iaoContractAddress: true,
        iaoContractAddressTestnet: true
      }
    });

    console.log(`当前时间戳: ${now}`);
    console.log(`查询到的待检查Agent数量: ${pendingIaoCheckAgents.length}`);
    
    // if (pendingIaoCheckAgents.length > 0) {
    //   console.log(`待检查的Agent详情:`, pendingIaoCheckAgents.map(agent => ({
    //     id: agent.id,
    //     name: agent.name,
    //     symbol: agent.symbol,
    //     iaoEndTime: agent.iaoEndTime,
    //     iaoContractAddress: agent.iaoContractAddress,
    //     iaoContractAddressTestnet: agent.iaoContractAddressTestnet
    //   })));
    // }

    // 批量检查IAO成功状态并更新数据库
    if (pendingIaoCheckAgents.length > 0) {
      console.log(`发现 ${pendingIaoCheckAgents.length} 个需要检查IAO成功状态的Agent`);
      
      const updatePromises = pendingIaoCheckAgents.map(async (agent) => {
         try {
           console.log(`开始检查Agent ${agent.name} (ID: ${agent.id}) 的IAO状态...`);
           
           const checkResult = await checkIaoSuccess(agent);
           console.log(`Agent ${agent.name} 检查结果:`, {
             agentId: checkResult.agentId,
             agentName: checkResult.agentName,
             isSuccessful: checkResult.isSuccessful,
             error: checkResult.error,
             iaoEndTime: checkResult.iaoEndTime,
             iaoContractAddress: checkResult.iaoContractAddress
           });
           
           // 使用Prisma类型安全更新数据库
           console.log(`准备更新数据库，Agent ID: ${agent.id} ${agent.name}, 更新数据:`, {
             iaoSuccessful: checkResult.isSuccessful,
             iaoSuccessChecked: true,
             iaoSuccessCheckTime: new Date()
           });
           
           const updateResult = await prisma.agent.update({
             where: { id: agent.id },
             data: {
               iaoSuccessful: checkResult.isSuccessful,
               iaoSuccessChecked: true,
               iaoSuccessCheckTime: new Date()
             }
           });
           
          //  console.log(`Agent ${agent.name} 数据库更新成功:`, {
          //    agentId: updateResult.id,
          //    agentName: updateResult.name,
          //    iaoSuccessful: updateResult.iaoSuccessful,
          //    iaoSuccessChecked: updateResult.iaoSuccessChecked,
          //    iaoSuccessCheckTime: updateResult.iaoSuccessCheckTime
          //  });
         } catch (error) {
           console.error(`检查Agent ${agent.name} IAO状态失败:`, error);
           console.error(`错误详情:`, {
             message: error instanceof Error ? error.message : '未知错误',
             stack: error instanceof Error ? error.stack : undefined,
             agentId: agent.id,
             agentName: agent.name
           });
         }
       });
      
      // 等待所有更新完成
      await Promise.all(updatePromises);
      console.log('所有IAO状态检查完成');
      
      // 验证更新结果
      const updatedAgentIds = pendingIaoCheckAgents.map(agent => agent.id);
      const verificationResults = await prisma.agent.findMany({
        where: { id: { in: updatedAgentIds } },
        select: {
          id: true,
          name: true,
          iaoSuccessful: true,
          iaoSuccessChecked: true,
          iaoSuccessCheckTime: true
        }
      });
      
      // console.log('更新验证结果:', verificationResults);
    }

    // 构建查询条件
    const andConditions: any[] = [
      ...(searchKeyword ? [{ name: { contains: searchKeyword, mode: 'insensitive' as any } }] : []),
      ...(category ? [{ category }] : []),
      ...getStatusTimeFilter(status),
    ];

    const where = status === 'FAILED'
      ? { AND: [...andConditions, { iaoSuccessful: false }] }
      : { AND: [...andConditions, { OR: [{ iaoSuccessful: true }, { iaoSuccessful: null }] }] };

    // 构建排序条件
    const orderBy = buildOrderBy(sortBy, sortOrder);

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
        // 获取最近的价格数据
        prices: {
          orderBy: {
            timestamp: 'desc',
          },
          take: 1,
        }
      },
      orderBy,
    });

    if(status === 'FAILED') {
      console.log("FAILED的数据", items);
    }
    

    // 组装token信息
    const tokenInfos = items
      .filter(item => (process.env.NEXT_PUBLIC_IS_TEST_ENV === 'true' ? item.tokenAddressTestnet : item.tokenAddress) && item.symbol)
      .map(item => ({
        address: (process.env.NEXT_PUBLIC_IS_TEST_ENV === 'true' ? item.tokenAddressTestnet : item.tokenAddress) || '',
        symbol: item.symbol || '',
      }));

    // 获取外部数据
    const externalData = await fetchExternalData(tokenInfos);
    const { tokenPrices, dbcTokens } = externalData;

    // 格式化数据
    const { formattedItems } = await formatAgentData(
      items,
      dbcTokens,
      tokenPrices
    );

    // 排序数据
    const sortedItems = await sortAgentData(formattedItems, sortBy, sortOrder, page, status);

    // 在返回前测试数据是否可以被安全序列化
    try {
      // 尝试序列化结果数据
      const testData = {
        items: sortedItems,
        total,
        page,
        pageSize,
        timeDataSource: 'database_synced_by_events',
      };

      // 测试序列化
      const testJson = safeJSONStringify(testData);
    } catch (serializeError) {
      console.error('数据序列化测试失败:', serializeError);
      // 进行更深层次的错误诊断
      try {
        // 尝试识别问题数据
        const problemItems = sortedItems.filter(item => {
          try {
            JSON.stringify(item);
            return false; // 可以序列化，没有问题
          } catch (err) {
            return true; // 序列化失败，发现问题项
          }
        });
        
        if (problemItems.length > 0) {
          console.error('发现无法序列化的项目:', problemItems.map(item => item.id));
        }
      } catch (diagError) {
        console.error('诊断过程也失败:', diagError);
      }
    }

    return createSuccessResponse({
      items: sortedItems,
      total,
      page,
      pageSize,
      timeDataSource: 'database_synced_by_events', // 说明时间数据来源
    }, '操作成功', request);
  } catch (error) {
    console.error('API请求异常:', error);
    return handleError(error, request);
  }
}

// 处理OPTIONS请求（预检请求）
export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  return createCorsPreflightResponse(origin);
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