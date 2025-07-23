/**
 * 代币销毁API端点
 * POST /api/agents/[id]/burn-tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAgentCreator } from '@/lib/auth-middleware';
import { burnTokens } from '@/lib/server-wallet/burn';
import { createSuccessResponse, handleError } from '@/lib/error';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// 请求参数验证schema
const BurnTokensRequestSchema = z.object({
  agentId: z.string().min(1, 'Agent ID is required'),
  burnAmount: z.string().min(1, 'Burn amount is required'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔥 收到代币销毁请求...');

    // 解析请求体
    const body = await request.json();
    const agentId = params.id;

    // 验证请求参数
    const validationResult = BurnTokensRequestSchema.safeParse({
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

    const { burnAmount } = validationResult.data;

    // 验证用户身份和权限
    console.log('🔐 验证用户权限...');
    const { user, agent } = await verifyAgentCreator(request, agentId);
    console.log(`✅ 权限验证通过 - 用户: ${user.address}, Agent: ${agent.name}`);

    // 检查Agent状态
    if (!agent.tokenAddress) {
      return NextResponse.json(
        {
          code: 400,
          message: '代币尚未创建，无法执行销毁',
        },
        { status: 400 }
      );
    }

    // 检查是否已经添加流动性（必须先添加流动性再销毁）
    if (!agent.liquidityAdded) {
      return NextResponse.json(
        {
          code: 400,
          message: '必须先添加流动性才能销毁代币',
        },
        { status: 400 }
      );
    }

    // 检查是否已经销毁过代币
    if (agent.tokensBurned) {
      return NextResponse.json(
        {
          code: 400,
          message: '代币已经销毁过了',
        },
        { status: 400 }
      );
    }

    // 创建任务记录
    const task = await prisma.task.create({
      data: {
        type: 'BURN_TOKENS',
        status: 'PENDING',
        agentId,
        createdBy: user.address,
      },
    });



    // 在后台执行代币销毁任务
    processBurnTokensTask(
      task.id,
      agentId,
      agent.tokenAddress,
      burnAmount,
      user.address
    ).catch(error => {
      console.error(`[后台任务失败] 代币销毁任务 ${task.id} 失败:`, error);
    });

    // 立即返回成功响应
    return createSuccessResponse({
      taskId: task.id,
    }, '代币销毁任务已提交，请稍后查询结果');

  } catch (error) {
    console.error('提交代币销毁任务过程中发生错误:', error);
    return handleError(error);
  }
}

// 后台处理代币销毁任务
async function processBurnTokensTask(
  taskId: string,
  agentId: string,
  tokenAddress: string,
  burnAmount: string,
  userAddress: string
) {
  try {
    console.log(`[代币销毁] 开始为Agent ${agentId} 销毁代币...`);
    console.log(`[代币销毁] 代币地址: ${tokenAddress}`);
    console.log(`[代币销毁] 销毁数量: ${burnAmount}`);

    // 开始处理，更新任务状态
    await prisma.task.update({
      where: { id: taskId },
      data: { 
        status: 'PROCESSING',
        startedAt: new Date()
      }
    });



    // 执行代币销毁
    console.log('🔥 开始执行代币销毁...');
    const result = await burnTokens(
      tokenAddress as `0x${string}`,
      burnAmount
    );

    if (result.status === 'confirmed') {
      // 更新Agent状态
      await prisma.agent.update({
        where: { id: agentId },
        data: { tokensBurned: true }
      });

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
            type: result.type,
            transactions: [{
              type: 'burn',
              amount: burnAmount,
              txHash: result.txHash,
              status: 'confirmed',
              toAddress: result.toAddress
            }]
          })
        }
      });



      console.log(`✅ 代币销毁任务 ${taskId} 完成成功`);

    } else {
      // 更新任务状态为失败
      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          result: JSON.stringify({
            success: false,
            error: result.error || '代币销毁失败',
            status: result.status,
            type: result.type,
            transactions: [{
              type: 'burn',
              amount: burnAmount,
              txHash: result.txHash || '',
              status: 'failed',
              toAddress: result.toAddress,
              error: result.error || '代币销毁失败'
            }]
          })
        }
      });



      console.error(`❌ 代币销毁任务 ${taskId} 失败:`, result.error);
    }

  } catch (error) {
    console.error(`❌ 代币销毁任务 ${taskId} 处理过程中发生错误:`, error);

    // 更新任务状态为失败
    await prisma.task.update({
      where: { id: taskId },
      data: { 
        status: 'FAILED',
        completedAt: new Date(),
        result: JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          message: '代币销毁处理失败'
        })
      }
    });


  }
}
