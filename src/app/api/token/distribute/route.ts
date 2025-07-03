/**
 * 代币分配API端点
 * POST /api/token/distribute
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAgentCreator } from '@/lib/auth-middleware';
import { distributeTokensWithOptions, retryFailedTransactions } from '@/lib/server-wallet';
import { createSuccessResponse, handleError } from '@/lib/error';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// 请求参数验证schema
const DistributeRequestSchema = z.object({
  agentId: z.string().min(1, 'Agent ID is required'),
  totalSupply: z.string().min(1, 'Total supply is required'),
  tokenAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid token address format'),
  // 新增选项
  includeBurn: z.boolean().optional().default(false),
  burnPercentage: z.number().min(0).max(100).optional().default(5),
  retryTaskId: z.string().optional(), // 重试指定任务
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    console.log('🚀 收到代币分配请求');
    console.log(`⏰ 请求时间: ${new Date().toISOString()}`);

    // 解析请求体
    const body = await request.json();
    console.log('📝 请求参数详情:');
    console.log(`  - Agent ID: ${body.agentId}`);
    console.log(`  - 总供应量: ${body.totalSupply}`);
    console.log(`  - 代币地址: ${body.tokenAddress}`);

    // 验证请求参数
    console.log('🔍 验证请求参数格式...');
    const validationResult = DistributeRequestSchema.safeParse(body);
    if (!validationResult.success) {
      console.log('❌ 参数验证失败:', validationResult.error.errors);
      return NextResponse.json(
        {
          code: 400,
          message: '请求参数无效',
          errors: validationResult.error.errors,
        },
        { status: 400 }
      );
    }
    console.log('✅ 参数验证通过');

    const { agentId, totalSupply, tokenAddress, includeBurn, burnPercentage, retryTaskId } = validationResult.data;

    // 验证用户身份和权限
    console.log('🔐 验证用户身份和权限...');
    const { user, agent } = await verifyAgentCreator(request, agentId);
    console.log(`✅ 权限验证通过:`);
    console.log(`  - 用户地址: ${user.address}`);
    console.log(`  - Agent名称: ${agent.name}`);
    console.log(`  - Agent符号: ${agent.symbol}`);
    console.log(`  - Agent代币地址: ${agent.tokenAddress}`);

    // 验证代币地址是否匹配
    console.log('🔍 验证代币地址匹配...');
    if (!agent.tokenAddress || agent.tokenAddress.toLowerCase() !== tokenAddress.toLowerCase()) {
      console.log(`❌ 代币地址不匹配:`);
      console.log(`  - 请求地址: ${tokenAddress}`);
      console.log(`  - Agent地址: ${agent.tokenAddress}`);
      return NextResponse.json(
        {
          code: 400,
          message: '代币地址与Agent配置不匹配',
        },
        { status: 400 }
      );
    }
    console.log('✅ 代币地址验证通过');

    // 执行代币分配
    // 创建分发任务记录
    console.log('📝 创建代币分发任务记录...');
    const task = await prisma.task.create({
      data: {
        type: 'DISTRIBUTE_TOKENS',
        status: 'PENDING',
        agentId,
        createdBy: user.address,
        result: JSON.stringify({
          metadata: {
            totalSupply,
            tokenAddress,
            includeBurn,
            burnPercentage,
            retryTaskId
          }
        })
      },
    });

    console.log(`✅ 任务创建成功，任务ID: ${task.id}`);



    // 在后台执行代币分发任务
    console.log('🚀 启动后台代币分发任务...');
    processTokenDistributionTask(task.id).catch(error => {
      console.error(`[后台任务失败] 代币分发任务 ${task.id} 失败:`, error);
    });

    // 立即返回成功响应
    return createSuccessResponse({
      code: 200,
      message: '已成功提交代币分发任务，请稍后查询结果',
      data: {
        taskId: task.id,
      },
    });

  } catch (error: any) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.error('❌ 代币分配API错误:', error);
    console.error(`⏱️ 失败耗时: ${duration}ms`);
    console.error(`📍 错误堆栈:`, error.stack);
    return handleError(error);
  }
}

/**
 * 后台处理代币分发任务
 */
