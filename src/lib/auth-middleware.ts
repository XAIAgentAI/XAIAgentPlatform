import { NextRequest } from 'next/server';
import { verify } from 'jsonwebtoken';
import { ApiError } from './error';
import { prisma } from './prisma';

const JWT_SECRET = 'xaiagent-jwt-secret-2024';

export async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, '未授权');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    throw new ApiError(401, '未授权');
  }
}

/**
 * 验证用户是否为指定 Agent 的创建者
 */
export async function verifyAgentCreator(request: NextRequest, agentId: string) {
  // 首先验证用户身份
  const decoded = await verifyAuth(request) as { address: string };

  // 查询 Agent 信息
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    include: {
      creator: {
        select: { address: true },
      },
    },
  });

  if (!agent) {
    throw new ApiError(404, 'Agent 不存在');
  }

  // 检查是否为创建者
  if (agent.creator.address.toLowerCase() !== decoded.address.toLowerCase()) {
    throw new ApiError(403, '只有 Agent 创建者才能执行此操作');
  }

  return {
    user: decoded,
    agent,
  };
}