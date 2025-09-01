/**
 * 流动性添加API端点
 * POST /api/agents/[id]/add-liquidity
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAgentCreator } from '@/lib/auth-middleware';
import { addLiquidity } from '@/lib/server-wallet/liquidity';
import { createSuccessResponse, handleError } from '@/lib/error';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// 请求参数验证schema
const AddLiquidityRequestSchema = z.object({
  agentId: z.string().min(1, 'Agent ID is required'),
  liquidityAmount: z.string().min(1, 'Liquidity amount is required'),
  xaaAmount: z.string().min(1, 'XAA amount is required'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔄 收到流动性添加请求...');

    // 解析请求体
    const body = await request.json();
    const agentId = params.id;

    // 验证请求参数
    const validationResult = AddLiquidityRequestSchema.safeParse({
      agentId,
      ...body
    });

    if (!validationResult.success) {
      console.error('❌ 参数验证失败:', validationResult.error.errors);
      return NextResponse.json(
        {
          code: 400,
          message: '参数验证失败',
          errors: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { liquidityAmount, xaaAmount } = validationResult.data;

    // 验证用户身份和权限
    console.log('🔐 验证用户权限...');
    const { user, agent } = await verifyAgentCreator(request, agentId);
    console.log(`✅ 权限验证通过 - 用户: ${user.address}, Agent: ${agent.name}`);

    // 检查Agent状态
    if (!agent.tokenAddress) {
      return NextResponse.json(
        {
          code: 400,
          message: '代币尚未创建，无法添加流动性',
        },
        { status: 400 }
      );
    }

    // 检查是否已经添加过流动性
    // 暂时注释掉，等Prisma类型更新
    // if (agent.liquidityAdded) {
    //   return NextResponse.json(
    //     {
    //       code: 400,
    //       message: '流动性已经添加过了',
    //     },
    //     { status: 400 }
    //   );
    // }

    // 创建任务记录
    const task = await prisma.task.create({
      data: {
        type: 'ADD_LIQUIDITY',
        status: 'PENDING',
        agentId,
        createdBy: user.address,
      },
    });



    // 在后台执行流动性添加任务
    processLiquidityAdditionTask(
      task.id,
      agentId,
      agent.tokenAddress,
      liquidityAmount,
      xaaAmount,
      user.address
    ).catch(error => {
      console.error(`[后台任务失败] 流动性添加任务 ${task.id} 失败:`, error);
    });

    // 立即返回成功响应
    return createSuccessResponse({
      taskId: task.id,
    }, '流动性添加任务已提交，请稍后查询结果');

  } catch (error) {
    console.error('提交流动性添加任务过程中发生错误:', error);
    return handleError(error);
  }
}

// 后台处理流动性添加任务
async function processLiquidityAdditionTask(
  taskId: string,
  agentId: string,
  tokenAddress: string,
  liquidityAmount: string,
  xaaAmount: string,
  userAddress: string
) {
  try {
    console.log(`[流动性添加] 开始为Agent ${agentId} 添加流动性...`);
    console.log(`[流动性添加] 代币地址: ${tokenAddress}`);
    console.log(`[流动性添加] 流动性数量: ${liquidityAmount}`);
    console.log(`[流动性添加] XAA数量: ${xaaAmount}`);

    // 开始处理，更新任务状态
    await prisma.task.update({
      where: { id: taskId },
      data: { 
        status: 'PROCESSING',
        startedAt: new Date()
      }
    });



    // 执行流动性添加
    console.log('💰 开始执行流动性添加...');
    const result = await addLiquidity(
      tokenAddress as `0x${string}`,
      liquidityAmount,
      xaaAmount
    );

    if (result.status === 'confirmed') {
      // 更新Agent状态
      // 暂时注释掉，等Prisma类型更新
      // await prisma.agent.update({
      //   where: { id: agentId },
      //   data: { liquidityAdded: true }
      // });

      // 更新任务状态为完成
      await prisma.task.update({
        where: { id: taskId },
        data: { 
          status: 'COMPLETED',
          completedAt: new Date(),
          result: JSON.stringify({
            success: true,
            txHash: result.txHash,
            status: result.status,
            type: result.type
          })
        }
      });



      console.log(`✅ 流动性添加任务 ${taskId} 完成成功`);

    } else {
      // 更新任务状态为失败
      await prisma.task.update({
        where: { id: taskId },
        data: { 
          status: 'FAILED',
          completedAt: new Date(),
          result: JSON.stringify({
            success: false,
            error: result.error || '添加流动性失败',
            status: result.status,
            type: result.type
          })
        }
      });



      console.error(`❌ 流动性添加任务 ${taskId} 失败:`, result.error);
    }

  } catch (error) {
    console.error(`❌ 流动性添加任务 ${taskId} 处理过程中发生错误:`, error);

    // 更新任务状态为失败
    await prisma.task.update({
      where: { id: taskId },
      data: { 
        status: 'FAILED',
        completedAt: new Date(),
        result: JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          message: '流动性添加处理失败'
        })
      }
    });


  }
}
