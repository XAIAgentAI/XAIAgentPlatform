import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSuccessResponse, handleError } from '@/lib/error';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = 'xaiagent-jwt-secret-2024';

interface DeploymentLog {
  id: string;
  startTime: bigint;
  endTime: bigint;
  status: string;
  completedAt: Date;
  deploymentDetails: any;
}

/**
 * 获取IAO部署历史记录API
 * 
 * 此API用于获取指定Agent的所有IAO部署历史记录
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 获取URL参数中的agentId
    const agentId = params.id;
    
    // 验证 JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { code: 401, message: '未授权访问' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = verify(token, JWT_SECRET) as { address: string };
    } catch (error) {
      return NextResponse.json(
        { code: 401, message: '无效的 token' },
        { status: 401 }
      );
    }

    // 获取Agent信息以验证存在性
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: {
        id: true,
        creator: {
          select: {
            address: true
          }
        }
      }
    });

    if (!agent) {
      return NextResponse.json(
        { code: 404, message: '找不到Agent' },
        { status: 404 }
      );
    }

    // 获取IAO部署历史记录 - 使用原始SQL查询
    const deploymentLogs = await prisma.$queryRaw<DeploymentLog[]>`
      SELECT id, "startTime", "endTime", status, "completedAt", "deploymentDetails"
      FROM "IaoDeploymentLog"
      WHERE "agentId" = ${agentId}
      ORDER BY "completedAt" DESC
    `;

    // 转换记录格式，添加用户质押信息
    const formattedLogs = await Promise.all(deploymentLogs.map(async (log) => {
      // 这里可以添加获取用户在特定IAO中的质押信息的逻辑
      // 例如，从合约或其他数据源获取
      
      // 为了演示，我们使用模拟数据
      const stakedAmount = log.deploymentDetails && typeof log.deploymentDetails === 'object' 
        ? log.deploymentDetails.stakedAmount || '0'
        : '0';
        
      const hasClaimed = log.deploymentDetails && typeof log.deploymentDetails === 'object'
        ? log.deploymentDetails.hasClaimed || false
        : false;

      return {
        id: log.id,
        startTime: Number(log.startTime),
        endTime: Number(log.endTime),
        status: log.status,
        completedAt: log.completedAt.toISOString(),
        stakedAmount,
        hasClaimed
      };
    }));

    return createSuccessResponse(formattedLogs);
  } catch (error) {
    return handleError(error);
  }
} 