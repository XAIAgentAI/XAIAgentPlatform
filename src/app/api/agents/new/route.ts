import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSuccessResponse, handleError } from '@/lib/error';
import { verify } from 'jsonwebtoken';
import { Decimal } from '@prisma/client/runtime/library';
import { v4 as uuidv4 } from 'uuid';

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
    } = body;

    // 验证必填字段
    if (!name || !description || !category || !capabilities || !symbol) {
      return NextResponse.json(
        { code: 400, message: '缺少必填字段' },
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
      },
    });

    // 创建任务历史记录
    await prisma.history.create({
      data: {
        action: 'create',
        result: 'CREATING',
        agentId: agent.id,
      },
    });

    // 异步处理任务
    processTask(agent.id, {
      tokenAmount,
      startTimestamp,
      durationHours,
      rewardAmount,
      rewardToken,
    }).catch(console.error);

    return createSuccessResponse({
      code: 200,
      message: '任务已创建',
      data: {
        agentId: agent.id,
        status: 'CREATING',
      },
    });
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
      throw new Error('Agent not found');
    }

    // 部署 Token
    const tokenResult = await retry(async () => {
      const tokenResponse = await fetch("http://3.0.25.131:8070/deploy/token", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "content-type": "application/json",
          "authorization": "Basic YWRtaW46MTIz"
        },
        body: JSON.stringify({
          owner: agent.creator.address,
          token_amount_can_mint_per_year: taskData.tokenAmount || '1000000000000000000',
          token_init_supply: taskData.tokenAmount || '1000000000000000000',
          token_name: agent.name.replace(/\s+/g, ''),
          token_supply_fixed_years: 8,
          token_symbol: agent.symbol
        })
      });

      const result = await tokenResponse.json();
      console.log('Token deployment response:', result);
      
      if (result.code === 400 && result.message === 'CREATING') {
        // Token 部署请求已接受，继续处理
        console.log('Token deployment request accepted, continuing...');
        return result;
      } else if (result.code !== 200 || !result.data?.proxy_address) {
        throw new Error(`Token deployment failed: ${result.message || 'Unknown error'}`);
      }
      
      return result;
    });

    // 部署 IAO
    const iaoResult = await retry(async () => {
      const iaoResponse = await fetch("http://3.0.25.131:8070/deploy/IAO", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "content-type": "application/json",
          "authorization": "Basic YWRtaW46MTIz"
        },
        body: JSON.stringify({
          duration_hours: taskData.durationHours || 72,
          owner: agent.creator.address,
          reward_amount: taskData.rewardAmount || '2000000000000000000000000000',
          reward_token: tokenResult.data?.proxy_address || taskData.rewardToken,
          start_timestamp: taskData.startTimestamp || Math.floor(Date.now() / 1000) + 3600
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
    if (!tokenResult.data?.proxy_address || !iaoResult.data?.proxy_address) {
      throw new Error('Contract addresses are missing after deployment');
    }

    // 更新 Agent 状态和合约地址
    await prisma.agent.update({
      where: { id: agentId },
      data: {
        status: 'TBA',
        tokenAddress: tokenResult.data.proxy_address,
        iaoContractAddress: iaoResult.data.proxy_address,
      },
    });

    // 更新任务历史记录
    await prisma.history.create({
      data: {
        action: 'process',
        result: 'success',
        agentId,
      },
    });
  } catch (error) {
    // 处理错误
    console.error('任务处理失败:', error);
    console.error('错误详情:', {
      agentId,
      taskData,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : error
    });

    // 更新 Agent 状态为失败
    await prisma.agent.update({
      where: { id: agentId },
      data: {
        status: 'failed',
      },
    });

    // 记录失败历史
    await prisma.history.create({
      data: {
        action: 'process',
        result: 'failed',
        agentId,
        //error: error instanceof Error ? error.message : 'Unknown error'
      },
    });
  }
}
