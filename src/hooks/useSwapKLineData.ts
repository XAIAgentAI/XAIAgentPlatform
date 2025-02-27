import { useState, useEffect, useRef } from 'react';
import { fetchSwapData, convertToKLineData } from '@/services/swapService';
import { KLineData as SwapKLineData } from '@/types/swap';
import { KLineData as ChartKLineData } from '@/hooks/useTokenPrice';

export interface SwapChartData {
  klineData: ChartKLineData[];
  currentPrice: number;
  priceChange: number;
  isLoading: boolean;
  error: string | null;
}

const POLLING_INTERVAL = 10000; // 10秒轮询一次

export const useSwapKLineData = () => {
  const [data, setData] = useState<SwapChartData>({
    klineData: [],
    currentPrice: 0,
    priceChange: 0,
    isLoading: true,
    error: null
  });

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const fetchKLineData = async () => {
    try {
      console.log('开始获取swap数据...');
      const swapData = await fetchSwapData();
      console.log('获取到的原始Swap数据:', {
        dataLength: swapData?.length || 0,
        firstItem: swapData?.[0],
        lastItem: swapData?.[swapData?.length - 1]
      });

      const rawKlineData = convertToKLineData(swapData);
      console.log('转换后的K线数据:', {
        dataLength: rawKlineData?.length || 0,
        firstItem: rawKlineData?.[0],
        lastItem: rawKlineData?.[rawKlineData?.length - 1]
      });

      // 转换为图表所需的KLineData格式
      const chartKlineData: ChartKLineData[] = rawKlineData.map(item => ({
        time: item.time,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume || 0 // 确保volume总是有值
      }));

      console.log('最终图表数据:', {
        dataLength: chartKlineData?.length || 0,
        firstItem: chartKlineData?.[0],
        lastItem: chartKlineData?.[chartKlineData?.length - 1]
      });

      // 计算当前价格和价格变化
      if (chartKlineData.length > 0) {
        const currentPrice = chartKlineData[chartKlineData.length - 1].close;
        const previousPrice = chartKlineData[chartKlineData.length - 2]?.close || chartKlineData[0].open;
        const priceChange = ((currentPrice - previousPrice) / previousPrice) * 100;

        console.log('计算得到的价格信息:', {
          currentPrice,
          previousPrice,
          priceChange
        });

        setData({
          klineData: chartKlineData,
          currentPrice,
          priceChange,
          isLoading: false,
          error: null
        });
      } else {
        console.warn('没有可用的K线数据');
        setData(prev => ({
          ...prev,
          isLoading: false,
          error: '没有可用的数据'
        }));
      }
    } catch (error) {
      console.error('获取数据时出错:', error);
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
    pollingRef.current = setInterval(fetchKLineData, POLLING_INTERVAL);
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
    console.log('useSwapKLineData hook 初始化');
    startPolling();

    // 清理函数
    return () => {
      stopPolling();
    };
  }, []);

  // 添加数据变化日志
  useEffect(() => {
    console.log('useSwapKLineData 当前状态:', data);
  }, [data]);

  return {
    ...data,
    refetch: fetchKLineData,
    startPolling,
    stopPolling
  };
}; 