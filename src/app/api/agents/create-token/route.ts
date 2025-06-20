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

    // 检查必要的数据库字段
    if (!agent.iaoTokenAmount) {
      return NextResponse.json(
        { code: 400, message: 'IAO代币数量未设置' },
        { status: 400 }
      );
    }

    // 创建任务记录
    const task = await prisma.task.create({
      data: {
        type: 'CREATE_TOKEN',
        status: 'PENDING',
        agentId,
        createdBy: decoded.address,
      },
    });

    // 记录开始创建Token的历史
    await prisma.history.create({
      data: {
        action: 'create_token_submit',
        result: 'pending',
        agentId,
        taskId: task.id,
      },
    });

    // 在后台执行Token创建和IAO设置任务
    processTokenCreationTask(task.id, agentId, agent).catch(error => {
      console.error(`[后台任务失败] Token创建任务 ${task.id} 失败:`, error);
    });

    // 立即返回成功响应
    return createSuccessResponse({
      code: 200,
      message: '已成功提交Token创建任务，请稍后查询结果',
      data: {
        taskId: task.id,
      },
    });
  } catch (error) {
    console.error('提交Token创建任务过程中发生错误:', error);
    return handleError(error);
  }
}

// 后台处理Token创建任务
async function processTokenCreationTask(taskId: string, agentId: string, agent: any) {
  try {
    // 从数据库中获取必要的参数
    const iaoContractAddress = agent.iaoContractAddress;

    // 计算IAO代币数量：总供应量 × IAO比例 (默认15%)
    const totalSupply = agent.totalSupply ? BigInt(agent.totalSupply.toString()) : BigInt('100000000000000000000000000000'); // 默认1000亿
    const iaoPercentage = 15; // 15%
    const amountToIAO = (totalSupply * BigInt(iaoPercentage) / BigInt(100)).toString();

    console.log(`[Token创建] 开始为Agent ${agentId} 部署Token...`);
    console.log(`[Token创建] 创建者地址: ${agent.creator.address}`);
    console.log(`[Token创建] Token名称: ${agent.name.replace(/\s+/g, '')}`);
    console.log(`[Token创建] Token符号: ${agent.symbol}`);
    console.log(`[Token创建] IAO合约地址: ${iaoContractAddress}`);
    console.log(`[Token创建] 总供应量: ${totalSupply.toString()}`);
    console.log(`[Token创建] IAO比例: ${iaoPercentage}%`);
    console.log(`[Token创建] 分配给IAO的代币数量: ${amountToIAO}`);
    
    // 开始处理，更新任务状态
    await prisma.task.update({
      where: { id: taskId },
      data: { 
        status: 'PROCESSING',
        startedAt: new Date()
      }
    });
    
    // 准备请求体 - 使用正确的字段名格式（下划线）
    const requestBody = {
      owner: agent.creator.address,
      token_amount_can_mint_per_year: agent.totalSupply ? agent.totalSupply.toString() : '1000000000000000000000000',
      token_init_supply: agent.totalSupply ? agent.totalSupply.toString() : '1000000000000000000000000',
      token_name: agent.name.replace(/\s+/g, ''),
      token_supply_fixed_years: 8,
      token_symbol: agent.symbol,
      iao_contract_address: iaoContractAddress,
      amount_to_iao: amountToIAO
    };

    console.log(`[Token创建] 请求体:`, JSON.stringify(requestBody, null, 2));

    // 部署Token
    const tokenResponse = await fetch("http://3.0.25.131:8070/deploy/token", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "authorization": "Basic YWRtaW46MTIz"
      },
      body: JSON.stringify(requestBody)
    });

    let tokenResult;
    try {
      const responseText = await tokenResponse.text();
      console.log(`[Token创建] 原始响应:`, responseText);
      console.log(`[Token创建] 响应状态:`, tokenResponse.status);

      // 尝试解析JSON
      if (responseText.trim()) {
        tokenResult = JSON.parse(responseText);
      } else {
        tokenResult = { code: 500, message: '空响应' };
      }
    } catch (parseError: any) {
      console.error(`[Token创建] JSON解析失败:`, parseError);

      tokenResult = {
        code: 500,
        message: `响应解析失败: ${parseError.message}`
      };
    }

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
          taskId,
          error: `Token部署失败: ${tokenResult.message || '未知错误'}`
        },
      });

      // 更新任务状态为失败
      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: 'FAILED',
          result: JSON.stringify({
            error: `Token部署失败: ${tokenResult.message || '未知错误'}`
          }),
          completedAt: new Date(),
        },
      });

      return;
    }

    // 记录Token创建成功历史
    await prisma.history.create({
      data: {
        action: 'create_token',
        result: 'success',
        agentId,
        taskId,
      },
    });

    // 更新Agent记录 - Token创建成功后直接完成
    console.log(`[完成] Token创建完成`);
    console.log(`[完成] Token地址: ${tokenResult.data.proxy_address}`);
    await prisma.agent.update({
      where: { id: agentId },
      data: {
        tokenAddress: tokenResult.data.proxy_address,
      },
    });

    // 更新任务状态为成功
    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'COMPLETED',
        result: JSON.stringify({
          tokenAddress: tokenResult.data.proxy_address,
        }),
        completedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('后台处理Token创建任务时发生错误:', error);
    
    // 更新任务状态为失败
    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'FAILED',
        result: JSON.stringify({
          error: `处理过程中发生错误: ${error instanceof Error ? error.message : String(error)}`
        }),
        completedAt: new Date(),
      },
    });
  }
} 