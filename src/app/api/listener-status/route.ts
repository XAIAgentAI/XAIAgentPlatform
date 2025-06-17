/**
 * 检查事件监听器状态的简单 API
 * 禁用缓存，确保每次都返回最新状态
 */

import { NextResponse } from 'next/server';
import { contractEventListener } from '@/services/contractEventListener';

export async function GET() {
  try {
    const isActive = contractEventListener.isActive();

    // 获取数据库中的合约地址信息
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const agentsWithContracts = await prisma.agent.findMany({
      where: {
        OR: [
          { iaoContractAddress: { not: null } },
          { iaoContractAddressTestnet: { not: null } }
        ]
      },
      select: {
        id: true,
        name: true,
        iaoContractAddress: true,
        iaoContractAddressTestnet: true,
      }
    });

    const response = NextResponse.json({
      status: 'success',
      data: {
        isListening: isActive,
        message: isActive ? '事件监听器正在运行' : '事件监听器已停止',
        timestamp: new Date().toISOString(),
        contractsCount: agentsWithContracts.length,
        contracts: agentsWithContracts.map(agent => ({
          agentId: agent.id,
          agentName: agent.name,
          mainnetContract: agent.iaoContractAddress,
          testnetContract: agent.iaoContractAddressTestnet
        }))
      }
    });

    // 禁用缓存
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');

    return response;
  } catch (error) {
    const errorResponse = NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });

    // 错误响应也禁用缓存
    errorResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    errorResponse.headers.set('Pragma', 'no-cache');
    errorResponse.headers.set('Expires', '0');

    return errorResponse;
  }
}

// 禁用 Next.js 的静态优化和缓存
export const dynamic = 'force-dynamic';
export const revalidate = 0;
