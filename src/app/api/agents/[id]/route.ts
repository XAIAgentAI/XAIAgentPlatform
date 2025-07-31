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
      throw new ApiError(404, 'Agent not found');
    }

    // 检查是否已有token地址
    const tokenAddress = process.env.NEXT_PUBLIC_IS_TEST_ENV === 'true'
      ? agent.tokenAddressTestnet
      : agent.tokenAddress;
    
    // 初始化任务数据
    let tokenCreationTaskData = null;
    
    // 只有在没有token地址时才查询任务状态
    if (!tokenAddress) {
      // 获取最新的创建代币任务
      const tokenCreationTask = await prisma.task.findFirst({
        where: {
          agentId: agent.id,
          type: 'CREATE_TOKEN'
        },
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          status: true,
          createdAt: true,
          completedAt: true,
          result: true
        }
      });
      
      // 处理任务结果
      if (tokenCreationTask) {
        try {
          tokenCreationTaskData = {
            id: tokenCreationTask.id,
            status: tokenCreationTask.status,
            createdAt: tokenCreationTask.createdAt,
            completedAt: tokenCreationTask.completedAt,
            result: tokenCreationTask.result ? JSON.parse(tokenCreationTask.result) : null
          };
        } catch (error) {
          console.error('解析创建代币任务结果失败:', error);
          tokenCreationTaskData = {
            id: tokenCreationTask.id,
            status: tokenCreationTask.status,
            createdAt: tokenCreationTask.createdAt,
            completedAt: tokenCreationTask.completedAt,
            result: { error: '结果格式错误' }
          };
        }
      }
    }

    // 管理状态字段
    const managementStatus = {
      tokensDistributed: (agent as any).tokensDistributed,
      liquidityAdded: (agent as any).liquidityAdded,
      tokensBurned: (agent as any).tokensBurned,
      ownerTransferred: (agent as any).ownerTransferred,
      miningOwnerTransferred: (agent as any).miningOwnerTransferred,
    };

    // 打印调试信息
    console.log('[Agent详情API] 管理状态字段:', managementStatus);
    console.log(`[Agent详情API] tokensDistributed类型: ${typeof (agent as any).tokensDistributed}, 值: ${(agent as any).tokensDistributed}`);

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
      // 添加管理状态字段 - 这里把所有字段都展开明确列出，避免使用展开运算符
      tokensDistributed: Boolean((agent as any).tokensDistributed),
      liquidityAdded: Boolean((agent as any).liquidityAdded),
      tokensBurned: Boolean((agent as any).tokensBurned),
      ownerTransferred: Boolean((agent as any).ownerTransferred),
      miningOwnerTransferred: Boolean((agent as any).miningOwnerTransferred),
      // 添加创建代币任务信息
      tokenCreationTask: tokenCreationTaskData,
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
      throw new ApiError(401, 'Unauthorized');
    }

    const agent = await prisma.agent.findUnique({
      where: { id: params.id },
      select: { creatorId: true },
    });

    if (!agent) {
      throw new ApiError(404, 'Agent not found');
    }

    if (agent.creatorId !== userId) {
      throw new ApiError(403, 'No permission to modify');
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
      updateEndTime,
      // 添加对话示例字段
      useCases,
      useCasesJA,
      useCasesKO,
      useCasesZH,
      // 添加社交媒体链接字段
      socialLinks
    } = body;

    console.log('Updating agent with data:', { 
      name, 
      description, 
      category, 
      containerLink,
      updateStartTime,
      updateEndTime,
      useCases,
      useCasesJA,
      useCasesKO,
      useCasesZH,
      body: JSON.stringify(body, null, 2)
    });

    // 如果只是更新IAO时间或社交媒体链接，不需要验证其他必填字段
    const isTimeUpdateOnly = updateStartTime && updateEndTime && !name && !description && !category && !capabilities;
    const isSocialLinksUpdateOnly = socialLinks && !name && !description && !category && !capabilities && !updateStartTime && !updateEndTime;

    // 验证必填字段（除非只是更新时间或社交媒体链接）
    if (!isTimeUpdateOnly && !isSocialLinksUpdateOnly && (!name || !description || !category || !capabilities)) {
      throw new ApiError(400, 'Missing required parameters');
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
      throw new ApiError(404, 'Agent not found');
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
          return createSuccessResponse(null, 'IAO time updated successfully');
        }
      } catch (error) {
        console.error(`[时间更新] 数据库更新失败:`, error);

        return NextResponse.json({
          code: 500,
          message: `Failed to update IAO time: ${error instanceof Error ? error.message : 'Unknown error'}`,
          data: null
        });
      }
    }

    // 如果只是更新社交媒体链接
    if (isSocialLinksUpdateOnly) {
      try {
        await prisma.agent.update({
          where: { id: params.id },
          data: {
            socialLinks,
          },
        });

        return createSuccessResponse(null, 'Social media links updated successfully');
      } catch (error) {
        console.error('更新社交媒体链接失败:', error);
        return NextResponse.json({
          code: 500,
          message: `Failed to update social media links: ${error instanceof Error ? error.message : 'Unknown error'}`,
          data: null
        });
      }
    }

    // 如果不是只更新时间，则更新其他Agent字段
    if (!isTimeUpdateOnly) {
      // 准备更新数据
      const updateData: any = {
        name,
        description,
        longDescription,
        category,
        avatar,
        capabilities: JSON.stringify(capabilities),
        containerLink,
      };

      // 添加对话示例字段（如果提供）
      if (useCases !== undefined) updateData.useCases = useCases;
      if (useCasesJA !== undefined) updateData.useCasesJA = useCasesJA;
      if (useCasesKO !== undefined) updateData.useCasesKO = useCasesKO;
      if (useCasesZH !== undefined) updateData.useCasesZH = useCasesZH;

      console.log('Final update data:', updateData);

      // 更新 Agent
      const updatedAgent = await prisma.agent.update({
        where: { id: params.id },
        data: {
          ...updateData,
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

      console.log('Update successful, returning agent:', updatedAgent);

      return createSuccessResponse({
        ...updatedAgent,
        capabilities: JSON.parse(updatedAgent.capabilities),
        creatorAddress: updatedAgent.creator.address,
      }, 'Updated successfully');
    }
  } catch (error) {
    console.error('更新Agent失败:', error);
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
      throw new ApiError(401, 'Unauthorized');
    }

    const agent = await prisma.agent.findUnique({
      where: { id: params.id },
      select: { creatorId: true },
    });

    if (!agent) {
      throw new ApiError(404, 'Agent not found');
    }

    if (agent.creatorId !== userId) {
      throw new ApiError(403, 'No permission to update');
    }

    const data = await request.json();
    
    // 更新 Agent
    const updatedAgent = await prisma.agent.update({
      where: { id: params.id },
      data: {
        projectDescription: data.projectDescription,
      } as any,
    });

    return createSuccessResponse(updatedAgent, 'Updated successfully');
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
      throw new ApiError(401, 'Unauthorized');
    }

    const agent = await prisma.agent.findUnique({
      where: { id: params.id },
      select: { creatorId: true },
    });

    if (!agent) {
      throw new ApiError(404, 'Agent not found');
    }

    if (agent.creatorId !== userId) {
      throw new ApiError(403, 'No permission to delete');
    }

    // 删除 Agent
    await prisma.agent.delete({
      where: { id: params.id },
    });

    return createSuccessResponse(null, 'Deleted successfully');
  } catch (error) {
    return handleError(error);
  }
} 