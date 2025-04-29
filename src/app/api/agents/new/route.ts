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
      tokenAddress,
      iaoContractAddress,
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
      tokenAddressTestnet,
      iaoContractAddressTestnet,
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
        status: status || 'pending', // 初始状态为 pending
        creatorId: user.id,
        tokenAddress: tokenAddress || null,
        iaoContractAddress: iaoContractAddress || null,
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
        tokenAddressTestnet: tokenAddressTestnet || null,
        iaoContractAddressTestnet: iaoContractAddressTestnet || null,
        projectDescription: projectDescription || null,
      },
    });

    // 创建任务历史记录
    await prisma.history.create({
      data: {
        action: 'create',
        result: 'pending',
        agentId: agent.id,
      },
    });

    // 异步处理任务
    processTask(agent.id, {
      tokenAddress,
      iaoContractAddress,
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
        status: 'pending',
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
    tokenAddress?: string;
    iaoContractAddress?: string;
    tokenAmount?: string;
    startTimestamp?: number;
    durationHours?: number;
    rewardAmount?: string;
    rewardToken?: string;
  }
) {
  try {
    // 这里可以添加实际的任务处理逻辑
    // 例如调用外部 API、部署合约等

    // 模拟任务处理
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 更新 Agent 状态
    await prisma.agent.update({
      where: { id: agentId },
      data: {
        status: 'active',
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
      },
    });
  }
}
