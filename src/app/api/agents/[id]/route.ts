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
    } = body;

    // 验证必填字段
    if (!name || !description || !category || !capabilities) {
      throw new ApiError(400, '缺少必要参数');
    }

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
        // 如果提供了新的示例，则更新示例
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

    return createSuccessResponse({
      ...updatedAgent,
      capabilities: JSON.parse(updatedAgent.capabilities),
      creatorAddress: updatedAgent.creator.address,
    }, '更新成功');
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