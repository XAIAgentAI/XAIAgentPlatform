import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSuccessResponse, handleError, ApiError } from '@/lib/error';
import { getUserId } from '@/lib/auth';
import { calculateDynamicStatus } from '../utils/iao-utils';
import { checkIaoSuccess } from '@/utils/iao-success-checker';

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

    // 检查IAO成功状态
    const iaoSuccessStatus = await checkIaoSuccess(agent);

    // 将iaoSuccessful字段添加到agent对象中，供calculateDynamicStatus使用
    const agentWithIaoStatus = {
      ...agent,
      iaoSuccessful: iaoSuccessStatus.isSuccessful
    };

    // 计算动态状态
    const now = Math.floor(Date.now() / 1000);
    const dynamicStatus = calculateDynamicStatus(agentWithIaoStatus, now);

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
      descriptionJA,
      descriptionKO,
      descriptionZH,
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

      // 添加多语言描述字段（如果提供）
      if (descriptionJA !== undefined) updateData.descriptionJA = descriptionJA;
      if (descriptionKO !== undefined) updateData.descriptionKO = descriptionKO;
      if (descriptionZH !== undefined) updateData.descriptionZH = descriptionZH;

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