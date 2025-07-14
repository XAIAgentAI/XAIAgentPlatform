import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSuccessResponse, handleError, ApiError } from '@/lib/error';
import { getUserId } from '@/lib/auth';

// 根据IAO时间动态计算状态
function calculateDynamicStatus(agent: any): string {
  const now = Math.floor(Date.now() / 1000);
  const iaoStartTime = agent.iaoStartTime ? Number(agent.iaoStartTime) : null;
  const iaoEndTime = agent.iaoEndTime ? Number(agent.iaoEndTime) : null;
  const tokenAddress = process.env.NEXT_PUBLIC_IS_TEST_ENV === 'true'
    ? agent.tokenAddressTestnet
    : agent.tokenAddress;

  // 调试打印 - 单个Agent详情
  console.log(`[Agent详情状态计算] Agent: ${agent.name} (${agent.id})`);
  console.log(`[Agent详情状态计算] 原始状态: ${agent.status}`);
  console.log(`[Agent详情状态计算] 当前时间戳: ${now} (${new Date(now * 1000).toISOString()})`);
  console.log(`[Agent详情状态计算] IAO开始时间: ${iaoStartTime} (${iaoStartTime ? new Date(iaoStartTime * 1000).toISOString() : 'null'})`);
  console.log(`[Agent详情状态计算] IAO结束时间: ${iaoEndTime} (${iaoEndTime ? new Date(iaoEndTime * 1000).toISOString() : 'null'})`);
  console.log(`[Agent详情状态计算] 代币地址: ${tokenAddress || 'null'}`);
  console.log(`[Agent详情状态计算] 测试环境: ${process.env.NEXT_PUBLIC_IS_TEST_ENV}`);

  // 如果没有IAO时间信息，检查原状态
  if (!iaoStartTime || !iaoEndTime) {
    // 如果原状态是FAILED或failed，但没有IAO时间信息，说明是还未设置IAO时间，应该显示TBA
    if (agent.status === 'FAILED' || agent.status === 'failed') {
      console.log(`[Agent详情状态计算] 没有IAO时间信息且原状态为${agent.status}，改为TBA`);
      return 'TBA';
    }
    console.log(`[Agent详情状态计算] 没有IAO时间信息，返回原状态: ${agent.status}`);
    return agent.status;
  }

  let calculatedStatus: string;

  // 根据当前时间和IAO时间判断状态
  if (now < iaoStartTime) {
    // IAO还未开始
    calculatedStatus = 'IAO_COMING_SOON';
    console.log(`[Agent详情状态计算] IAO还未开始，状态: ${calculatedStatus}`);
  } else if (now >= iaoStartTime && now < iaoEndTime) {
    // IAO进行中
    calculatedStatus = 'IAO_ONGOING';
    console.log(`[Agent详情状态计算] IAO进行中，状态: ${calculatedStatus}`);
  } else if (now >= iaoEndTime) {
    // IAO已结束，检查是否有代币地址
    if (tokenAddress) {
      // 有代币地址，表示可交易
      calculatedStatus = 'TRADABLE';
      console.log(`[Agent详情状态计算] IAO已结束且有代币地址，状态: ${calculatedStatus}`);
    } else {
      // IAO结束但还没有代币地址，检查原状态
      if (agent.status === 'FAILED') {
        // 如果原状态是FAILED，说明IAO确实失败了
        calculatedStatus = 'FAILED';
        console.log(`[Agent详情状态计算] IAO已结束，原状态为FAILED，保持FAILED状态`);
      } else {
        // 其他情况，可能在处理中
        calculatedStatus = 'TBA';
        console.log(`[Agent详情状态计算] IAO已结束但无代币地址，状态: ${calculatedStatus}`);
      }
    }
  } else {
    // 默认返回原状态
    calculatedStatus = agent.status;
    console.log(`[Agent详情状态计算] 未匹配任何条件，返回原状态: ${calculatedStatus}`);
  }

  // 最终检查：如果计算出的状态是FAILED或failed，统一改为TBA
  if (calculatedStatus === 'FAILED' || calculatedStatus === 'failed') {
    calculatedStatus = 'TBA';
    console.log(`[Agent详情状态计算] 将${agent.status}状态改为TBA`);
  }

  console.log(`[Agent详情状态计算] 最终状态: ${calculatedStatus}`);
  console.log(`[Agent详情状态计算] ==========================================`);

  return calculatedStatus;
}

// 获取 Agent 详情
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const agent = await prisma.agent.findUnique({
      where: { id: String(params.id) },
      include: {
        creator: {
          select: {
            address: true,
          },
        },
        examples: true,
        _count: {
          select: {
            reviews: true,
            tasks: true,
          },
        },
      },
    });

    if (!agent) {
      throw new ApiError(404, 'Agent不存在');
    }

    // 管理状态字段
    const managementStatus = {
      tokensDistributed: (agent as any).tokensDistributed,
      liquidityAdded: (agent as any).liquidityAdded,
      tokensBurned: (agent as any).tokensBurned,
      ownerTransferred: (agent as any).ownerTransferred,
      miningOwnerTransferred: (agent as any).miningOwnerTransferred,
    };

    // 计算动态状态
    const dynamicStatus = calculateDynamicStatus(agent);

    return createSuccessResponse({
      ...agent,
      status: dynamicStatus, // 使用动态计算的状态
      capabilities: JSON.parse(agent.capabilities),
      creatorAddress: agent.creator.address,
      reviewCount: agent._count.reviews,
      taskCount: agent._count.tasks,
      totalSupply: agent.totalSupply ? Number(agent.totalSupply) : null,
      tokenAddress: process.env.NEXT_PUBLIC_IS_TEST_ENV === 'true' ? agent.tokenAddressTestnet : agent.tokenAddress,
      iaoContractAddress: process.env.NEXT_PUBLIC_IS_TEST_ENV === 'true' ? agent.iaoContractAddressTestnet : agent.iaoContractAddress,
      projectDescription: (agent as any).projectDescription,
      containerLink: (agent as any).containerLink,
      // 添加IAO时间信息
      iaoStartTime: agent.iaoStartTime ? Number(agent.iaoStartTime) : null,
      iaoEndTime: agent.iaoEndTime ? Number(agent.iaoEndTime) : null,
      // 添加管理状态字段
      ...managementStatus,
    });
  } catch (error) {
    return handleError(error);
  }
}

