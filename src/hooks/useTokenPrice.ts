import { useEffect, useRef, useState } from 'react';

export interface KLineData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type TimeInterval = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w';

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
  private retryCount = 0;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 2000; // 2秒

  constructor(interval: TimeInterval = '1h') {
    this.interval = interval;
  }

  async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      await this.fetchHistoricalData(sevenDaysAgo, Date.now());
      this.lastFetchedTime = Date.now();
      
      this.startPolling();
      this.initialized = true;
      this.retryCount = 0; // 重置重试计数
    } catch (err) {
      console.error('Failed to initialize TokenPriceManager:', err);
      if (this.retryCount < this.MAX_RETRIES) {
        this.retryCount++;
        console.log(`Retrying initialization (attempt ${this.retryCount})...`);
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * this.retryCount));
        return this.init();
      }
      throw err;
    }
  }

  private startPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    this.pollingInterval = setInterval(async () => {
      try {
        await this.pollIncrementalData();
        this.retryCount = 0; // 成功后重置重试计数
      } catch (err) {
        console.error('Polling failed:', err);
        if (this.retryCount < this.MAX_RETRIES) {
          this.retryCount++;
          console.log(`Retrying polling (attempt ${this.retryCount})...`);
          setTimeout(() => this.pollIncrementalData(), this.RETRY_DELAY * this.retryCount);
        } else {
          // 达到最大重试次数后，尝试重新初始化
          this.initialized = false;
          this.init().catch(console.error);
        }
      }
    }, this.POLLING_INTERVAL);
  }

  private async pollIncrementalData() {
    if (!this.lastFetchedTime) return;
    
    try {
      const currentTime = Date.now();
      const response = await fetch(
        `/api/kline/1?from=${this.lastFetchedTime}&to=${currentTime}&interval=${this.interval}`,
        {
          cache: 'no-store'
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newData: KLineData[] = await response.json();

      if (!Array.isArray(newData)) {
        throw new Error('Invalid data format received');
      }

      // 过滤掉重复的数据点
      const existingTimes = new Set(this.data.map(d => d.time));
      const uniqueNewData = newData.filter(d => !existingTimes.has(d.time));

      if (uniqueNewData.length > 0) {
        // 添加新数据
        this.data = [...this.data, ...uniqueNewData]
          .sort((a, b) => a.time - b.time)
          .slice(-this.maxDataPoints);

        // 更新当前价格和价格变化
        const latestKline = this.data[this.data.length - 1];
        this.currentPrice = latestKline.close;
        
        // 计算24小时价格变化
        this.calculatePriceChange24h();

        // 通知所有订阅者
        this.notifySubscribers();
      }

      this.lastFetchedTime = currentTime;
    } catch (err) {
      console.error('Error in pollIncrementalData:', err);
      throw err;
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
      
      // 计算24小时价格变化
      this.calculatePriceChange24h();

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
    if (this.interval !== interval) {
      this.interval = interval;
      this.data = []; // 清空现有数据
      this.initialized = false; // 重置初始化状态
      this.init().catch(console.error);
    }
  }

  async pollData() {
    if (!this.lastFetchedTime) return;
    const currentTime = Date.now();
    await this.fetchHistoricalData(this.lastFetchedTime, currentTime);
    this.lastFetchedTime = currentTime;
  }

  // 添加计算24小时价格变化的方法
  private calculatePriceChange24h() {
    if (this.data.length === 0) return;
    
    const latestKline = this.data[this.data.length - 1];
    const currentPrice = latestKline.close;
    
    // 获取24小时前的时间戳（秒）
    const oneDayAgoTimestamp = Math.floor(Date.now() / 1000) - 24 * 60 * 60;
    
    // 找到最接近24小时前的数据点
    let closestIndex = 0;
    let minTimeDiff = Number.MAX_SAFE_INTEGER;
    
    for (let i = 0; i < this.data.length; i++) {
      const timeDiff = Math.abs(this.data[i].time - oneDayAgoTimestamp);
      if (timeDiff < minTimeDiff) {
        minTimeDiff = timeDiff;
        closestIndex = i;
      }
    }
    
    const price24hAgo = this.data[closestIndex].close;
    
    // 计算价格变化百分比
    if (price24hAgo > 0) {
      this.priceChange = ((currentPrice - price24hAgo) / price24hAgo) * 100;
    } else {
      this.priceChange = 0;
    }
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