async function processTokenDistributionTask(taskId: string) {
  console.log(`🔄 开始处理代币分发任务 ${taskId}`);

  try {
    // 获取任务信息
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { agent: true }
    });

    if (!task) {
      throw new Error(`任务 ${taskId} 不存在`);
    }

    // 解析任务参数
    let metadata: any = {};
    if (task.result) {
      try {
        const taskData = JSON.parse(task.result);
        metadata = taskData.metadata || {};
      } catch (error) {
        console.error('解析任务参数失败:', error);
      }
    }

    const {
      totalSupply,
      tokenAddress,
      includeBurn = false,
      burnPercentage = 5,
      retryTaskId
    } = metadata;

    const agentId = task.agentId;
    const userAddress = task.createdBy;

    // 更新任务状态为处理中
    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'PROCESSING',
        startedAt: new Date()
      }
    });

    console.log('� [DEBUG] �💰 开始执行代币分配流程...');
    console.log('🔍 [DEBUG] 📊 分配参数:');
    console.log(`🔍 [DEBUG]   - 任务ID: ${taskId}`);
    console.log(`🔍 [DEBUG]   - Agent ID: ${agentId}`);
    console.log(`🔍 [DEBUG]   - 总供应量: ${totalSupply}`);
    console.log(`🔍 [DEBUG]   - 代币地址: ${tokenAddress}`);
    console.log(`🔍 [DEBUG]   - 用户地址: ${userAddress}`);
    console.log(`🔍 [DEBUG]   - 包含销毁: ${includeBurn}`);
    if (includeBurn) {
      console.log(`🔍 [DEBUG]   - 销毁比例: ${burnPercentage}%`);
    }
    if (retryTaskId) {
      console.log(`🔍 [DEBUG]   - 重试任务: ${retryTaskId}`);
    }

    console.log('🔍 [DEBUG] 调用 distributeTokensWithOptions...');
    const result = await distributeTokensWithOptions(agentId, totalSupply, tokenAddress, userAddress, {
      includeBurn,
      burnPercentage,
      retryTaskId
    });
    console.log('🔍 [DEBUG] distributeTokensWithOptions 返回结果:', result);

    // 检查结果状态
    console.log('🔍 [DEBUG] 检查分发结果状态...');
    const hasFailedTransactions = result.data?.transactions?.some(tx => tx.status === 'failed') || false;
    const hasSuccessfulTransactions = result.data?.transactions?.some(tx => tx.status === 'confirmed') || false;
    console.log('🔍 [DEBUG] 结果状态分析:', {
      hasFailedTransactions,
      hasSuccessfulTransactions,
      totalTransactions: result.data?.transactions?.length || 0,
      transactions: result.data?.transactions?.map(tx => ({
        type: tx.type,
        status: tx.status,
        txHash: tx.txHash
      }))
    });

    let taskStatus: 'COMPLETED' | 'FAILED' | 'PARTIAL_FAILED';

    console.log('🔍 [DEBUG] 判断任务最终状态...');
    if (!result.success && !hasSuccessfulTransactions) {
      // 完全失败
      taskStatus = 'FAILED';
      console.log('🔍 [DEBUG] ❌ 代币分配完全失败:', result.error);
    } else if (hasFailedTransactions && hasSuccessfulTransactions) {
      // 部分失败
      taskStatus = 'PARTIAL_FAILED';
      console.log('🔍 [DEBUG] ⚠️ 代币分配部分失败 - 部分交易成功，部分交易失败');
    } else if (result.success && !hasFailedTransactions) {
      // 完全成功
      taskStatus = 'COMPLETED';
      console.log('🔍 [DEBUG] ✅ 代币分配完全成功');
    } else {
      // 默认处理
      taskStatus = result.success ? 'COMPLETED' : 'FAILED';
      console.log('🔍 [DEBUG] 默认状态处理:', { taskStatus, success: result.success });
    }

    console.log('🔍 [DEBUG] 最终任务状态:', taskStatus);

    // 更新任务状态，保留原来的 metadata
    console.log('🔍 [DEBUG] 更新任务状态到数据库:', taskStatus);

    // 获取原来的任务数据以保留 metadata
    const originalTaskData = JSON.parse(task.result || '{}');
    const originalMetadata = originalTaskData.metadata || {};

    const taskResult = {
      metadata: originalMetadata, // 保留原来的 metadata
      ...result.data,
      error: result.error,
      status: taskStatus
    };
    console.log('🔍 [DEBUG] 任务结果数据 (保留metadata):', taskResult);

    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: taskStatus,
        completedAt: new Date(),
        result: JSON.stringify(taskResult)
      }
    });
    console.log('🔍 [DEBUG] 任务状态更新完成');



    // 如果完全失败，直接返回
    if (taskStatus === 'FAILED') {
      return;
    }

    console.log('🔍 [DEBUG] ✅ 代币分配流程完成');
    console.log('� [DEBUG] �📊 分配结果摘要:');
    console.log(`🔍 [DEBUG]   - 任务ID: ${result.taskId || taskId}`);
    console.log(`🔍 [DEBUG]   - 交易数量: ${result.data?.transactions?.length || 0}`);
    console.log(`🔍 [DEBUG]   - 分配总量: ${result.data?.totalDistributed || '未知'}`);
    console.log(`🔍 [DEBUG]   - 最终状态: ${taskStatus}`);

  } catch (error: any) {
    console.error(`❌ 代币分发任务 ${taskId} 处理失败:`, error);

    try {


      // 更新任务状态为失败，保留原来的 metadata
      // 重新获取任务数据以获取原来的 metadata
      const currentTask = await prisma.task.findUnique({
        where: { id: taskId }
      });

      const originalTaskData = JSON.parse(currentTask?.result || '{}');
      const originalMetadata = originalTaskData.metadata || {};

      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          result: JSON.stringify({
            metadata: originalMetadata, // 保留原来的 metadata
            error: error.message || '未知错误'
          })
        }
      });


    } catch (dbError) {
      console.error('更新任务状态或记录历史失败:', dbError);
    }
  }
}

