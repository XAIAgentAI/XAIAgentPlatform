import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { AgentPrice } from '@prisma/client';
import { TimeInterval } from '@/hooks/useTokenPrice';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// 获取时间间隔的毫秒数
function getIntervalMilliseconds(interval: TimeInterval): number {
  const map: Record<TimeInterval, number> = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
  };
  return map[interval] || 60 * 1000; // 默认1分钟
}

// 按时间间隔聚合数据
function aggregateData(data: AgentPrice[], interval: TimeInterval): any[] {
  const intervalMs = getIntervalMilliseconds(interval);
  const groupedData = new Map<number, any>();

  data.forEach(record => {
    const timestamp = record.timestamp.getTime();
    const intervalTimestamp = Math.floor(timestamp / intervalMs) * intervalMs;
    
    if (!groupedData.has(intervalTimestamp)) {
      groupedData.set(intervalTimestamp, {
        time: Math.floor(intervalTimestamp / 1000),
        open: record.price,
        high: record.price,
        low: record.price,
        close: record.price,
        volume: 0
      });
    } else {
      const existing = groupedData.get(intervalTimestamp);
      existing.high = Math.max(existing.high, record.price);
      existing.low = Math.min(existing.low, record.price);
      existing.close = record.price;
    }
  });

  return Array.from(groupedData.values()).sort((a, b) => a.time - b.time);
}

export async function GET(
  request: Request,
  { params }: { params: { agentId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const interval = (searchParams.get('interval') || '1m') as TimeInterval;
    const from = parseInt(searchParams.get('from') || '0');
    const to = parseInt(searchParams.get('to') || Date.now().toString());

    // 从数据库获取价格历史数据
    const priceHistory = await prisma.agentPrice.findMany({
      where: {
        agentId: params.agentId,
        timestamp: {
          gte: new Date(from),
          lte: new Date(to)
        }
      },
      orderBy: {
        timestamp: 'asc'
      }
    });

    // 按时间间隔聚合数据
    const klineData = aggregateData(priceHistory, interval);

    return NextResponse.json(klineData);
  } catch (error) {
    console.error('Error fetching kline data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch kline data' },
      { status: 500 }
    );
  }
} 