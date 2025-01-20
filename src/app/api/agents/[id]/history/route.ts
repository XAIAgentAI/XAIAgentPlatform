import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSuccessResponse, handleError, ApiError } from '@/lib/error';
import { getUserId } from '@/lib/auth';

// 获取 Agent 使用历史
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserId();
    if (!userId) {
      throw new ApiError(401, '未授权');
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    // 检查 Agent 是否存在
    const agent = await prisma.agent.findUnique({
      where: { id: params.id },
      select: { creatorId: true },
    });

    if (!agent) {
      throw new ApiError(404, 'Agent不存在');
    }

    // 只有创建者可以查看历史记录
    if (agent.creatorId !== userId) {
      throw new ApiError(403, '无权限查看');
    }

    const total = await prisma.history.count({
      where: { agentId: params.id },
    });

    const history = await prisma.history.findMany({
      where: { agentId: params.id },
      orderBy: {
        timestamp: 'desc',
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return createSuccessResponse({
      history: history.map(item => ({
        id: item.id,
        action: item.action,
        result: item.result,
        timestamp: item.timestamp,
      })),
      total,
      page,
      pageSize,
    });
  } catch (error) {
    return handleError(error);
  }
}

// 记录 Agent 使用历史
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserId();
    if (!userId) {
      throw new ApiError(401, '未授权');
    }

    const { action, result } = await request.json();

    // 验证必填字段
    if (!action || !result) {
      throw new ApiError(400, '缺少必要参数');
    }

    // 检查 Agent 是否存在
    const agent = await prisma.agent.findUnique({
      where: { id: params.id },
    });

    if (!agent) {
      throw new ApiError(404, 'Agent不存在');
    }

    // 创建历史记录
    const history = await prisma.history.create({
      data: {
        action,
        result,
        agentId: params.id,
      },
    });

    // 更新 Agent 使用次数
    await prisma.agent.update({
      where: { id: params.id },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });

    return createSuccessResponse(history, '记录成功');
  } catch (error) {
    return handleError(error);
  }
} 