import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSuccessResponse, handleError } from '@/lib/error';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = 'xaiagent-jwt-secret-2024';

// 获取任务状态
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id;

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

    // 查询任务信息
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            creator: {
              select: {
                address: true
              }
            }
          }
        }
      }
    });

    if (!task) {
      return NextResponse.json(
        { code: 404, message: '找不到任务' },
        { status: 404 }
      );
    }

    // 验证请求者是否为任务所属Agent的创建者
    if (task.agent.creator.address.toLowerCase() !== decoded.address.toLowerCase()) {
      return NextResponse.json(
        { code: 403, message: '只有Agent创建者可以查询此任务' },
        { status: 403 }
      );
    }

    // 解析任务结果
    let resultData = null;
    if (task.result) {
      try {
        resultData = JSON.parse(task.result);
      } catch (error) {
        console.error('解析任务结果失败:', error);
        resultData = { error: '结果格式错误' };
      }
    }

    return createSuccessResponse({
      id: task.id,
      type: task.type,
      status: task.status,
      createdAt: task.createdAt,
      startedAt: task.startedAt,
      completedAt: task.completedAt,
      agentId: task.agentId,
      agentName: task.agent.name,
      result: resultData,
      // History table has been removed - task details are now in the result field
    }, '查询任务成功');
  } catch (error) {
    console.error('查询任务过程中发生错误:', error);
    return handleError(error);
  }
} 