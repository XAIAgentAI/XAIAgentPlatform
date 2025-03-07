import { useState, useEffect, useRef } from 'react';
import { fetchSwapData, convertToKLineData } from '@/services/swapService';
import { KLineData as SwapKLineData } from '@/types/swap';
import { KLineData as ChartKLineData, TimeInterval } from '@/hooks/useTokenPrice';

export interface SwapChartData {
  klineData: ChartKLineData[];
  currentPrice: number;
  priceChange: number;
  isLoading: boolean;
  error: string | null;
}

interface UseSwapKLineDataParams {
  interval: TimeInterval;
  targetToken: string;
  baseToken: string;
}

const POLLING_INTERVAL = 10000; // 10秒轮询一次

export const useSwapKLineData = ({ interval, targetToken, baseToken }: UseSwapKLineDataParams) => {
  const [data, setData] = useState<SwapChartData>({
    klineData: [],
    currentPrice: 0,
    priceChange: 0,
    isLoading: true,
    error: null
  });

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const retryCount = useRef<number>(0);

  const fetchKLineData = async ({ interval: newInterval }: { interval: TimeInterval } = { interval }) => {
    try {
      const swapData = await fetchSwapData({ 
        interval: newInterval, 
        targetToken,
        baseToken
      });

      const rawKlineData = convertToKLineData(swapData, newInterval);

      // 转换为图表所需的KLineData格式
      const chartKlineData: ChartKLineData[] = rawKlineData.map(item => ({
        time: item.time,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume || 0 // 确保volume总是有值
      }));

      // 计算当前价格和价格变化
      if (chartKlineData.length > 0) {
        // 重置重试计数器
        retryCount.current = 0;
        const currentPrice = chartKlineData[chartKlineData.length - 1].close;
        
        // 计算24小时价格变化
        const oneDayAgoTimestamp = Math.floor(Date.now() / 1000) - 24 * 60 * 60;
        
        // 找到最接近24小时前的数据点
        let closestIndex = 0;
        let minTimeDiff = Number.MAX_SAFE_INTEGER;
        
        for (let i = 0; i < chartKlineData.length; i++) {
          const timeDiff = Math.abs(chartKlineData[i].time - oneDayAgoTimestamp);
          if (timeDiff < minTimeDiff) {
            minTimeDiff = timeDiff;
            closestIndex = i;
          }
        }
        
        const price24hAgo = chartKlineData[closestIndex].close;
        
        // 计算价格变化百分比
        const priceChange = price24hAgo > 0 
          ? ((currentPrice - price24hAgo) / price24hAgo) * 100 
          : 0;
          
        setData({
          klineData: chartKlineData,
          currentPrice,
          priceChange,
          isLoading: false,
          error: null
        });
      } else {
        // 当没有数据时，保持 loading 状态，并保留之前的数据
        retryCount.current += 1;
        setData(prev => ({
          ...prev,
          isLoading: true,
          error: null
        }));

        // 如果连续3次没有数据，则停止轮询
        if (retryCount.current >= 3) {
          stopPolling();
          setData(prev => ({
            ...prev,
            isLoading: false,
            error: '暂无交易数据'
          }));
        }
      }
    } catch (error) {
      console.error('获取K线数据失败', error);
      // 发生错误时，保留之前的数据
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : '获取数据失败'
      }));
      
      // 如果是网络错误，不要立即停止轮询
      if (!(error instanceof Error && error.message.includes('network'))) {
        stopPolling();
      }
    }
  };

  // 启动轮询
  const startPolling = () => {
    // 清除现有的轮询
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    // 重置重试计数器
    retryCount.current = 0;

    // 立即执行一次
    fetchKLineData();

    // 设置新的轮询
    pollingRef.current = setInterval(() => fetchKLineData(), POLLING_INTERVAL);
  };

  // 停止轮询
  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  // 初始化和清理
  useEffect(() => {
    startPolling();

    // 清理函数
    return () => {
      stopPolling();
    };
  }, [interval, targetToken, baseToken]); // 更新依赖项

  return {
    ...data,
    refetch: fetchKLineData,
    startPolling,
    stopPolling
  };
}; 