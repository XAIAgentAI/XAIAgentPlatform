/**
 * XAA销毁API端点
 * POST /api/agents/[id]/burn-xaa
 * 销毁IAO中XAA数量的5%，由服务端钱包执行
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAgentCreator } from '@/lib/auth-middleware';
import { createSuccessResponse, handleError } from '@/lib/error';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { burnXAAFromServerWallet } from '@/lib/server-wallet/burn-xaa';

// 请求参数验证schema
const BurnXAARequestSchema = z.object({
  agentId: z.string().min(1, 'Agent ID is required'),
  iaoContractAddress: z.string().min(1, 'IAO contract address is required'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔥 收到XAA销毁请求...');

    // 解析请求体
    const body = await request.json();
    const agentId = params.id;

    // 验证请求参数
    const validationResult = BurnXAARequestSchema.safeParse({
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

    const { iaoContractAddress } = validationResult.data;

    // 验证用户身份和权限
    console.log('🔐 验证用户权限...');
    const { user, agent } = await verifyAgentCreator(request, agentId);
    console.log(`✅ 权限验证通过 - 用户: ${user.address}, Agent: ${agent.name}`);

    // 检查Agent状态
    if (!agent.tokenAddress) {
      return NextResponse.json(
        {
          code: 400,
          message: '代币尚未创建，无法执行XAA销毁',
        },
        { status: 400 }
      );
    }

    if (!agent.iaoContractAddress) {
      return NextResponse.json(
        {
          code: 400,
          message: 'IAO合约地址未设置，无法执行XAA销毁',
        },
        { status: 400 }
      );
    }

    // 创建任务记录
    const task = await prisma.task.create({
      data: {
        type: 'BURN_XAA',
        status: 'PENDING',
        agentId,
        createdBy: user.address,
      },
    });

    console.log(`✅ 任务创建成功，任务ID: ${task.id}`);

    // 在后台执行XAA销毁任务
    processBurnXAATask(
      task.id,
      agentId,
      iaoContractAddress,
      user.address
    ).catch(error => {
      console.error(`[后台任务失败] XAA销毁任务 ${task.id} 失败:`, error);
    });

    // 立即返回成功响应
    return createSuccessResponse({
      code: 200,
      message: 'XAA销毁任务已提交，请稍后查询结果',
      data: {
        taskId: task.id,
      },
    });

  } catch (error) {
    console.error('提交XAA销毁任务过程中发生错误:', error);
    return handleError(error);
  }
}

// 后台处理XAA销毁任务
async function processBurnXAATask(
  taskId: string,
  agentId: string,
  iaoContractAddress: string,
  userAddress: string
) {
  try {
    console.log(`[XAA销毁] 开始为Agent ${agentId} 销毁XAA...`);
    console.log(`[XAA销毁] IAO合约地址: ${iaoContractAddress}`);

    // 开始处理，更新任务状态
    await prisma.task.update({
      where: { id: taskId },
      data: { 
        status: 'PROCESSING',
        startedAt: new Date()
      }
    });

    console.log('🔥 开始执行XAA销毁...');

    // 执行XAA销毁
    const result = await burnXAAFromServerWallet(iaoContractAddress as `0x${string}`);

    if (result.success) {
      // 更新Agent状态 - 标记XAA已销毁
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
            burnAmount: result.burnAmount,
            iaoXAAAmount: result.iaoXAAAmount,
            transactions: [{
              type: 'burn_xaa',
              amount: result.burnAmount,
              txHash: result.txHash,
              status: 'confirmed',
              toAddress: '0x0000000000000000000000000000000000000000', // 销毁地址
              description: `销毁IAO中${result.burnAmount}个XAA (总量的5%)`
            }]
          })
        }
      });

      console.log(`✅ XAA销毁任务 ${taskId} 完成成功`);
      console.log(`🔥 销毁数量: ${result.burnAmount} XAA`);
      console.log(`📊 IAO总XAA: ${result.iaoXAAAmount} XAA`);

    } else {
      // 更新任务状态为失败
      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          result: JSON.stringify({
            success: false,
            error: result.error || 'XAA销毁失败',
            transactions: [{
              type: 'burn_xaa',
              amount: '0',
              txHash: '',
              status: 'failed',
              toAddress: '0x0000000000000000000000000000000000000000',
              error: result.error || 'XAA销毁失败'
            }]
          })
        }
      });

      console.error(`❌ XAA销毁任务 ${taskId} 失败:`, result.error);
    }

  } catch (error) {
    console.error(`❌ XAA销毁任务 ${taskId} 处理过程中发生错误:`, error);

    // 更新任务状态为失败
    await prisma.task.update({
      where: { id: taskId },
      data: { 
        status: 'FAILED',
        completedAt: new Date(),
        result: JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          message: 'XAA销毁处理失败'
        })
      }
    });
  }
}
