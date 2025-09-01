import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSuccessResponse, handleError } from '@/lib/error';
import { verify } from 'jsonwebtoken';
import { getServerWalletAddress } from '@/lib/server-wallet/config';
import { calculateRewardAmount } from '@/lib/utils';

const JWT_SECRET = 'xaiagent-jwt-secret-2024';

/**
 * 重新部署IAO合约API
 * 
 * 此API用于解决IAO失败后数据状态未重置的问题。
 * 当IAO失败并需要重新启动时，需要部署一个全新的IAO合约，
 * 而不是复用旧的合约，因为旧合约中的数据状态（如totalDepositedTokenIn，userDeposits等）
 * 在IAO结束后不会被重置，导致质押数据累加而不是重置。
 */

// 重试函数
async function retry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    console.log(`请求失败，${retries}次重试机会剩余...`);
    await new Promise(resolve => setTimeout(resolve, 5000));
    return retry(fn, retries - 1);
  }
}

// 重新部署IAO API端点
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 获取URL参数中的agentId
    const agentId = params.id;
    
    // 验证 JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { code: 401, message: 'Unauthorized access' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = verify(token, JWT_SECRET) as { address: string };
    } catch (error) {
      return NextResponse.json(
        { code: 401, message: 'Invalid token' },
        { status: 401 }
      );
    }

    // 获取Agent信息
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
        { code: 404, message: 'Agent not found' },
        { status: 404 }
      );
    }

    // 验证请求者是否是Agent的创建者
    if (agent.creator.address.toLowerCase() !== decoded.address.toLowerCase()) {
      return NextResponse.json(
        { code: 403, message: 'Only agent creator can perform this operation' },
        { status: 403 }
      );
    }

    // 检查当前IAO状态
    const currentIaoStatus = agent.status;
    const hasIaoContract = !!agent.iaoContractAddress;
    
    console.log(`[IAO重新部署] 开始为Agent ${agentId} 重新部署IAO...`);
    console.log(`[IAO重新部署] - 名称: ${agent.name}`);
    console.log(`[IAO重新部署] - Symbol: ${agent.symbol}`);
    console.log(`[IAO重新部署] - 创建者: ${agent.creator.address}`);
    console.log(`[IAO重新部署] - 当前状态: ${currentIaoStatus}`);
    console.log(`[IAO重新部署] - 当前IAO合约地址: ${agent.iaoContractAddress || '无'}`);
    
    // 如果有之前的IAO合约，记录下来
    if (hasIaoContract) {
      console.log(`[IAO重新部署] - 检测到已有IAO合约，将替换为新的IAO合约`);
      console.log(`[IAO重新部署] - 此操作将重置所有质押数据`);
    }

    // 检查是否有其他任务正在执行
    console.log(`[IAO重新部署] 检查pending状态...`);
    try {
      const pendingResponse = await fetch("http://54.179.233.88:8070/pending", {
        method: "GET",
        headers: {
          "accept": "application/json",
          "authorization": "Basic YWRtaW46MTIz"
        }
      });

      const pendingResult = await pendingResponse.json();
      console.log(`[IAO重新部署] pending状态检查结果:`, pendingResult);
      
      if (pendingResult.data?.pending === true) {
        console.log(`[IAO重新部署] 检测到有任务正在执行，拒绝新的部署请求`);
        return NextResponse.json(
          { code: 429, message: 'DEPLOYMENT_IN_PROGRESS' },
          { status: 429 }
        );
      }
    } catch (error) {
      console.log(`[IAO重新部署] 无法检查pending状态，继续执行部署: ${error}`);
    }

    // 使用默认的IAO设置
    const durationHours = 72; // 默认72小时
    const startTimestamp = Math.floor(Date.now() / 1000) + 3600; // 默认1小时后开始

    // 调用IAO部署API
    console.log(`[IAO重新部署] 正在调用部署服务...`);
    const iaoResult = await retry(async () => {
      const iaoResponse = await fetch("http://54.179.233.88:8070/deploy/IAO", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "content-type": "application/json",
          "authorization": "Basic YWRtaW46MTIz"
        },
        body: JSON.stringify({
          duration_hours: durationHours,
          owner: getServerWalletAddress(), // 使用函数获取服务器钱包地址
          reward_amount: calculateRewardAmount(agent.totalSupply),
          reward_token: "0x0000000000000000000000000000000000000000",
          start_timestamp: startTimestamp,
          token_in_address: process.env.NEXT_PUBLIC_XAA_TEST_VERSION === "true" 
            ? "0x8a88a1D2bD0a13BA245a4147b7e11Ef1A9d15C8a" 
            : "0x16d83F6B17914a4e88436251589194CA5AC0f452",
        })
      });

      // 检查外部服务响应类型
      const contentType = iaoResponse.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await iaoResponse.text();
        console.error('[IAO重新部署] 外部服务返回非JSON响应:', text);
        throw new Error(`IAO部署服务异常: ${iaoResponse.status} ${iaoResponse.statusText}`);
      }

      const result = await iaoResponse.json();
      console.log('[IAO重新部署] 部署响应:', result);
      
      if (result.code === 400 && result.message === 'CREATING') {
        // IAO 部署请求已接受，继续处理
        console.log('[IAO重新部署] 部署请求已接受，继续处理...');
        return result;
      } else if (result.code !== 200 || !result.data?.proxy_address) {
        console.error('[IAO重新部署] 部署失败请求参数', JSON.stringify({
          duration_hours: durationHours,
          owner: getServerWalletAddress(), // 使用函数获取服务器钱包地址
          reward_amount: calculateRewardAmount(agent.totalSupply),
          reward_token: "0x0000000000000000000000000000000000000000",
          start_timestamp: startTimestamp,
          token_in_address: process.env.NEXT_PUBLIC_XAA_TEST_VERSION === "true" 
            ? "0x8a88a1D2bD0a13BA245a4147b7e11Ef1A9d15C8a" 
            : "0x16d83F6B17914a4e88436251589194CA5AC0f452",
      })
    );
        throw new Error(`IAO重新部署失败: ${result.message || '未知错误'}`);
      }
      
      return result;
    });

    // 检查合约地址是否有效
    if (!iaoResult.data?.proxy_address) {
      console.error(`[IAO重新部署] 错误: 部署后未获取到合约地址`);
      throw new Error('IAO合约地址部署后丢失');
    }

    // 计算IAO结束时间
    const endTimestamp = startTimestamp + (durationHours * 3600);

    console.log(`[IAO重新部署] 部署成功:`);
    console.log(`[IAO重新部署] - IAO合约地址: ${iaoResult.data.proxy_address}`);
    console.log(`[IAO重新部署] - 开始时间: ${new Date(startTimestamp * 1000).toISOString()}`);
    console.log(`[IAO重新部署] - 结束时间: ${new Date(endTimestamp * 1000).toISOString()}`);
    
    if (hasIaoContract) {
      console.log(`[IAO重新部署] - 旧IAO合约地址: ${agent.iaoContractAddress}`);
      console.log(`[IAO重新部署] - 新IAO合约地址: ${iaoResult.data.proxy_address}`);
    }

    // 更新Agent数据库记录
    await prisma.agent.update({
      where: { id: agentId },
      data: {
        status: 'TBA',
        iaoContractAddress: iaoResult.data.proxy_address,
        iaoStartTime: BigInt(startTimestamp),
        iaoEndTime: BigInt(endTimestamp),
        // 如果IAO重新部署，重置相关字段
        tokensDistributed: false,
        liquidityAdded: false,
        tokensBurned: false,
        ownerTransferred: false,
        // 重置IAO成功状态相关字段
        iaoSuccessful: null,
        iaoSuccessChecked: false,
        iaoSuccessCheckTime: null,
      } as any,
    });

    console.log(`[IAO重新部署] 数据库记录已更新，所有状态已重置`);

    // 尝试重新加载合约事件监听器
    try {
      const { reloadContractListeners } = await import('@/services/contractEventListener');
      console.log('[事件监听] 触发监听器重新加载...');
      await reloadContractListeners();
    } catch (error) {
      console.error('[事件监听] 重新加载失败:', error);
      // 继续执行，不中断流程
    }

    return createSuccessResponse({
      message: '已成功部署新的IAO合约',
      iaoContractAddress: iaoResult.data.proxy_address,
      startTime: startTimestamp,
      endTime: endTimestamp
    });
  } catch (error) {
    console.error('[IAO重新部署] 处理失败:', error);
    return handleError(error);
  }
} 