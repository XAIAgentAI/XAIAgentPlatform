/**
 * 代币分配API端点
 * POST /api/token/distribute
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAgentCreator } from '@/lib/auth-middleware';
import { distributeTokensWithOptions, retryFailedTransactions } from '@/lib/server-wallet';
import { createSuccessResponse, handleError } from '@/lib/error';
import { z } from 'zod';

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
    console.log('💰 开始执行代币分配流程...');
    console.log(`📊 分配参数:`);
    console.log(`  - Agent ID: ${agentId}`);
    console.log(`  - 总供应量: ${totalSupply}`);
    console.log(`  - 代币地址: ${tokenAddress}`);
    console.log(`  - 用户地址: ${user.address}`);
    console.log(`  - 包含销毁: ${includeBurn}`);
    if (includeBurn) {
      console.log(`  - 销毁比例: ${burnPercentage}%`);
    }
    if (retryTaskId) {
      console.log(`  - 重试任务: ${retryTaskId}`);
    }

    const result = await distributeTokensWithOptions(agentId, totalSupply, tokenAddress, user.address, {
      includeBurn,
      burnPercentage,
      retryTaskId
    });

    if (!result.success) {
      console.log('❌ 代币分配执行失败:', result.error);
      return NextResponse.json(
        {
          code: 500,
          message: '代币分配失败',
          error: result.error,
        },
        { status: 500 }
      );
    }

    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log('✅ 代币分配成功完成');
    console.log(`⏱️ 总耗时: ${duration}ms`);
    console.log(`📊 分配结果摘要:`);
    console.log(`  - 任务ID: ${result.taskId}`);
    console.log(`  - 交易数量: ${result.data?.transactions?.length || 0}`);
    console.log(`  - 分配总量: ${result.data?.totalDistributed || '未知'}`);

    // 返回成功响应
    return createSuccessResponse({
      code: 200,
      message: '代币分配成功',
      data: result.data,
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

    // 查询分配任务记录
    const { prisma } = await import('@/lib/prisma');
    const tasks = await prisma.history.findMany({
      where: {
        agentId,
        action: 'token_distribution_start',
      },
      orderBy: { timestamp: 'desc' },
      take: 10,
    });

    return createSuccessResponse({
      code: 200,
      message: '查询成功',
      data: {
        distributions: tasks.map(task => {
          const taskData = task.error ? JSON.parse(task.error) : {};
          return {
            id: task.id,
            status: taskData.status || task.result,
            totalSupply: taskData.totalSupply,
            tokenAddress: taskData.tokenAddress,
            createdAt: task.timestamp,
            completedAt: taskData.completedAt,
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
