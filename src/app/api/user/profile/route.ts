import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSuccessResponse, handleError, ApiError } from '@/lib/error';
import { getUserId } from '@/lib/auth';

// 获取用户信息
export async function GET() {
  try {
    const userId = getUserId();
    if (!userId) {
      throw new ApiError(401, '未授权');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            agents: true,
            reviews: true,
          },
        },
      },
    });

    if (!user) {
      throw new ApiError(404, '用户不存在');
    }

    return createSuccessResponse({
      id: user.id,
      address: user.address,
      nickname: user.nickname,
      avatar: user.avatar,
      preferences: user.preferences ? JSON.parse(user.preferences) : null,
      createdAt: user.createdAt,
      agentCount: user._count.agents,
      reviewCount: user._count.reviews,
    });
  } catch (error) {
    return handleError(error);
  }
}

// 更新用户信息
export async function PUT(request: Request) {
  try {
    const userId = getUserId();
    if (!userId) {
      throw new ApiError(401, '未授权');
    }

    const { nickname, avatar, preferences } = await request.json();

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        nickname,
        avatar,
        preferences: preferences ? JSON.stringify(preferences) : null,
      },
      include: {
        _count: {
          select: {
            agents: true,
            reviews: true,
          },
        },
      },
    });

    return createSuccessResponse({
      id: user.id,
      address: user.address,
      nickname: user.nickname,
      avatar: user.avatar,
      preferences: user.preferences ? JSON.parse(user.preferences) : null,
      createdAt: user.createdAt,
      agentCount: user._count.agents,
      reviewCount: user._count.reviews,
    }, '更新成功');
  } catch (error) {
    return handleError(error);
  }
} 