// 更新 Agent
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserId();
    if (!userId) {
      throw new ApiError(401, '未授权');
    }

    const agent = await prisma.agent.findUnique({
      where: { id: params.id },
      select: { creatorId: true },
    });

    if (!agent) {
      throw new ApiError(404, 'Agent不存在');
    }

    if (agent.creatorId !== userId) {
      throw new ApiError(403, '无权限修改');
    }

    const body = await request.json();
    const {
      name,
      description,
      longDescription,
      category,
      avatar,
      capabilities,
      examples,
      containerLink,
      updateStartTime,
      updateEndTime
    } = body;

    console.log('Updating agent with data:', { 
      name, 
      description, 
      category, 
      containerLink,
      updateStartTime,
      updateEndTime,
      body: JSON.stringify(body, null, 2)
    });

    // 如果只是更新IAO时间，不需要验证其他必填字段
    const isTimeUpdateOnly = updateStartTime && updateEndTime && !name && !description && !category && !capabilities;

    // 验证必填字段（除非只是更新时间）
    if (!isTimeUpdateOnly && (!name || !description || !category || !capabilities)) {
      throw new ApiError(400, '缺少必要参数');
    }

    // 获取完整的Agent信息，包括合约地址和创建者地址
    const fullAgent = await prisma.agent.findUnique({
      where: { id: params.id },
      include: {
        creator: {
          select: {
            address: true
          }
        }
      }
    });

    if (!fullAgent) {
      throw new ApiError(404, 'Agent不存在');
    }

    // 如果提供了时间更新参数，直接更新数据库中的IAO时间
    if (updateStartTime && updateEndTime) {
      console.log(`[时间更新] 更新数据库中的IAO时间...`);
      console.log(`[时间更新] 新开始时间: ${updateStartTime}`);
      console.log(`[时间更新] 新结束时间: ${updateEndTime}`);

      try {


        // 更新Agent记录中的开始和结束时间（存储为Unix时间戳）
        await prisma.agent.update({
          where: { id: params.id },
          data: {
            iaoStartTime: BigInt(updateStartTime),
            iaoEndTime: BigInt(updateEndTime),
          },
        });

        console.log(`[时间更新] 数据库IAO时间更新成功`);

        // 如果只是更新时间，直接返回成功响应
        if (isTimeUpdateOnly) {
          return createSuccessResponse(null, 'IAO时间更新成功');
        }
      } catch (error) {
        console.error(`[时间更新] 数据库更新失败:`, error);



        return NextResponse.json({
          code: 500,
          message: `更新IAO时间失败: ${error instanceof Error ? error.message : '未知错误'}`,
          data: null
        });
      }
    }

    // 如果不是只更新时间，则更新其他Agent字段
    if (!isTimeUpdateOnly) {
      // 更新 Agent
      const updatedAgent = await prisma.agent.update({
        where: { id: params.id },
        data: {
          name,
          description,
          longDescription,
          category,
          avatar,
          capabilities: JSON.stringify(capabilities),
          containerLink,
          examples: examples
            ? {
                deleteMany: {},
                createMany: {
                  data: examples.map((example: any) => ({
                    title: example.title,
                    description: example.description,
                    prompt: example.prompt,
                  })),
                },
              }
            : undefined,
        } as any,
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
        ...updatedAgent,
        capabilities: JSON.parse(updatedAgent.capabilities),
        creatorAddress: updatedAgent.creator.address,
      }, '更新成功');
    }
  } catch (error) {
    return handleError(error);
  }
}

// 更新 Agent
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserId();
    if (!userId) {
      throw new ApiError(401, '未授权');
    }

    const agent = await prisma.agent.findUnique({
      where: { id: params.id },
      select: { creatorId: true },
    });

    if (!agent) {
      throw new ApiError(404, 'Agent不存在');
    }

    if (agent.creatorId !== userId) {
      throw new ApiError(403, '无权限更新');
    }

    const data = await request.json();
    
    // 更新 Agent
    const updatedAgent = await prisma.agent.update({
      where: { id: params.id },
      data: {
        projectDescription: data.projectDescription,
      } as any,
    });

    return createSuccessResponse(updatedAgent, '更新成功');
  } catch (error) {
    return handleError(error);
  }
}

// 删除 Agent
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserId();
    if (!userId) {
      throw new ApiError(401, '未授权');
    }

    const agent = await prisma.agent.findUnique({
      where: { id: params.id },
      select: { creatorId: true },
    });

    if (!agent) {
      throw new ApiError(404, 'Agent不存在');
    }

    if (agent.creatorId !== userId) {
      throw new ApiError(403, '无权限删除');
    }

    // 删除 Agent
    await prisma.agent.delete({
      where: { id: params.id },
    });

    return createSuccessResponse(null, '删除成功');
  } catch (error) {
    return handleError(error);
  }
} 