/**
 * XAA销毁API端点
 * POST /api/agents/[id]/burn-xaa
 * 销毁IAO中XAA数量的5%，以及相应的NFC代币，由服务端钱包执行
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAgentCreator } from '@/lib/auth-middleware';
import { createSuccessResponse, handleError } from '@/lib/error';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { burnXAAFromServerWallet } from '@/lib/server-wallet/burn-xaa';
import { transferNFCToDeadAddress } from '@/lib/server-wallet/burn-nfc';

// 请求参数验证schema
const BurnXAARequestSchema = z.object({
  agentId: z.string().min(1, 'Agent ID is required'),
  iaoContractAddress: z.string().min(1, 'IAO contract address is required'),
  nfcTokenAddress: z.string().min(1, 'NFC token address is required'),
  nfcAmount: z.string().min(1, 'NFC amount is required'),
});

// 死亡地址 - 用于代币销毁
const DEAD_ADDRESS = '0x000000000000000000000000000000000000dEaD';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔥 收到XAA和NFC销毁请求...');

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

    const { iaoContractAddress, nfcTokenAddress, nfcAmount } = validationResult.data;

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

    if (!agent.iaoContractAddress) {
      return NextResponse.json(
        {
          code: 400,
          message: 'IAO合约地址未设置，无法执行销毁',
        },
        { status: 400 }
      );
    }

    // 创建任务记录
    const task = await prisma.task.create({
      data: {
        type: 'BURN_XAA_AND_NFC',
        status: 'PENDING',
        agentId,
        createdBy: user.address,
        result: JSON.stringify({
          metadata: {
            iaoContractAddress,
            nfcTokenAddress,
            nfcAmount
          }
        })
      },
    });

    console.log(`✅ 任务创建成功，任务ID: ${task.id}`);

    // 在后台执行销毁任务
    processBurnTask(
      task.id,
      agentId,
      iaoContractAddress,
      nfcTokenAddress,
      nfcAmount,
      user.address
    ).catch(error => {
      console.error(`[后台任务失败] 代币销毁任务 ${task.id} 失败:`, error);
    });

    // 立即返回成功响应
    return createSuccessResponse({
      code: 200,
      message: 'XAA和NFC销毁任务已提交，请稍后查询结果',
      data: {
        taskId: task.id,
      },
    });

  } catch (error) {
    console.error('提交销毁任务过程中发生错误:', error);
    return handleError(error);
  }
}

// 后台处理销毁任务
async function processBurnTask(
  taskId: string,
  agentId: string,
  iaoContractAddress: string,
  nfcTokenAddress: string,
  nfcAmount: string,
  userAddress: string
) {
  try {
    console.log(`[代币销毁] 开始为Agent ${agentId} 销毁XAA和NFC...`);
    console.log(`[代币销毁] IAO合约地址: ${iaoContractAddress}`);
    console.log(`[代币销毁] NFC代币地址: ${nfcTokenAddress}`);
    console.log(`[代币销毁] NFC销毁数量: ${nfcAmount}`);

    // 开始处理，更新任务状态
    await prisma.task.update({
      where: { id: taskId },
      data: { 
        status: 'PROCESSING',
        startedAt: new Date()
      }
    });

    console.log('🔥 开始执行代币销毁...');

    // 执行XAA销毁
    const xaaResult = await burnXAAFromServerWallet(iaoContractAddress as `0x${string}`);

    // 执行NFC转移到死亡地址
    const nfcResult = await transferNFCToDeadAddress(
      nfcTokenAddress as `0x${string}`,
      nfcAmount,
      DEAD_ADDRESS as `0x${string}`
    );

    if (xaaResult.success && nfcResult.success) {
      // 更新Agent状态 - 标记代币已销毁
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
            xaa: {
              txHash: xaaResult.txHash,
              burnAmount: xaaResult.burnAmount,
              iaoXAAAmount: xaaResult.iaoXAAAmount,
            },
            nfc: {
              txHash: nfcResult.txHash,
              burnAmount: nfcAmount,
            },
            transactions: [
              {
                type: 'burn_xaa',
                amount: xaaResult.burnAmount,
                txHash: xaaResult.txHash,
                status: 'confirmed',
                toAddress: '0x0000000000000000000000000000000000000000',
                description: `销毁IAO中${xaaResult.burnAmount}个XAA (总量的5%)`
              },
              {
                type: 'burn_nfc',
                amount: nfcAmount,
                txHash: nfcResult.txHash,
                status: 'confirmed',
                toAddress: DEAD_ADDRESS,
                description: `销毁${nfcAmount}个NFC代币`
              }
            ]
          })
        }
      });

      console.log(`✅ 代币销毁任务 ${taskId} 完成成功`);
      console.log(`🔥 XAA销毁数量: ${xaaResult.burnAmount} XAA`);
      console.log(`🔥 NFC销毁数量: ${nfcAmount} NFC`);

    } else {
      // 更新任务状态为失败
      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          result: JSON.stringify({
            success: false,
            error: xaaResult.error || nfcResult.error || '代币销毁失败',
            transactions: [
              {
                type: 'burn_xaa',
                amount: xaaResult.success ? xaaResult.burnAmount : '0',
                txHash: xaaResult.txHash || '',
                status: xaaResult.success ? 'confirmed' : 'failed',
                toAddress: '0x0000000000000000000000000000000000000000',
                error: xaaResult.error
              },
              {
                type: 'burn_nfc',
                amount: nfcResult.success ? nfcAmount : '0',
                txHash: nfcResult.txHash || '',
                status: nfcResult.success ? 'confirmed' : 'failed',
                toAddress: DEAD_ADDRESS,
                error: nfcResult.error
              }
            ]
          })
        }
      });

      console.error(`❌ 代币销毁任务 ${taskId} 失败:`, xaaResult.error || nfcResult.error);
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
