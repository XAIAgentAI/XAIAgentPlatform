import { useEffect, useRef, useState } from 'react';

export interface KLineData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type TimeInterval = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d';

export interface TokenPrice {
  price: number;
  volume: number;
  timestamp: number;
}

type PriceUpdateCallback = (data: {
  klineData: KLineData[];
  currentPrice: number;
  priceChange: number;
}) => void;

export class TokenPriceManager {
  private pollingInterval: NodeJS.Timeout | null = null;
  private subscribers = new Set<PriceUpdateCallback>();
  private data: KLineData[] = [];
  private maxDataPoints = 10000;
  private lastFetchedTime: number = 0;
  private interval: TimeInterval;
  private currentPrice = 0;
  private priceChange = 0;
  private initialized = false;
  private readonly POLLING_INTERVAL = 10000; // 10秒

  constructor(interval: TimeInterval = '1h') {
    this.interval = interval;
  }

  async init() {
    if (this.initialized) {
      return;
    }

    try {
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      await this.fetchHistoricalData(sevenDaysAgo, Date.now());
      this.lastFetchedTime = Date.now();
      
      this.startPolling();
      this.initialized = true;
    } catch (err) {
      console.error('Failed to initialize TokenPriceManager:', err);
      throw err;
    }
  }

  private startPolling() {
    // 立即执行一次增量更新
    this.pollIncrementalData();

    // 设置定期轮询
    this.pollingInterval = setInterval(() => {
      this.pollIncrementalData();
    }, this.POLLING_INTERVAL);
  }

  private async pollIncrementalData() {
    try {
      // 只获取上次获取时间之后的数据
      await this.fetchHistoricalData(this.lastFetchedTime, Date.now());
      
      // 更新当前价格和价格变化
      const latestKline = this.data[this.data.length - 1];
      this.currentPrice = latestKline.close;
      
      if (this.data.length >= 2) {
        const previousKline = this.data[this.data.length - 2];
        this.priceChange = ((latestKline.close - previousKline.close) / previousKline.close) * 100;
      }

      // 通知所有订阅者
      this.notifySubscribers();
      
      console.log('Updated price data:', {
        currentPrice: this.currentPrice,
        priceChange: this.priceChange,
        totalDataPoints: this.data.length,
        timeRange: {
          start: new Date(this.data[0]?.time * 1000).toISOString(),
          end: new Date(this.data[this.data.length - 1]?.time * 1000).toISOString()
        },
        interval: this.interval
      });
    } catch (err) {
      console.error('Polling failed:', err);
    }
  }

  subscribe(callback: PriceUpdateCallback) {
    this.subscribers.add(callback);
    callback(this.getCurrentData());
    return () => {
      this.subscribers.delete(callback);
    };
  }

  getCurrentData() {
    return {
      klineData: this.data,
      currentPrice: this.currentPrice,
      priceChange: this.priceChange
    };
  }

  async refetch() {
    await this.fetchHistoricalData(Date.now() - 7 * 24 * 60 * 60 * 1000, Date.now());
  }

  destroy() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.subscribers.clear();
    this.initialized = false;
  }

  private async fetchHistoricalData(from: number, to: number) {
    try {
      const response = await fetch(
        `/api/kline/1?from=${from}&to=${to}&interval=${this.interval}`,
        {
          cache: 'no-store'
        }
      );
      const newData: KLineData[] = await response.json();

      // 过滤掉重复的数据点
      const existingTimes = new Set(this.data.map(d => d.time));
      const uniqueNewData = newData.filter(d => !existingTimes.has(d.time));

      // 添加新数据
      this.data = [...this.data, ...uniqueNewData]
        .sort((a, b) => a.time - b.time)
        .slice(-this.maxDataPoints);

      // 更新当前价格和价格变化
      const latestKline = this.data[this.data.length - 1];
      this.currentPrice = latestKline.close;
      
      if (this.data.length >= 2) {
        const previousKline = this.data[this.data.length - 2];
        this.priceChange = ((latestKline.close - previousKline.close) / previousKline.close) * 100;
      }

      this.notifySubscribers();
    } catch (error) {
      console.error('Error fetching historical data:', error);
    }
  }

  private notifySubscribers() {
    const data = this.getCurrentData();
    this.subscribers.forEach(callback => callback(data));
  }

  getData(): KLineData[] {
    return this.data;
  }

  setInterval(interval: TimeInterval) {
    this.interval = interval;
    this.data = []; // 清空现有数据
    this.init(); // 重新获取数据
  }

  async pollData() {
    if (!this.lastFetchedTime) return;
    const currentTime = Date.now();
    await this.fetchHistoricalData(this.lastFetchedTime, currentTime);
    this.lastFetchedTime = currentTime;
  }
}

export function useTokenPrice(interval: TimeInterval = '1h') {
  const [data, setData] = useState<KLineData[]>([]);
  const managerRef = useRef<TokenPriceManager | null>(null);

  useEffect(() => {
    if (!managerRef.current) {
      managerRef.current = new TokenPriceManager(interval);
    }

    const manager = managerRef.current;
    manager.setInterval(interval);

    const updateData = () => {
      setData([...manager.getData()]);
    };

    manager.init().then(updateData);

    const pollInterval = setInterval(() => {
      manager.pollData().then(updateData);
    }, 60000); // 每分钟更新一次

    return () => {
      clearInterval(pollInterval);
    };
  }, [interval]);

  return data;
}

// 导出工厂函数
export const createTokenPriceManager = (
  tokenAddress: string,
  interval: TimeInterval = '1h',
  agentId: number
) => {
  return new TokenPriceManager(interval);
}; 