// 获取分配状态
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');

    if (!agentId) {
      return NextResponse.json(
        { code: 400, message: 'Agent ID is required' },
        { status: 400 }
      );
    }

    // 验证用户权限
    await verifyAgentCreator(request, agentId);

    // 查询分配任务记录（从 Task 表）
    const { prisma } = await import('@/lib/prisma');
    const tasks = await prisma.task.findMany({
      where: {
        agentId,
        type: 'DISTRIBUTE_TOKENS',
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return createSuccessResponse({
      code: 200,
      message: '查询成功',
      data: {
        distributions: tasks.map(task => {
          const taskData = task.result ? JSON.parse(task.result) : {};
          const metadata = taskData.metadata || taskData;
          return {
            id: task.id,
            status: task.status,
            totalSupply: metadata.totalSupply,
            tokenAddress: metadata.tokenAddress,
            createdAt: task.createdAt,
            completedAt: task.completedAt,
            transactions: taskData.transactions || [],
          };
        }),
      },
    });

  } catch (error: any) {
    console.error('❌ 查询分配状态错误:', error);
    return handleError(error);
  }
}

// 重试失败的交易
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, agentId } = body;

    if (!taskId || !agentId) {
      return NextResponse.json(
        { code: 400, message: 'Task ID and Agent ID are required' },
        { status: 400 }
      );
    }

    // 验证用户权限
    await verifyAgentCreator(request, agentId);

    console.log(`🔄 开始重试任务: ${taskId}`);
    const result = await retryFailedTransactions(taskId);

    if (!result.success) {
      return NextResponse.json(
        {
          code: 500,
          message: '重试失败',
          error: result.error,
        },
        { status: 500 }
      );
    }

    console.log('✅ 重试完成');

    return createSuccessResponse({
      code: 200,
      message: '重试成功',
      data: result.data,
    });

  } catch (error: any) {
    console.error('❌ 重试错误:', error);
    return handleError(error);
  }
}
