/**
 * Owner转移API端点
 * POST /api/agents/[id]/transfer-ownership
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAgentCreator } from '@/lib/auth-middleware';
import { transferTokenOwnership, transferMiningOwnership, batchTransferOwnership } from '@/lib/server-wallet/ownership';
import { createSuccessResponse, handleError } from '@/lib/error';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// 请求参数验证schema
const TransferOwnershipRequestSchema = z.object({
  agentId: z.string().min(1, 'Agent ID is required'),
  transferType: z.enum(['token', 'mining', 'both'], {
    errorMap: () => ({ message: 'Transfer type must be token, mining, or both' })
  }),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔄 收到Owner转移请求...');

    // 解析请求体
    const body = await request.json();
    const agentId = params.id;

    // 验证请求参数
    const validationResult = TransferOwnershipRequestSchema.safeParse({
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

    const { transferType } = validationResult.data;

    // 验证用户身份和权限
    console.log('🔐 验证用户权限...');
    const { user, agent } = await verifyAgentCreator(request, agentId);
    console.log(`✅ 权限验证通过 - 用户: ${user.address}, Agent: ${agent.name}`);

    // 检查Agent状态
    if (!agent.tokenAddress) {
      return NextResponse.json(
        {
          code: 400,
          message: '代币尚未创建，无法转移Owner',
        },
        { status: 400 }
      );
    }

    // 检查前置条件：必须先完成流动性添加和代币销毁
    if (!agent.liquidityAdded) {
      return NextResponse.json(
        {
          code: 400,
          message: '必须先添加流动性才能转移Owner',
        },
        { status: 400 }
      );
    }

    if (!agent.tokensBurned) {
      return NextResponse.json(
        {
          code: 400,
          message: '必须先销毁代币才能转移Owner',
        },
        { status: 400 }
      );
    }

    // 检查是否已经转移过
    if (transferType === 'token' && agent.ownerTransferred) {
      return NextResponse.json(
        {
          code: 400,
          message: '代币Owner已经转移过了',
        },
        { status: 400 }
      );
    }

    if (transferType === 'mining' && agent.miningOwnerTransferred) {
      return NextResponse.json(
        {
          code: 400,
          message: '挖矿合约Owner已经转移过了',
        },
        { status: 400 }
      );
    }

    if (transferType === 'both' && agent.ownerTransferred && agent.miningOwnerTransferred) {
      return NextResponse.json(
        {
          code: 400,
          message: '所有Owner都已经转移过了',
        },
        { status: 400 }
      );
    }

    // 创建任务记录
    const taskType = transferType === 'token' ? 'TRANSFER_TOKEN_OWNERSHIP' : 
                     transferType === 'mining' ? 'TRANSFER_MINING_OWNERSHIP' : 
                     'TRANSFER_OWNERSHIP';

    const task = await prisma.task.create({
      data: {
        type: taskType,
        status: 'PENDING',
        agentId,
        createdBy: user.address,
      },
    });

    // 记录任务提交历史
    await prisma.history.create({
      data: {
        action: 'transfer_ownership_submit',
        result: 'pending',
        agentId,
        taskId: task.id,
      },
    });

    // 在后台执行Owner转移任务
    processOwnershipTransferTask(
      task.id,
      agentId,
      agent.tokenAddress,
      transferType,
      user.address
    ).catch(error => {
      console.error(`[后台任务失败] Owner转移任务 ${task.id} 失败:`, error);
    });

    // 立即返回成功响应
    return createSuccessResponse({
      code: 200,
      message: 'Owner转移任务已提交，请稍后查询结果',
      data: {
        taskId: task.id,
        transferType,
      },
    });

  } catch (error) {
    console.error('提交Owner转移任务过程中发生错误:', error);
    return handleError(error);
  }
}

// 后台处理Owner转移任务
async function processOwnershipTransferTask(
  taskId: string,
  agentId: string,
  tokenAddress: string,
  transferType: 'token' | 'mining' | 'both',
  newOwnerAddress: string
) {
  try {
    console.log(`[Owner转移] 开始为Agent ${agentId} 转移Owner...`);
    console.log(`[Owner转移] 代币地址: ${tokenAddress}`);
    console.log(`[Owner转移] 转移类型: ${transferType}`);
    console.log(`[Owner转移] 新Owner: ${newOwnerAddress}`);

    // 开始处理，更新任务状态
    await prisma.task.update({
      where: { id: taskId },
      data: { 
        status: 'PROCESSING',
        startedAt: new Date()
      }
    });

    // 记录开始处理的历史
    await prisma.history.create({
      data: {
        action: 'transfer_ownership_start',
        result: 'processing',
        agentId,
        taskId,
      },
    });

    let result: any;
    let updateData: any = {};

    // 根据转移类型执行相应操作
    if (transferType === 'token') {
      console.log('🔄 执行代币Owner转移...');
      result = await transferTokenOwnership(
        tokenAddress as `0x${string}`,
        newOwnerAddress as `0x${string}`
      );
      if (result.success) {
        updateData.ownerTransferred = true;
      }
    } else if (transferType === 'mining') {
      console.log('🔄 执行挖矿合约Owner转移...');
      result = await transferMiningOwnership(
        newOwnerAddress as `0x${string}`
      );
      if (result.success) {
        updateData.miningOwnerTransferred = true;
      }
    } else if (transferType === 'both') {
      console.log('🔄 执行批量Owner转移...');
      const batchResult = await batchTransferOwnership(
        tokenAddress as `0x${string}`,
        newOwnerAddress as `0x${string}`
      );
      
      // 处理批量结果
      const tokenSuccess = batchResult.tokenResult.success;
      const miningSuccess = batchResult.miningResult.success;
      
      if (tokenSuccess && miningSuccess) {
        result = {
          success: true,
          message: '代币和挖矿合约Owner转移都成功',
          tokenHash: batchResult.tokenResult.hash,
          miningHash: batchResult.miningResult.hash
        };
        updateData = {
          ownerTransferred: true,
          miningOwnerTransferred: true
        };
      } else if (tokenSuccess || miningSuccess) {
        result = {
          success: false,
          message: '部分Owner转移成功',
          tokenResult: batchResult.tokenResult,
          miningResult: batchResult.miningResult
        };
        if (tokenSuccess) updateData.ownerTransferred = true;
        if (miningSuccess) updateData.miningOwnerTransferred = true;
      } else {
        result = {
          success: false,
          message: '所有Owner转移都失败',
          tokenError: batchResult.tokenResult.error,
          miningError: batchResult.miningResult.error
        };
      }
    }

    if (result.success) {
      // 更新Agent状态
      if (Object.keys(updateData).length > 0) {
        await prisma.agent.update({
          where: { id: agentId },
          data: updateData
        });
      }

      // 更新任务状态为完成
      await prisma.task.update({
        where: { id: taskId },
        data: { 
          status: 'COMPLETED',
          completedAt: new Date(),
          result: JSON.stringify(result)
        }
      });

      // 记录成功历史
      await prisma.history.create({
        data: {
          action: 'transfer_ownership_success',
          result: 'success',
          agentId,
          taskId,
        },
      });

      console.log(`✅ Owner转移任务 ${taskId} 完成成功`);

    } else {
      // 部分成功的情况也要更新Agent状态
      if (Object.keys(updateData).length > 0) {
        await prisma.agent.update({
          where: { id: agentId },
          data: updateData
        });
      }

      // 更新任务状态为失败或部分成功
      const status = Object.keys(updateData).length > 0 ? 'PARTIAL_SUCCESS' : 'FAILED';
      await prisma.task.update({
        where: { id: taskId },
        data: { 
          status,
          completedAt: new Date(),
          result: JSON.stringify(result)
        }
      });

      // 记录失败历史
      await prisma.history.create({
        data: {
          action: 'transfer_ownership_failed',
          result: status === 'PARTIAL_SUCCESS' ? 'partial_success' : 'failed',
          error: result.error || result.message,
          agentId,
          taskId,
        },
      });

      console.error(`❌ Owner转移任务 ${taskId} 失败:`, result.error || result.message);
    }

  } catch (error) {
    console.error(`❌ Owner转移任务 ${taskId} 处理过程中发生错误:`, error);

    // 更新任务状态为失败
    await prisma.task.update({
      where: { id: taskId },
      data: { 
        status: 'FAILED',
        completedAt: new Date(),
        result: JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          message: 'Owner转移处理失败'
        })
      }
    });

    // 记录错误历史
    await prisma.history.create({
      data: {
        action: 'transfer_ownership_error',
        result: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        agentId,
        taskId,
      },
    });
  }
}
