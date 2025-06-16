import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSuccessResponse, handleError } from '@/lib/error';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = 'xaiagent-jwt-secret-2024';

// 创建Token并设置到IAO合约
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
    const { agentId } = body;

    if (!agentId) {
      return NextResponse.json(
        { code: 400, message: '缺少Agent ID' },
        { status: 400 }
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
        { code: 404, message: '找不到Agent' },
        { status: 404 }
      );
    }

    // 验证请求者是否是Agent的创建者
    if (agent.creator.address.toLowerCase() !== decoded.address.toLowerCase()) {
      return NextResponse.json(
        { code: 403, message: '只有Agent创建者可以执行此操作' },
        { status: 403 }
      );
    }

    // 检查IAO合约地址是否存在
    if (!agent.iaoContractAddress) {
      return NextResponse.json(
        { code: 400, message: 'IAO合约尚未部署' },
        { status: 400 }
      );
    }

    // 检查Token是否已经创建
    if (agent.tokenAddress) {
      return NextResponse.json(
        { code: 400, message: 'Token已经创建' },
        { status: 400 }
      );
    }

    // 记录开始创建Token的历史
    await prisma.history.create({
      data: {
        action: 'create_token_start',
        result: 'processing',
        agentId,
      },
    });

    // 部署Token
    console.log(`[Token创建] 开始为Agent ${agentId} 部署Token...`);
    console.log(`[Token创建] 创建者地址: ${agent.creator.address}`);
    console.log(`[Token创建] Token名称: ${agent.name.replace(/\s+/g, '')}`);
    console.log(`[Token创建] Token符号: ${agent.symbol}`);
    
    const tokenResponse = await fetch("http://3.0.25.131:8070/deploy/token", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "authorization": "Basic YWRtaW46MTIz"
      },
      body: JSON.stringify({
        owner: agent.creator.address,
        token_amount_can_mint_per_year: '1000000000000000000000000', // 默认值或从Agent获取
        token_init_supply: '1000000000000000000000000', // 默认值或从Agent获取
        token_name: agent.name.replace(/\s+/g, ''),
        token_supply_fixed_years: 8,
        token_symbol: agent.symbol
      })
    });

    const tokenResult = await tokenResponse.json();
    console.log(`[Token创建] Token部署结果:`, tokenResult);
    console.log(`[Token创建] Token合约地址: ${tokenResult.data?.proxy_address || '部署失败'}`);
    
    if (tokenResult.code !== 200 || !tokenResult.data?.proxy_address) {
      console.error(`[Token创建] 失败原因: ${tokenResult.message || '未知错误'}`);
      // 记录Token创建失败历史
      await prisma.history.create({
        data: {
          action: 'create_token',
          result: 'failed',
          agentId,
          error: `Token部署失败: ${tokenResult.message || '未知错误'}`
        },
      });

      return NextResponse.json(
        { code: 500, message: `Token部署失败: ${tokenResult.message || '未知错误'}` },
        { status: 500 }
      );
    }

    // 记录Token创建成功历史
    await prisma.history.create({
      data: {
        action: 'create_token',
        result: 'success',
        agentId,
      },
    });

    // 设置Token地址到IAO合约
    console.log(`[IAO设置] 开始设置Token到IAO合约...`);
    console.log(`[IAO设置] Token地址: ${tokenResult.data.proxy_address}`);
    console.log(`[IAO设置] IAO合约地址: ${agent.iaoContractAddress}`);
    console.log(`[IAO设置] 操作者地址: ${agent.creator.address}`);

    const setTokenResponse = await fetch("http://3.0.25.131:8070/contracts/set-reward-token", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "authorization": "Basic YWRtaW46MTIz"
      },
      body: JSON.stringify({
        iao_address: agent.iaoContractAddress,
        owner: agent.creator.address,
        token_address: tokenResult.data.proxy_address
      })
    });

    const setTokenResult = await setTokenResponse.json();
    console.log(`[IAO设置] 设置Token到IAO合约结果:`, setTokenResult);
    
    if (setTokenResult.code !== 200) {
      console.error(`[IAO设置] 设置失败原因: ${setTokenResult.message || '未知错误'}`);
      // 记录设置Token到IAO失败历史
      await prisma.history.create({
        data: {
          action: 'set_reward_token',
          result: 'failed',
          agentId,
          error: `设置Token到IAO失败: ${setTokenResult.message || '未知错误'}`
        },
      });

      // 即使设置失败，我们也更新Token地址，因为Token已经创建成功
      await prisma.agent.update({
        where: { id: agentId },
        data: {
          tokenAddress: tokenResult.data.proxy_address,
        },
      });

      return NextResponse.json(
        { 
          code: 500, 
          message: `Token创建成功但设置到IAO合约失败，请稍后手动设置。Token地址: ${tokenResult.data.proxy_address}`,
          data: {
            tokenAddress: tokenResult.data.proxy_address,
            error: setTokenResult.message || '未知错误'
          }
        },
        { status: 500 }
      );
    }

    // 记录设置Token到IAO成功历史
    await prisma.history.create({
      data: {
        action: 'set_reward_token',
        result: 'success',
        agentId,
      },
    });

    // 更新Agent记录
    console.log(`[完成] Token创建和IAO设置全部完成`);
    console.log(`[完成] Token地址: ${tokenResult.data.proxy_address}`);
    await prisma.agent.update({
      where: { id: agentId },
      data: {
        tokenAddress: tokenResult.data.proxy_address,
      },
    });

    return createSuccessResponse({
      code: 200,
      message: 'Token创建成功并已设置到IAO合约',
      data: {
        tokenAddress: tokenResult.data.proxy_address,
      },
    });
  } catch (error) {
    console.error('创建Token过程中发生错误:', error);
    return handleError(error);
  }
} 