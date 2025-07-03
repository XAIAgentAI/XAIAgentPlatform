import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSuccessResponse, handleError } from '@/lib/error';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = 'xaiagent-jwt-secret-2024';

// 部署支付合约
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
    const {
      address_free_request_count,
      free_request_count,
      min_usd_balance_for_using_free_request,
      vip_monthly_quotas,
      vip_price_fixed_count,
      vip_price_monthly
    } = body;

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
        { code: 403, message: '只有创建者可以部署支付合约' },
        { status: 403 }
      );
    }

    // 检查Token是否已创建
    if (!agent.tokenAddress) {
      return NextResponse.json(
        { code: 400, message: 'Token尚未创建，请先创建Token' },
        { status: 400 }
      );
    }

    // 检查支付合约是否已部署
    if (agent.paymentContractAddress) {
      return NextResponse.json(
        { code: 400, message: '支付合约已经部署' },
        { status: 400 }
      );
    }

    // 创建任务记录
    const task = await prisma.task.create({
      data: {
        type: 'DEPLOY_PAYMENT_CONTRACT',
        status: 'PENDING',
        agentId,
        createdBy: decoded.address,
      },
    });



    // 在后台执行支付合约部署任务
    processPaymentContractDeployment(
      task.id,
      agentId,
      agent,
      {
        address_free_request_count,
        free_request_count,
        min_usd_balance_for_using_free_request,
        vip_monthly_quotas,
        vip_price_fixed_count,
        vip_price_monthly
      }
    ).catch(error => {
      console.error(`[后台任务失败] 支付合约部署任务 ${task.id} 失败:`, error);
    });

    // 立即返回成功响应
    return createSuccessResponse({
      code: 200,
      message: '已成功提交支付合约部署任务，请稍后查询结果',
      data: {
        taskId: task.id,
      },
    });
  } catch (error) {
    console.error('提交支付合约部署任务过程中发生错误:', error);
    return handleError(error);
  }
}

// 后台处理支付合约部署任务
async function processPaymentContractDeployment(
  taskId: string,
  agentId: string,
  agent: any,
  params: {
    address_free_request_count?: number,
    free_request_count?: number,
    min_usd_balance_for_using_free_request?: number,
    vip_monthly_quotas?: number,
    vip_price_fixed_count?: number,
    vip_price_monthly?: number
  }
) {
  try {
    console.log(`[支付合约部署] 开始为Agent ${agentId} 部署支付合约...`);
    console.log(`[支付合约部署] 创建者地址: ${agent.creator.address}`);
    console.log(`[支付合约部署] Token地址: ${agent.tokenAddress}`);

    // 更新任务状态为处理中
    await prisma.task.update({
      where: { id: taskId },
      data: { 
        status: 'PROCESSING',
        startedAt: new Date()
      }
    });

    // 解构参数，提供默认值
    const {
      address_free_request_count = 10,
      free_request_count = 100,
      min_usd_balance_for_using_free_request = 100000,
      vip_monthly_quotas = 10,
      vip_price_fixed_count = 100000,
      vip_price_monthly = 100000
    } = params;

    // 调用外部API部署支付合约
    const deployResponse = await fetch("http://3.0.25.131:8070/deploy/payment", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "authorization": "Basic YWRtaW46MTIz"
      },
      body: JSON.stringify({
        address_free_request_count,
        free_request_count,
        min_usd_balance_for_using_free_request,
        owner: agent.creator.address,
        payment_token: agent.tokenAddress,
        vip_monthly_quotas,
        vip_price_fixed_count,
        vip_price_monthly
      })
    });

    const deployResult = await deployResponse.json();
    console.log(`[支付合约部署] 部署结果:`, deployResult);

    if (!deployResponse.ok || deployResult.code !== 200 || !deployResult.data?.proxy_address) {
      console.error(`[支付合约部署] 失败原因: ${deployResult.message || '未知错误'}`);
      


      // 更新任务状态为失败
      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: 'FAILED',
          result: JSON.stringify({
            error: `支付合约部署失败: ${deployResult.message || '未知错误'}`
          }),
          completedAt: new Date(),
        },
      });

      return;
    }

    console.log(`[支付合约部署] 部署成功，合约地址: ${deployResult.data.proxy_address}`);

    // 更新Agent记录，保存支付合约地址
    const updatedAgent = await prisma.agent.update({
      where: { id: agentId },
      data: {
        paymentContractAddress: deployResult.data.proxy_address
      }
    });



    // 更新任务状态为成功
    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'COMPLETED',
        result: JSON.stringify({
          paymentContractAddress: deployResult.data.proxy_address,
        }),
        completedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('后台处理支付合约部署任务时发生错误:', error);
    
    // 更新任务状态为失败
    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'FAILED',
        result: JSON.stringify({
          error: `处理过程中发生错误: ${error instanceof Error ? error.message : String(error)}`
        }),
        completedAt: new Date(),
      },
    });
  }
}
