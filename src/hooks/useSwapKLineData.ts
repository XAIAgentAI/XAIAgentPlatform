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
  tokenAddress: string;
}

const POLLING_INTERVAL = 10000; // 10秒轮询一次

export const useSwapKLineData = ({ interval, tokenAddress }: UseSwapKLineDataParams) => {
  const [data, setData] = useState<SwapChartData>({
    klineData: [],
    currentPrice: 0,
    priceChange: 0,
    isLoading: true,
    error: null
  });

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const fetchKLineData = async ({ interval: newInterval }: { interval: TimeInterval } = { interval }) => {
    try {
      const swapData = await fetchSwapData({ interval: newInterval, tokenAddress });

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
        const currentPrice = chartKlineData[chartKlineData.length - 1].close;
        const previousPrice = chartKlineData[chartKlineData.length - 2]?.close || chartKlineData[0].open;
        const priceChange = ((currentPrice - previousPrice) / previousPrice) * 100;
        setData({
          klineData: chartKlineData,
          currentPrice,
          priceChange,
          isLoading: false,
          error: null
        });
      } else {
        setData(prev => ({
          ...prev,
          isLoading: false,
          error: '没有可用的数据'
        }));
      }
    } catch (error) {
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : '获取数据失败'
      }));
    }
  };

  // 启动轮询
  const startPolling = () => {
    // 清除现有的轮询
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

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
  }, [interval, tokenAddress]); // 添加依赖项

  return {
    ...data,
    refetch: fetchKLineData,
    startPolling,
    stopPolling
  };
}; 