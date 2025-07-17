import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSuccessResponse, handleError } from '@/lib/error';
import { verify } from 'jsonwebtoken';
import { Decimal } from '@prisma/client/runtime/library';
import { v4 as uuidv4 } from 'uuid';
import { reloadContractListeners } from '@/services/contractEventListener';
import { calculateRewardAmount } from '@/lib/utils';

const JWT_SECRET = 'xaiagent-jwt-secret-2024';

// 发送新任务
export async function POST(request: Request) {
  try {
    // 验证 JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { code: 401, message: '未授权访问' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = verify(token, JWT_SECRET) as { address: string };
    } catch (error) {
      return NextResponse.json(
        { code: 401, message: '无效的 token' },
        { status: 401 }
      );
    }

    // 获取请求体
    const body = await request.json();
    const {
      name,
      description,
      category,
      capabilities,
      tokenAmount,
      startTimestamp,
      durationHours,
      rewardAmount,
      rewardToken,
      symbol,
      avatar,
      type,
      marketCap,
      change24h,
      tvl,
      holdersCount,
      volume24h,
      status,
      statusJA,
      statusKO,
      statusZH,
      descriptionJA,
      descriptionKO,
      descriptionZH,
      detailDescription,
      lifetime,
      totalSupply,
      marketCapTokenNumber,
      useCases,
      useCasesJA,
      useCasesKO,
      useCasesZH,
      socialLinks,
      chatEntry,
      projectDescription,
      iaoTokenAmount,
      containerLink,
      miningRate,
    } = body;

    // 打印接收到的时间相关参数
    console.log('📅 接收到的时间参数:', {
      startTimestamp,
      durationHours,
      startTimestampType: typeof startTimestamp,
      durationHoursType: typeof durationHours,
      startTimestampDate: startTimestamp ? new Date(startTimestamp * 1000).toISOString() : 'undefined',
      calculatedEndTime: startTimestamp && durationHours ?
        new Date((startTimestamp + durationHours * 3600) * 1000).toISOString() : 'undefined'
    });

    // 验证必填字段
    if (!name || !description || !category || !capabilities || !symbol) {
      return NextResponse.json(
        { code: 400, message: '缺少必填字段' },
        { status: 400 }
      );
    }

    // 验证时间参数
    if (startTimestamp && (typeof startTimestamp !== 'number' || startTimestamp <= 0)) {
      return NextResponse.json(
        { code: 400, message: 'startTimestamp 必须是正整数' },
        { status: 400 }
      );
    }

    if (durationHours && (typeof durationHours !== 'number' || durationHours <= 0)) {
      return NextResponse.json(
        { code: 400, message: 'durationHours 必须是正数' },
        { status: 400 }
      );
    }

    // 检查名称是否已存在
    const existingAgent = await prisma.agent.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive' // 不区分大小写
        }
      }
    });

    if (existingAgent) {
      return NextResponse.json(
        { code: 400, message: 'Agent 名称已存在' },
        { status: 400 }
      );
    }

    // 检查 symbol 是否已存在
    if (symbol) {
      const existingSymbol = await prisma.agent.findFirst({
        where: {
          symbol: {
            equals: symbol,
            mode: 'insensitive' // 不区分大小写
          }
        }
      });

      if (existingSymbol) {
        return NextResponse.json(
          { code: 400, message: 'Agent Symbol 已存在' },
          { status: 400 }
        );
      }
    }

    // 查找或创建用户
    const user = await prisma.user.upsert({
      where: { address: decoded.address },
      update: {},
      create: {
        address: decoded.address,
      },
    });

    // 生成新的 UUID
    const newId = uuidv4();

    // 创建新的 Agent 记录
    const agent = await prisma.agent.create({
      data: {
        id: newId,
        name,
        description,
        category,
        capabilities: JSON.stringify(capabilities),
        status: status || 'CREATING', // 初始状态为 CREATING
        creatorId: user.id,
        tokenAddress: null, // 初始为 null，等待部署后更新
        iaoContractAddress: null, // 初始为 null，等待部署后更新
        iaoTokenAmount: tokenAmount ? new Decimal(tokenAmount) : null,
        symbol: symbol,
        avatar: avatar || null,
        type: type || category,
        marketCap: marketCap || '$0',
        change24h: change24h || '0',
        tvl: tvl || '$0',
        holdersCount: holdersCount || 0,
        volume24h: volume24h || '$0',
        statusJA: statusJA || null,
        statusKO: statusKO || null,
        statusZH: statusZH || null,
        descriptionJA: descriptionJA || null,
        descriptionKO: descriptionKO || null,
        descriptionZH: descriptionZH || null,
        longDescription: detailDescription || null,
        lifetime: lifetime || null,
        totalSupply: totalSupply ? new Decimal(totalSupply) : null,
        marketCapTokenNumber: marketCapTokenNumber ? new Decimal(marketCapTokenNumber) : null,
        useCases: useCases ? JSON.stringify(useCases) : null,
        useCasesJA: useCasesJA ? JSON.stringify(useCasesJA) : null,
        useCasesKO: useCasesKO ? JSON.stringify(useCasesKO) : null,
        useCasesZH: useCasesZH ? JSON.stringify(useCasesZH) : null,
        socialLinks: socialLinks || null,
        chatEntry: chatEntry || null,
        tokenAddressTestnet: null,
        iaoContractAddressTestnet: null,
        projectDescription: projectDescription || null,
        // miningRate: miningRate ? new Decimal(miningRate) : new Decimal(6), // 默认6% - 临时注释
      } as any,
    });

    // 如果提供了 containerLink，单独更新
    if (containerLink) {
      await prisma.$executeRaw`UPDATE "Agent" SET "containerLink" = ${containerLink} WHERE id = ${newId}`;
    }



    // 异步处理任务
    processTask(agent.id, {
      tokenAmount,
      startTimestamp,
      durationHours,
      rewardAmount,
      rewardToken,
    }).catch(console.error);

    return createSuccessResponse({
      agentId: agent.id,
      status: 'CREATING',
    }, '任务已创建');
  } catch (error) {
    return handleError(error);
  }
}

