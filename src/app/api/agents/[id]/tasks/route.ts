import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSuccessResponse, handleError } from '@/lib/error';



// 获取Agent所有任务
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id;

    // 获取Agent信息
    const agent = await prisma.agent.findUnique({
      where: { id: agentId }
    });

    if (!agent) {
      return NextResponse.json(
        { code: 404, message: '找不到Agent' },
        { status: 404 }
      );
    }

    // 获取所有任务
    const tasks = await prisma.task.findMany({
      where: { agentId },
      orderBy: { createdAt: 'desc' },
    });

    // 处理任务结果
    const formattedTasks = tasks.map((task: any) => {
      let resultData = null;
      if (task.result) {
        try {
          resultData = JSON.parse(task.result);
        } catch (error) {
          console.error(`解析任务${task.id}结果失败:`, error);
          resultData = { error: '结果格式错误' };
        }
      }

      return {
        id: task.id,
        type: task.type,
        status: task.status,
        createdAt: task.createdAt,
        startedAt: task.startedAt,
        completedAt: task.completedAt,
        agentId: task.agentId,
        result: resultData
      };
    });

    return createSuccessResponse({
      agentId,
      agentName: agent.name,
      tasks: formattedTasks
    }, '查询Agent任务列表成功');
  } catch (error) {
    console.error('查询Agent任务列表过程中发生错误:', error);
    return handleError(error);
  }
} 