/**
 * 代币流动性添加API端点
 * POST /api/token/distribute-liquidity
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAgentCreator } from '@/lib/auth-middleware';
import { createSuccessResponse, handleError } from '@/lib/error';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { distributeLiquidityForAgent } from '@/lib/token-distribution/liquidity-distribution';

// 请求参数验证schema
const DistributeLiquidityRequestSchema = z.object({
  agentId: z.string().min(1, 'Agent ID is required'),
  totalSupply: z.string().min(1, 'Total supply is required'),
  tokenAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid token address format'),
  iaoContractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid IAO contract address format').optional(),
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    console.log('🚀 收到添加流动性请求');
    console.log(`⏰ 请求时间: ${new Date().toISOString()}`);

    // 解析请求体
    const body = await request.json();
    console.log('📝 请求参数详情:');
    console.log(`  - Agent ID: ${body.agentId}`);
    console.log(`  - 总供应量: ${body.totalSupply}`);
    console.log(`  - 代币地址: ${body.tokenAddress}`);
    console.log(`  - IAO合约地址: ${body.iaoContractAddress || '未提供'}`);

    // 验证请求参数
    console.log('🔍 验证请求参数格式...');
    const validationResult = DistributeLiquidityRequestSchema.safeParse(body);
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

    const { agentId, totalSupply, tokenAddress, iaoContractAddress } = validationResult.data;

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

    // 检查是否已经添加过流动性
    if (agent.liquidityAdded) {
      console.log('❌ 该Agent已经添加过流动性');
      return NextResponse.json(
        {
          code: 400,
          message: '该Agent已经添加过流动性',
        },
        { status: 400 }
      );
    }

    // 创建流动性添加任务记录
    console.log('📝 创建流动性添加任务记录...');
    const task = await prisma.task.create({
      data: {
        type: 'ADD_LIQUIDITY',
        status: 'PENDING',
        agentId,
        createdBy: user.address,
        result: JSON.stringify({
          metadata: {
            totalSupply,
            tokenAddress,
            iaoContractAddress
          }
        })
      },
    });

    console.log(`✅ 任务创建成功，任务ID: ${task.id}`);

    // 在后台执行流动性添加任务
    console.log('🚀 启动后台流动性添加任务...');
    processAddLiquidityTask(task.id).catch(error => {
      console.error(`[后台任务失败] 流动性添加任务 ${task.id} 失败:`, error);
    });

    // 立即返回成功响应
    return createSuccessResponse({
      taskId: task.id,
    }, '已成功提交流动性添加任务，请稍后查询结果');

  } catch (error: any) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.error('❌ 流动性添加API错误:', error);
    console.error(`⏱️ 失败耗时: ${duration}ms`);
    console.error(`📍 错误堆栈:`, error.stack);
    return handleError(error);
  }
}

/**
 * 后台处理流动性添加任务
 */
async function processAddLiquidityTask(taskId: string) {
  console.log(`🔄 开始处理流动性添加任务 ${taskId}`);

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
      iaoContractAddress
    } = metadata;

    const agentId = task.agentId;

    // 更新任务状态为处理中
    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'PROCESSING',
        startedAt: new Date()
      }
    });

    console.log('💧 开始执行流动性添加流程...');
    const result = await distributeLiquidityForAgent(
      agentId,
      tokenAddress,
      totalSupply,
      iaoContractAddress
    );

    // 检查结果
    let taskStatus: 'COMPLETED' | 'FAILED';
    if (result.success) {
      taskStatus = 'COMPLETED';
    } else {
      taskStatus = 'FAILED';
    }

    console.log('📊 流动性添加任务完成，状态:', taskStatus);

    // 更新任务状态
    const originalTaskData = JSON.parse(task.result || '{}');
    const originalMetadata = originalTaskData.metadata || {};

    const taskResult = {
      metadata: originalMetadata,
      ...result,
      status: taskStatus
    };

    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: taskStatus,
        completedAt: new Date(),
        result: JSON.stringify(taskResult)
      }
    });

    // 如果任务完成，更新Agent的liquidityAdded状态
    if (taskStatus === 'COMPLETED' && result.poolAddress) {
      await prisma.agent.update({
        where: { id: agentId },
        data: {
          liquidityAdded: true,
          poolAddress: result.poolAddress
        }
      });
    }

    console.log('🔍 [DEBUG] ✅ 流动性添加流程完成');
    console.log('🔍 [DEBUG] 📊 添加结果摘要:');
    console.log(`🔍 [DEBUG]   - 任务ID: ${taskId}`);
    console.log(`🔍 [DEBUG]   - 池子地址: ${result.poolAddress || '未知'}`);
    console.log(`🔍 [DEBUG]   - 交易哈希: ${result.txHash || '未知'}`);
    console.log(`🔍 [DEBUG]   - 代币数量: ${result.tokenAmount || '未知'}`);
    console.log(`🔍 [DEBUG]   - XAA数量: ${result.xaaAmount || '未知'}`);
    console.log(`🔍 [DEBUG]   - 最终状态: ${taskStatus}`);

  } catch (error: any) {
    console.error(`❌ 流动性添加任务 ${taskId} 处理失败:`, error);

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
      console.error('更新任务状态失败:', dbError);
    }
  }
}

// 获取流动性添加状态
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

    // 查询流动性添加任务记录
    const { prisma } = await import('@/lib/prisma');
    const tasks = await prisma.task.findMany({
      where: {
        agentId,
        type: 'ADD_LIQUIDITY',
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // 获取Agent信息
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: {
        liquidityAdded: true,
        poolAddress: true
      }
    });

    return createSuccessResponse({
      liquidityAdded: agent?.liquidityAdded || false,
      poolAddress: agent?.poolAddress || null,
      tasks: tasks.map(task => {
        const taskData = task.result ? JSON.parse(task.result) : {};
        const metadata = taskData.metadata || {};
        return {
          id: task.id,
          status: task.status,
          totalSupply: metadata.totalSupply,
          tokenAddress: metadata.tokenAddress,
          iaoContractAddress: metadata.iaoContractAddress,
          createdAt: task.createdAt,
          completedAt: task.completedAt,
          poolAddress: taskData.poolAddress,
          txHash: taskData.txHash,
          tokenAmount: taskData.tokenAmount,
          xaaAmount: taskData.xaaAmount,
          error: taskData.error
        };
      }),
    }, '查询成功');

  } catch (error: any) {
    console.error('❌ 查询流动性添加状态错误:', error);
    return handleError(error);
  }
} 