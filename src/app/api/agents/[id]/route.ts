import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSuccessResponse, handleError, ApiError } from '@/lib/error';
import { getUserId } from '@/lib/auth';

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
            history: true,
          },
        },
      },
    });

    if (!agent) {
      throw new ApiError(404, 'Agent不存在');
    }

    return createSuccessResponse({
      ...agent,
      capabilities: JSON.parse(agent.capabilities),
      creatorAddress: agent.creator.address,
      reviewCount: agent._count.reviews,
      historyCount: agent._count.history,
      totalSupply: agent.totalSupply ? Number(agent.totalSupply) : null,
      tokenAddress: process.env.NEXT_PUBLIC_IS_TEST_ENV === 'true' ? agent.tokenAddressTestnet : agent.tokenAddress,
      iaoContractAddress: process.env.NEXT_PUBLIC_IS_TEST_ENV === 'true' ? agent.iaoContractAddressTestnet : agent.iaoContractAddress,
      projectDescription: (agent as any).projectDescription,
      containerLink: (agent as any).containerLink,
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
        // 记录时间更新历史
        await prisma.history.create({
          data: {
            action: 'update_time_from_client',
            result: 'success',
            agentId: params.id,
          },
        });

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

        // 记录时间设置失败历史
        await prisma.history.create({
          data: {
            action: 'update_time_from_client',
            result: 'failed',
            agentId: params.id,
            error: `数据库更新失败: ${error instanceof Error ? error.message : '未知错误'}`
          },
        });

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