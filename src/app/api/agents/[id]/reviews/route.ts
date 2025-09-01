import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSuccessResponse, handleError, ApiError } from '@/lib/error';
import { getUserId } from '@/lib/auth';

// 获取 Agent 评价列表
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    const total = await prisma.review.count({
      where: { agentId: params.id },
    });

    const reviews = await prisma.review.findMany({
      where: { agentId: params.id },
      include: {
        user: {
          select: {
            address: true,
            nickname: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return createSuccessResponse({
      reviews: reviews.map(review => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        user: {
          address: review.user.address,
          nickname: review.user.nickname,
          avatar: review.user.avatar,
        },
      })),
      total,
      page,
      pageSize,
    });
  } catch (error) {
    return handleError(error);
  }
}

// 提交 Agent 评价
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserId();
    if (!userId) {
      throw new ApiError(401, '未授权');
    }

    const { rating, comment } = await request.json();

    // 验证必填字段
    if (typeof rating !== 'number' || rating < 0 || rating > 5) {
      throw new ApiError(400, '评分必须在 0-5 之间');
    }

    if (!comment) {
      throw new ApiError(400, '评价内容不能为空');
    }

    // 检查 Agent 是否存在
    const agent = await prisma.agent.findUnique({
      where: { id: params.id },
    });

    if (!agent) {
      throw new ApiError(404, 'Agent不存在');
    }

    // 检查用户是否已经评价过
    const existingReview = await prisma.review.findFirst({
      where: {
        agentId: params.id,
        userId,
      },
    });

    if (existingReview) {
      throw new ApiError(400, '您已经评价过这个 Agent');
    }

    // 创建评价
    const review = await prisma.review.create({
      data: {
        rating,
        comment,
        userId,
        agentId: params.id,
      },
      include: {
        user: {
          select: {
            address: true,
            nickname: true,
            avatar: true,
          },
        },
      },
    });

    // 更新 Agent 的平均评分
    const reviews = await prisma.review.findMany({
      where: { agentId: params.id },
      select: { rating: true },
    });

    const averageRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await prisma.agent.update({
      where: { id: params.id },
      data: { rating: averageRating },
    });

    return createSuccessResponse({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      user: {
        address: review.user.address,
        nickname: review.user.nickname,
        avatar: review.user.avatar,
      },
    }, '评价成功');
  } catch (error) {
    return handleError(error);
  }
} 