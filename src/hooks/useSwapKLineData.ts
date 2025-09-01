import { useState, useEffect, useRef } from 'react';
import { fetchSwapData, convertToKLineData, SUBGRAPH_URL, getBatchTokenPrices } from '@/services/swapService';
import { KLineData as SwapKLineData, SwapData } from '@/types/swap';
import { KLineData as ChartKLineData, TimeInterval } from '@/hooks/useTokenPrice';
import { calculatePriceChange, find24hAgoPrice } from '@/lib/utils';

export interface SwapChartData {
  klineData: ChartKLineData[];
  currentPrice: number;
  priceChange: number;
  isLoading: boolean;
  error: string | null;
  loadMore: () => Promise<void>;
  refetch: (params?: { interval?: TimeInterval; resetData?: boolean }) => Promise<void>;
}

interface UseSwapKLineDataParams {
  symbol: string;
  interval: TimeInterval;
  targetToken: string;
  baseToken: string;
}

const POLLING_INTERVAL = 10000; // 10秒轮询一次

export const useSwapKLineData = ({ symbol, interval, targetToken, baseToken }: UseSwapKLineDataParams) => {
  const [data, setData] = useState<SwapChartData>({
    klineData: [],
    currentPrice: 0,
    priceChange: 0,
    isLoading: true,
    error: null,
    loadMore: async () => {},
    refetch: async (params) => {
      await fetchKLineData(params);
    }
  });

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const retryCount = useRef<number>(0);
  const lastFetchedTimeRef = useRef<number>(0);
  const currentIntervalRef = useRef<TimeInterval>(interval);
  const firstSwapTimeRef = useRef<number | null>(null);

  // 停止轮询
  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  // 获取第一笔交易的时间
  const fetchFirstSwapTime = async () => {
    if (firstSwapTimeRef.current) return firstSwapTimeRef.current;

    try {
      const firstSwapQuery = `
        query GetFirstSwap($targetToken: String!, $baseToken: String!) {
          swaps(
            first: 1,
            orderBy: timestamp,
            orderDirection: asc,
            where: {
              and: [
                {
                  or: [
                    { token0: $targetToken },
                    { token1: $targetToken }
                  ]
                },
                {
                  or: [
                    { token0: $baseToken },
                    { token1: $baseToken }
                  ]
                }
              ]
            }
          ) {
            timestamp
          }
        }
      `;

      const response = await fetch(SUBGRAPH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: firstSwapQuery,
          variables: {
            targetToken: targetToken.toLowerCase(),
            baseToken: baseToken.toLowerCase(),
          }
        }),
      });

      const data = await response.json();
      const timestamp = data.data.swaps[0]?.timestamp;
      
      if (timestamp) {
        firstSwapTimeRef.current = parseInt(timestamp);
        return firstSwapTimeRef.current;
      }
      
      return Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60; // 默认30天
    } catch (error) {
      console.error('获取首笔交易时间失败:', error);
      return Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
    }
  };

  const fetchKLineData = async ({ interval: newInterval, resetData = false }: { interval?: TimeInterval; resetData?: boolean } = {}) => {
    try {
      const now = Math.floor(Date.now() / 1000);
      let fromTime: number;
      
      if (resetData) {
        // 获取第一笔交易时间
        const firstSwapTime = await fetchFirstSwapTime();
        
        // 根据不同的时间间隔设置初始显示范围
        const timeRange = (() => {
          switch (newInterval || interval) {
            case '30m': return 7 * 24 * 60 * 60; // 7天
            case '1h': return 14 * 24 * 60 * 60; // 14天
            case '4h': return 30 * 24 * 60 * 60; // 30天
            case '1d': return 90 * 24 * 60 * 60; // 90天
            case '1w': return 180 * 24 * 60 * 60; // 180天
            default: return 7 * 24 * 60 * 60;
          }
        })();

        // 使用较大的时间范围预加载数据
        fromTime = Math.max(firstSwapTime, now - timeRange * 2);
        lastFetchedTimeRef.current = 0;
        
        setData(prev => ({
          ...prev,
          klineData: [],
          isLoading: true
        }));
      } else {
        fromTime = lastFetchedTimeRef.current || (now - 24 * 60 * 60);
      }

      const swapData = await fetchSwapData({ 
        interval: newInterval || interval, 
        targetToken,
        baseToken,
        from: fromTime,
        to: now
      });

      const tokenSwapDatas = await getBatchTokenPrices([{
        symbol: symbol,
        address: targetToken
      }]);
      console.log("tokenSwapDatas", tokenSwapDatas, symbol);
      const tokenSwapInfo = tokenSwapDatas[symbol];
      console.log("tokenSwapInfo", tokenSwapInfo);
      const priceChange = tokenSwapInfo.priceChange24h || 0;


      // const currentPrice = tokenSwapDatas[targetToken].usdPrice || 0;

      const rawKlineData = convertToKLineData(swapData, newInterval || interval, targetToken, baseToken);

      // 转换为图表所需的KLineData格式
      const newChartKlineData: ChartKLineData[] = rawKlineData.map(item => ({
        time: item.time,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume || 0
      }));

      if (newChartKlineData.length > 0) {
        retryCount.current = 0;
        lastFetchedTimeRef.current = now;

        setData(prev => {
          const dataMap = new Map(prev.klineData.map(item => [item.time, item]));
          
          // 添加新数据
          newChartKlineData.forEach(item => {
            dataMap.set(item.time, item);
          });

          const mergedData = Array.from(dataMap.values()).sort((a, b) => a.time - b.time);
          const currentPrice = newChartKlineData[newChartKlineData.length - 1].close;
          // const price24hAgo = priceChange;
          // const priceChange = calculatePriceChange(currentPrice, price24hAgo);

          return {
            ...prev,
            klineData: mergedData,
            currentPrice,
            priceChange,
            isLoading: false,
            error: null
          };
        });
      } else {
        retryCount.current += 1;
        if (retryCount.current >= 3) {
          stopPolling();
          setData(prev => ({
            ...prev,
            isLoading: false,
            error: prev.klineData.length === 0 ? '暂无交易数据' : null
          }));
        }
      }
    } catch (error) {
      console.error('获取K线数据失败', error);
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : '获取数据失败'
      }));
    }
  };

  const loadMore = async () => {
    if (!data.klineData.length) return;

    try {
      const earliestTime = Math.min(...data.klineData.map(item => item.time));
      const firstSwapTime = await fetchFirstSwapTime();
      
      // 如果已经加载到第一笔交易，就不再加载
      if (earliestTime <= firstSwapTime) return;

      // 获取更多历史数据
      const swapData = await fetchSwapData({ 
        interval, 
        targetToken,
        baseToken,
        from: firstSwapTime,
        to: earliestTime
      });

      const rawKlineData = convertToKLineData(swapData, interval, targetToken, baseToken);

      if (rawKlineData.length === 0) return;

      const newChartKlineData: ChartKLineData[] = rawKlineData.map(item => ({
        time: item.time,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume || 0
      }));

      setData(prev => {
        const dataMap = new Map(prev.klineData.map(item => [item.time, item]));
        
        newChartKlineData.forEach(item => {
          if (!dataMap.has(item.time)) {
            dataMap.set(item.time, item);
          }
        });

        return {
          ...prev,
          klineData: Array.from(dataMap.values()).sort((a, b) => a.time - b.time)
        };
      });
    } catch (error) {
      console.error('加载更多历史数据失败:', error);
    }
  };

  // 监听时间间隔变化
  useEffect(() => {
    if (currentIntervalRef.current !== interval) {
      currentIntervalRef.current = interval;
      fetchKLineData({ interval, resetData: true });
    }
  }, [interval]);

  // 启动轮询
  useEffect(() => {
    if (data.klineData.length === 0) {
      fetchKLineData({ resetData: true });
    }

    const startPolling = () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
      pollingRef.current = setInterval(() => fetchKLineData(), POLLING_INTERVAL);
    };

    startPolling();

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [interval, targetToken, baseToken]);

  return {
    ...data,
    refetch: async (params?: { interval?: TimeInterval; resetData?: boolean }) => {
      await fetchKLineData(params);
    },
    loadMore
  };
}; 