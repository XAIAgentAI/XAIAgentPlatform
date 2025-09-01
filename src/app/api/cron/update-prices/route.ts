import { NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { currentChain } from '@/config/wagmi';
import { prisma } from '@/lib/prisma';
import type { Agent } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

interface DBCPriceResponse {
  status: number;
  code: string;
  msg: string;
  content: {
    dbc_price: number;
    update_time: string | null;
    percent_change_24h: number;
  };
}

// 获取 DBC 价格
async function getDBCPrice(): Promise<number> {
  try {
    const response = await fetch('https://dbchaininfo.congtu.cloud/query/dbc_info', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: DBCPriceResponse = await response.json();

    if (data.status !== 1) {
      throw new Error(`API error! status: ${data.status}, message: ${data.msg}`);
    }

    return data.content.dbc_price;
  } catch (error) {
    console.error('Error fetching DBC price:', error);
    return 1; // 默认价格
  }
}

// 获取 IAO 池中的 DBC 数量
async function getPoolDBCAmount(): Promise<bigint> {
  try {
    const publicClient = createPublicClient({
      chain: currentChain,
      transport: http(),
    });

    const totalDeposited = BigInt(0);
    
    // await publicClient.readContract({
    //   address: CONTRACTS.IAO_CONTRACT,
    //   abi: CURRENT_CONTRACT_ABI,
    //   functionName: 'totalDepositedDBC',
    // });

    return totalDeposited;
  } catch (error) {
    console.error('Error fetching pool DBC amount:', error);
    return BigInt(0);
  }
}

// 计算 XAA 价格
async function calculateXAAPrice(): Promise<number> {
  try {
    const [dbcPrice, dbcAmount] = await Promise.all([
      getDBCPrice(),
      getPoolDBCAmount()
    ]);

    // 将 DBC 数量从 wei 转换为标准单位
    const dbcAmountInStandard = Number(dbcAmount) / 1e18;

    // XAA 总量固定为 2000 亿
    const XAA_TOTAL_SUPPLY = 200_000_000_000;

    // 计算价格：(DBC数量 * DBC单价) / XAA总量
    return (dbcAmountInStandard * dbcPrice) / XAA_TOTAL_SUPPLY;
  } catch (error) {
    console.error('Error calculating XAA price:', error);
    return 1;
  }
}

// 更新所有 Agent 的价格
async function updateAllAgentPrices() {
  try {
    // 获取 XAA 价格（Agent ID 1）
    const xaaPrice = await calculateXAAPrice();
    console.log('xaaPrice', xaaPrice);

    // 从数据库获取所有 Agent
    const agents = await prisma.agent.findMany();
    console.log('agents', agents);

    // 批量创建价格记录
    const priceRecords = agents.map((agent: Agent) => ({
      agentId: agent.id,
      price: agent.id === '1' ? xaaPrice : 0,
      timestamp: new Date()
    }));

    // 批量插入价格记录
    await prisma.agentPrice.createMany({
      data: priceRecords
    });

    return { success: true, updatedAgents: agents.length };
  } catch (error) {
    console.error('Error updating agent prices:', error);
    throw error;
  }
}

export async function GET() {
  try {
    const result = await updateAllAgentPrices();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json(
      { error: 'Failed to update prices' },
      { status: 500 }
    );
  }
} 