// 异步处理任务
async function processTask(
  agentId: string,
  taskData: {
    tokenAmount?: string;
    startTimestamp?: number;
    durationHours?: number;
    rewardAmount?: string;
    rewardToken?: string;
  }
) {
  const MAX_RETRIES = 2;
  const RETRY_DELAY = 5000; // 5秒

  // 重试函数
  async function retry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries === 0) throw error;
      console.log(`请求失败，${retries}次重试机会剩余...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return retry(fn, retries - 1);
    }
  }

  try {
    // 获取 Agent 信息
    console.log(`[Agent创建] 开始处理Agent ${agentId} 的创建任务...`);
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
      console.error(`[Agent创建] 错误: 找不到Agent ${agentId}`);
      throw new Error('Agent not found');
    }

    console.log(`[Agent创建] 找到Agent信息:`);
    console.log(`[Agent创建] - 名称: ${agent.name}`);
    console.log(`[Agent创建] - 创建者: ${agent.creator.address}`);
    console.log(`[Agent创建] - Symbol: ${agent.symbol}`);

    // 只部署 IAO，不部署 Token
    console.log(`[IAO部署] 开始部署IAO合约...`);
    console.log(`[IAO部署] 参数信息:`);
    console.log(`[IAO部署] - 持续时间: ${taskData.durationHours || 72}小时`);
    console.log(`[IAO部署] - 开始时间: ${taskData.startTimestamp || Math.floor(Date.now() / 1000) + 3600}`);
    console.log(`[IAO部署] - 奖励数量: ${taskData.rewardAmount || '2000000000000000000000000000'}`);
    console.log(`[IAO部署] - 所有者地址: ${agent.creator.address}`);

    const iaoResult = await retry(async () => {
      const iaoResponse = await fetch("http://54.179.233.88:8070/deploy/IAO", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "content-type": "application/json",
          "authorization": "Basic YWRtaW46MTIz"
        },
        body: JSON.stringify({
          duration_hours: taskData.durationHours || 72,
          owner: process.env.SERVER_WALLET_ADDRESS,
          reward_amount: calculateRewardAmount(agent.totalSupply),
          // 不传递 reward_token 参数，或传递 null
          reward_token: "0x0000000000000000000000000000000000000000",
          start_timestamp: taskData.startTimestamp || Math.floor(Date.now() / 1000) + 3600,
          token_in_address: process.env.NEXT_PUBLIC_XAA_TEST_VERSION === "true" ? "0x8a88a1D2bD0a13BA245a4147b7e11Ef1A9d15C8a" : "0x16d83F6B17914a4e88436251589194CA5AC0f452",
        })
      });

      const result = await iaoResponse.json();
      console.log('IAO deployment response:', result);
      
      if (result.code === 400 && result.message === 'CREATING') {
        // IAO 部署请求已接受，继续处理
        console.log('IAO deployment request accepted, continuing...');
        return result;
      } else if (result.code !== 200 || !result.data?.proxy_address) {
        throw new Error(`IAO deployment failed: ${result.message || 'Unknown error'}`);
      }
      
      return result;
    });

    // 检查合约地址是否有效
    if (!iaoResult.data?.proxy_address) {
      console.error(`[IAO部署] 错误: 部署后未获取到合约地址`);
      throw new Error('IAO contract address is missing after deployment');
    }

    console.log(`[IAO部署] 部署成功:`);
    console.log(`[IAO部署] - IAO合约地址: ${iaoResult.data.proxy_address}`);

    // 计算 IAO 时间戳
    const startTimestamp = taskData.startTimestamp || Math.floor(Date.now() / 1000) + 3600;
    const durationHours = taskData.durationHours || 72;
    const endTimestamp = startTimestamp + (durationHours * 3600);

    // 详细的时间计算日志
    console.log(`[时间计算] 详细信息:`);
    console.log(`[时间计算] - 客户端传入 startTimestamp: ${taskData.startTimestamp} (${taskData.startTimestamp ? new Date(taskData.startTimestamp * 1000).toISOString() : 'undefined'})`);
    console.log(`[时间计算] - 客户端传入 durationHours: ${taskData.durationHours}`);
    console.log(`[时间计算] - 实际使用 startTimestamp: ${startTimestamp} (${new Date(startTimestamp * 1000).toISOString()})`);
    console.log(`[时间计算] - 实际使用 durationHours: ${durationHours}`);
    console.log(`[时间计算] - 计算出的 endTimestamp: ${endTimestamp} (${new Date(endTimestamp * 1000).toISOString()})`);

    // 更新 Agent 状态和合约地址，同时保存 IAO 时间戳
    console.log(`[Agent更新] 开始更新Agent状态...`);
    console.log(`[Agent更新] IAO时间: ${new Date(startTimestamp * 1000).toISOString()} 到 ${new Date(endTimestamp * 1000).toISOString()}`);

    await prisma.agent.update({
      where: { id: agentId },
      data: {
        status: 'TBA',
        iaoContractAddress: iaoResult.data.proxy_address,
        iaoStartTime: BigInt(startTimestamp), // 存储为BigInt时间戳
        iaoEndTime: BigInt(endTimestamp),     // 存储为BigInt时间戳
        // tokenAddress保持null，等待后续创建
      },
    });
    console.log(`[Agent更新] Agent状态已更新为TBA，IAO时间已保存`);

    // 在合约地址更新到数据库后，重新加载事件监听器
    console.log('[事件监听] 触发监听器重新加载...');
    await reloadContractListeners();

    // Agent创建流程完成
    console.log(`[完成] Agent创建流程完成`);
  } catch (error) {
    // 处理错误
    console.error('[错误] 任务处理失败:', error);
    console.error('[错误] 详细信息:', {
      agentId,
      taskData,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : error
    });

    // 更新 Agent 状态为失败
    console.log(`[错误处理] 更新Agent ${agentId} 状态为failed`);
    await prisma.agent.update({
      where: { id: agentId },
      data: {
        status: 'FAILED',
      },
    });


  }
}
