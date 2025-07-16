import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSuccessResponse, handleError, ApiError } from '@/lib/error';
import { verify } from 'jsonwebtoken';
import { getServerWalletClients } from '@/lib/server-wallet';
import { getContractABI } from '@/config/contracts';

const JWT_SECRET = 'xaiagent-jwt-secret-2024';

// 更新IAO时间的API端点
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

    // 获取请求体数据
    const body = await request.json();
    const { startTime, endTime } = body;

    // 验证必要参数
    if (!startTime || !endTime) {
      return NextResponse.json(
        { code: 400, message: '缺少必要参数 startTime 或 endTime' },
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

    console.log(`[IAO时间更新] 开始为Agent ${agentId} 更新IAO时间...`);
    console.log(`[IAO时间更新] - 名称: ${agent.name}`);
    console.log(`[IAO时间更新] - 新开始时间: ${new Date(startTime * 1000).toISOString()}`);
    console.log(`[IAO时间更新] - 新结束时间: ${new Date(endTime * 1000).toISOString()}`);
    
    // 计算IAO持续时间（小时）
    const durationHours = Math.floor((endTime - startTime) / 3600);
    console.log(`[IAO时间更新] - 持续时间: ${durationHours}小时`);

    // 验证持续时间是否在有效范围内（72-240小时）
    if (durationHours < 72 || durationHours > 240) {
      return NextResponse.json(
        { code: 400, message: 'IAO持续时间必须在72-240小时之间' },
        { status: 400 }
      );
    }

    // 验证开始时间是否合理
    const now = Math.floor(Date.now() / 1000);
    const isIaoStarted = agent.iaoStartTime ? Number(agent.iaoStartTime) <= now : false;
    
    // 如果IAO已经开始，不允许修改开始时间
    if (isIaoStarted && startTime !== Number(agent.iaoStartTime)) {
      return NextResponse.json(
        { code: 400, message: 'IAO已经开始，不能修改开始时间' },
        { status: 400 }
      );
    }

    // 获取IAO合约地址（根据环境选择正式或测试网地址）
    const iaoContractAddress = process.env.NEXT_PUBLIC_IS_TEST_ENV === 'true'
      ? agent.iaoContractAddressTestnet
      : agent.iaoContractAddress;

    if (!iaoContractAddress) {
      return NextResponse.json(
        { code: 400, message: 'IAO合约地址不存在' },
        { status: 400 }
      );
    }

    console.log(`[IAO时间更新] - 使用IAO合约地址: ${iaoContractAddress}`);

    try {
      // 获取服务端钱包客户端
      const { walletClient, publicClient, serverAccount } = await getServerWalletClients();
      
      console.log(`[IAO时间更新] - 服务端钱包地址: ${serverAccount.address}`);
      
      // 获取合约ABI
      const contractABI = getContractABI(agent.symbol || 'XAA');
      
      // 调用合约的setTimeFor方法
      console.log(`[IAO时间更新] - 调用合约setTimeFor方法...`);
      const hash = await walletClient.writeContract({
        address: iaoContractAddress as `0x${string}`,
        abi: contractABI,
        functionName: 'setTimeFor',
        args: [BigInt(startTime), BigInt(endTime)],
        // account: serverAccount.address,
      });
      
      console.log(`[IAO时间更新] - 交易已提交: ${hash}`);
      
      // 等待交易确认
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        timeout: 60000, // 60秒超时
      });
      
      if (receipt.status !== 'success') {
        console.error(`[IAO时间更新] - 交易失败: ${hash}`);
        return NextResponse.json(
          { code: 500, message: '合约调用失败，请稍后重试' },
          { status: 500 }
        );
      }
      
      console.log(`[IAO时间更新] - 交易成功: ${hash}`);
      
      // 更新Agent数据库记录中的IAO时间
      await prisma.agent.update({
        where: { id: agentId },
        data: {
          iaoStartTime: BigInt(startTime),
          iaoEndTime: BigInt(endTime),
        },
      });
      
      console.log(`[IAO时间更新] 数据库记录已更新`);
      
      // 尝试重新加载合约事件监听器
      try {
        const { reloadContractListeners } = await import('@/services/contractEventListener');
        console.log('[事件监听] 触发监听器重新加载...');
        await reloadContractListeners();
      } catch (error) {
        console.error('[事件监听] 重新加载失败:', error);
        // 继续执行，不中断流程
      }
      
      return NextResponse.json({
        code: 200,
        message: 'IAO时间更新成功',
        data: {
          txHash: hash,
          startTime,
          endTime,
          durationHours
        }
      });
    } catch (error) {
      console.error('[IAO时间更新] 合约调用失败:', error);
      return NextResponse.json(
        { 
          code: 500, 
          message: `合约调用失败: ${error instanceof Error ? error.message : '未知错误'}` 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('更新IAO时间失败:', error);
    return handleError(error);
  }
} 