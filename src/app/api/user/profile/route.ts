import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSuccessResponse, handleError, ApiError } from '@/lib/error';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = 'xaiagent-jwt-secret-2024';

// 获取用户信息
export async function GET(request: Request) {
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