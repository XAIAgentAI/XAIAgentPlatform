import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSuccessResponse, handleError } from '@/lib/error';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    const address = searchParams.get('address');

    if (!agentId || !address) {
      return NextResponse.json(
        { code: 400, message: '缺少必要参数', isCreator: false },
        { status: 400 }
      );
    }

    // 查询代理信息
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: {
        creator: {
          select: {
            address: true
          }
        }
      }
    });

    if (!agent) {
      return NextResponse.json(
        { code: 404, message: '找不到代理', isCreator: false },
        { status: 404 }
      );
    }

    // 检查用户地址是否匹配创建者地址（不区分大小写）
    const isCreator = agent.creator.address.toLowerCase() === address.toLowerCase();

    return createSuccessResponse({
      code: 200,
      message: 'Success',
      data: { isCreator }
    });
  } catch (error) {
    return handleError(error);
  }
} 