import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSuccessResponse, handleError } from '@/lib/error';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = 'xaiagent-jwt-secret-2024';

// 保存支付合约地址
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
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

    // 获取请求体
    const body = await request.json();
    const { paymentContractAddress } = body;

    if (!paymentContractAddress) {
      return NextResponse.json(
        { code: 400, message: '缺少支付合约地址' },
        { status: 400 }
      );
    }

    // 验证用户是否为该Agent的创建者
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
        { code: 404, message: '找不到Agent' },
        { status: 404 }
      );
    }

    // 检查请求者是否为创建者
    if (agent.creator.address.toLowerCase() !== decoded.address.toLowerCase()) {
      return NextResponse.json(
        { code: 403, message: '只有创建者可以更新支付合约地址' },
        { status: 403 }
      );
    }

    // 更新Agent记录，添加支付合约地址
    const updatedAgent = await prisma.agent.update({
      where: { id: agentId },
      data: {
        iaoContractAddress: paymentContractAddress
      }
    });

    // 记录历史
    await prisma.history.create({
      data: {
        action: 'update_payment_contract',
        result: 'success',
        agentId: agentId,
      },
    });

    return createSuccessResponse({
      code: 200,
      message: '支付合约地址已保存',
      data: {
        agentId: updatedAgent.id,
        iaoContractAddress: updatedAgent.iaoContractAddress
      },
    });
  } catch (error) {
    return handleError(error);
  }
} 