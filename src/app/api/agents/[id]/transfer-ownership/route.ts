/**
 * 代币所有权转移API端点
 * POST /api/agents/[id]/transfer-ownership
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAgentCreator } from '@/lib/auth-middleware';
import { getServerWalletClients } from '@/lib/server-wallet';
import { createSuccessResponse, handleError } from '@/lib/error';
import { prisma } from '@/lib/prisma';
import { MAINNET_USERAGENT_IAO_CONTRACT_ABI } from '@/config/contracts';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔄 收到代币所有权转移请求...');

    const agentId = params.id;

    // 验证用户身份和权限
    console.log('🔐 验证用户权限...');
    const { user, agent } = await verifyAgentCreator(request, agentId);
    console.log(`✅ 权限验证通过 - 用户: ${user.address}, Agent: ${agent.name}`);

    // 检查Agent状态
    if (!agent.tokenAddress) {
      return NextResponse.json(
        {
          code: 400,
          message: '代币尚未创建，无法转移所有权',
        },
        { status: 400 }
      );
    }

    // 检查前置条件：必须先完成流动性添加和代币销毁
    if (!agent.liquidityAdded) {
      return NextResponse.json(
        {
          code: 400,
          message: '必须先添加流动性才能转移所有权',
        },
        { status: 400 }
      );
    }

    if (!agent.tokensBurned) {
      return NextResponse.json(
        {
          code: 400,
          message: '必须先销毁代币才能转移所有权',
        },
        { status: 400 }
      );
    }

    // 检查是否已经转移过
    if (agent.ownerTransferred) {
      return NextResponse.json(
        {
          code: 400,
          message: '代币所有权已经转移过了',
        },
        { status: 400 }
      );
    }

    // 创建任务记录
    const task = await prisma.task.create({
      data: {
        type: 'TRANSFER_TOKEN_OWNERSHIP',
        status: 'PENDING',
        agentId,
        createdBy: user.address,
      },
    });

    // 在后台执行代币所有权转移任务
    processTokenOwnershipTransfer(
      task.id,
      agentId,
      agent.tokenAddress,
      user.address
    ).catch(error => {
      console.error(`[后台任务失败] 代币所有权转移任务 ${task.id} 失败:`, error);
    });

    // 立即返回成功响应
    return createSuccessResponse({
      taskId: task.id,
    }, '代币所有权转移任务已提交，请稍后查询结果');

  } catch (error) {
    console.error('提交代币所有权转移任务过程中发生错误:', error);
    return handleError(error);
  }
}

// 后台处理代币所有权转移任务
async function processTokenOwnershipTransfer(
  taskId: string,
  agentId: string,
  tokenAddress: string,
  newOwnerAddress: string
) {
  try {
    console.log(`[代币所有权转移] 开始为Agent ${agentId} 转移代币所有权...`);
    console.log(`[代币所有权转移] 代币地址: ${tokenAddress}`);
    console.log(`[代币所有权转移] 新Owner: ${newOwnerAddress}`);

    // 开始处理，更新任务状态
    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'PROCESSING',
        startedAt: new Date()
      }
    });

    // 执行代币所有权转移
    console.log('🔄 执行代币所有权转移...');

    // 获取服务端钱包客户端
    const { walletClient, publicClient, serverAccount } = await getServerWalletClients();

    // 验证新owner地址
    if (!newOwnerAddress || newOwnerAddress === '0x0000000000000000000000000000000000000000') {
      throw new Error('Invalid new owner address');
    }

    console.log(`📝 执行代币所有权转移 - 从 ${serverAccount.address} 转移到 ${newOwnerAddress}`);

    // 执行owner转移
    const hash = await walletClient.writeContract({
      address: tokenAddress as `0x${string}`,
      abi: MAINNET_USERAGENT_IAO_CONTRACT_ABI,
      functionName: 'transferOwnership',
      args: [newOwnerAddress as `0x${string}`],
    });

    console.log(`📝 所有权转移交易已提交 - Hash: ${hash}`);

    // 等待交易确认
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === 'success') {
      console.log(`✅ 代币所有权转移成功 - 新Owner: ${newOwnerAddress}`);

      // 更新Agent状态
      await prisma.agent.update({
        where: { id: agentId },
        data: { ownerTransferred: true }
      });

      // 更新任务状态为完成
      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          result: JSON.stringify({
            txHash: hash,
            status: 'confirmed',
            toAddress: newOwnerAddress
          })
        }
      });
      console.log(`✅ 代币所有权转移任务 ${taskId} 完成成功`);

    } else {
      throw new Error('Transaction failed');
    }

  } catch (error) {
    console.error(`❌ 代币所有权转移任务 ${taskId} 处理过程中发生错误:`, error);

    // 更新任务状态为失败
    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        result: JSON.stringify({
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          message: '代币所有权转移处理失败'
        })
      }
    });
  }
}
