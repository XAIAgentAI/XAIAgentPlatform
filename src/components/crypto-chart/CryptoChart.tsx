'use client';

import { createChart, ColorType, IChartApi, DeepPartial, ChartOptions, CrosshairMode, TimeScaleOptions } from 'lightweight-charts';
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { TimeInterval, KLineData } from '@/hooks/useTokenPrice';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface CryptoChartProps {
  agent: any;
  klineData: KLineData[];
  currentPrice: number;
  priceChange: number;
  isLoading?: boolean;
  error?: string | null;
  onIntervalChange?: (interval: TimeInterval) => void;
}

const TIME_INTERVALS: { label: string; value: TimeInterval }[] = [
  // { label: '1分钟', value: '1m' },
  // { label: '5分钟', value: '5m' },
  // { label: '15分钟', value: '15m' },
  { label: '30分钟', value: '30m' },
  { label: '1小时', value: '1h' },
  { label: '4小时', value: '4h' },
  { label: '1天', value: '1d' },
];

const CHART_COLORS = {
  light: {
    background: '#ffffff',
    text: '#374151',
    grid: '#e5e7eb',
    upColor: '#16a34a',
    downColor: '#dc2626',
    volume: '#9ca3af',
  },
  dark: {
    background: '#1a1a1a',
    text: '#d1d5db',
    grid: '#2d2d2d',
    upColor: '#22c55e',
    downColor: '#ef4444',
    volume: '#4b5563',
  },
};

const CryptoChart: React.FC<CryptoChartProps> = ({ 
  agent,
  klineData,
  currentPrice,
  priceChange,
  isLoading = false,
  error = null,
  onIntervalChange 
}) => {
  // 添加数据检查日志
  useEffect(() => {
    console.log('CryptoChart 组件收到的数据:', {
      klineData: klineData?.length || 0,
      currentPrice,
      priceChange,
      isLoading,
      error
    });
  }, [klineData, currentPrice, priceChange, isLoading, error]);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chart = useRef<IChartApi | null>(null);
  const resizeObserver = useRef<ResizeObserver | null>(null);
  const candlestickSeries = useRef<any>(null);
  const lineSeries = useRef<any>(null);
  const volumeSeries = useRef<any>(null);
  const [selectedInterval, setSelectedInterval] = useState<TimeInterval>('1h');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 添加格式化价格的辅助函数
  const formatPrice = (price: number | undefined): string => {
    if (price === undefined || price === null) return '$0.00';
    if (price === 0) return '$0.00';

    const absPrice = Math.abs(price);
    if (absPrice < 0.0001) {
      // 只有在非常小的数字时才使用 0.0{x}y 格式
      const priceStr = absPrice.toString();
      const match = priceStr.match(/^0\.0+/);
      const zeroCount = match ? match[0].length - 2 : 0;
      const lastDigit = priceStr.replace(/^0\.0+/, '')[0] || '0';
      return `$0.0{${zeroCount}}${lastDigit}`;
    } else if (absPrice < 1) {
      // 对于一般的小数，直接显示4位
      return `$${absPrice.toFixed(4)}`;
    }

    // 常规数字显示2位小数
    return `$${price.toFixed(2)}`;
  };

  // 添加格式化坐标轴价格的函数
  const formatAxisPrice = (price: number | undefined): string => {
    if (price === undefined || price === null) return '0.00';
    if (price === 0) return '0.00';
    if (isNaN(price)) return '0.00';
    if (!isFinite(price)) return '0.00';

    const absPrice = Math.abs(price);
    if (absPrice < 0.0001) {
      // 只有在非常小的数字时才使用 0.0{x}y 格式
      const priceStr = absPrice.toString();
      const match = priceStr.match(/^0\.0+/);
      const zeroCount = match ? match[0].length - 2 : 0;
      const lastDigit = priceStr.replace(/^0\.0+/, '')[0] || '0';
      return (price < 0 ? '-' : '') + `0.0{${zeroCount}}${lastDigit}`;
    } else if (absPrice < 1) {
      // 对于一般的小数，直接显示4位
      return (price < 0 ? '-' : '') + absPrice.toFixed(4);
    }

    // 常规数字显示2位小数
    return price.toFixed(2);
  };

  // 添加格式化价格变化的辅助函数
  const formatPriceChange = (change: number | undefined): string => {
    if (change === undefined || change === null) return '+0.00%';
    const sign = change >= 0 ? '+' : '';
    if (Math.abs(change) < 0.01) {
      return `${sign}${change.toFixed(4)}%`;
    }
    return `${sign}${change.toFixed(2)}%`;
  };

  // 添加时间格式化辅助函数
  const formatChartTime = (time: number, interval: TimeInterval): string => {
    const date = new Date(time * 1000);
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    switch (interval) {
      case '30m':
      case '1h':
        return date.toLocaleString(undefined, {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone
        });
      case '4h':
        return date.toLocaleString(undefined, {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          hour12: false,
          timeZone
        });
      case '1d':
        return date.toLocaleString(undefined, {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          timeZone
        });
      default:
        return date.toLocaleString(undefined, {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone
        });
    }
  };

  // 检测系统主题
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // 使用useMemo缓存图表选项
  const chartOptions = useMemo<DeepPartial<ChartOptions>>(() => {
    const colors = isDarkMode ? CHART_COLORS.dark : CHART_COLORS.light;
    return {
      layout: {
        background: { type: ColorType.Solid, color: colors.background },
        textColor: colors.text,
      },
      localization: {
        timeFormatter: (time: number) => formatChartTime(time, selectedInterval),
      },
      grid: {
        vertLines: { color: colors.grid },
        horzLines: { color: colors.grid },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          width: 1,
          color: '#6B7280',
          style: 0,
        },
        horzLine: {
          width: 1,
          color: '#6B7280',
          style: 0,
        },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: colors.grid,
        tickMarkFormatter: (time: number) => formatChartTime(time, selectedInterval),
      } as DeepPartial<TimeScaleOptions>,
      rightPriceScale: {
        borderColor: colors.grid,
        scaleMargins: {
          top: 0.1,
          bottom: 0.2,
        },
        formatPrice: (price: number) => {
          if (price === 0) return '0.0000';
          if (isNaN(price)) return '0.0000';
          if (!isFinite(price)) return '0.0000';

          const absPrice = Math.abs(price);
          // 检查是否需要使用0.0{x}y格式
          if (absPrice < 0.0001) {
            const priceStr = absPrice.toString();
            const match = priceStr.match(/^0\.0+/);
            const zeroCount = match ? match[0].length - 2 : 0;
            const lastDigit = priceStr.replace(/^0\.0+/, '')[0] || '0';
            return (price < 0 ? '-' : '') + `0.0{${zeroCount}}${lastDigit}`;
          }
          // 对于一般的小数，显示4位小数
          return price.toFixed(4);
        },
        autoScale: true,
        mode: 0,
        alignLabels: true,
        entireTextOnly: false,
        ticksVisible: true,
        borderVisible: true,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    };
  }, [isDarkMode, selectedInterval]);

  // 创建和更新图表
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const colors = isDarkMode ? CHART_COLORS.dark : CHART_COLORS.light;

    // 只在图表不存在时创建图表
    if (!chart.current) {
      chart.current = createChart(chartContainerRef.current, {
        ...chartOptions,
        width: chartContainerRef.current.clientWidth,
        height: 500,
      });

      // 添加K线数据系列
      candlestickSeries.current = chart.current.addCandlestickSeries({
        upColor: colors.upColor,
        downColor: colors.downColor,
        borderVisible: false,
        wickUpColor: colors.upColor,
        wickDownColor: colors.downColor,
        priceFormat: {
          type: 'custom',
          formatter: (price: number) => {
            if (price === 0) return '0.00';
            if (isNaN(price)) return '0.00';
            if (!isFinite(price)) return '0.00';

            const absPrice = Math.abs(price);
            if (absPrice < 0.0001) {
              const priceStr = absPrice.toString();
              const match = priceStr.match(/^0\.0+/);
              const zeroCount = match ? match[0].length - 2 : 0;
              const lastDigit = priceStr.replace(/^0\.0+/, '')[0] || '0';
              return (price < 0 ? '-' : '') + `0.0{${zeroCount}}${lastDigit}`;
            } else if (absPrice < 1) {
              return (price < 0 ? '-' : '') + absPrice.toFixed(4);
            }

            return price.toFixed(2);
          },
          minMove: 0.0001,
        },
        visible: true,
      });

      // 添加成交量系列
      volumeSeries.current = chart.current.addHistogramSeries({
        color: colors.volume,
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: 'volume',
      });

      // 设置成交量图表的位置
      chart.current.priceScale('volume').applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });

      // 设置调整大小观察器
      resizeObserver.current = new ResizeObserver(entries => {
        if (entries.length === 0 || !chart.current) return;
        const { width } = entries[0].contentRect;
        chart.current.applyOptions({ width });
        chart.current.timeScale().fitContent();
      });

      resizeObserver.current.observe(chartContainerRef.current);
    }

    // 更新数据
    if (!klineData.length || !chart.current) return;

    // 保存当前的时间范围
    const timeScale = chart.current.timeScale();
    const currentTimeRange = timeScale.getVisibleLogicalRange();

    // 更新K线数据
    candlestickSeries.current?.setData(klineData);

    // 更新成交量数据
    volumeSeries.current?.setData(
      klineData.map(item => ({
        time: item.time as any,
        value: item.volume,
        color: item.close >= item.open ? colors.upColor : colors.downColor,
      }))
    );

    // 只在首次加载数据时滚动到最新数据
    if (!currentTimeRange) {
      timeScale.fitContent();
    } else {
      // 恢复之前的视图位置
      timeScale.setVisibleLogicalRange(currentTimeRange);
    }

    // 更新价格范围
    if (klineData.length > 0) {
      const prices = klineData.map(d => d.close);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const priceRange = maxPrice - minPrice;
      const padding = priceRange * 0.01;

      candlestickSeries.current?.applyOptions({
        autoscaleInfoProvider: () => ({
          priceRange: {
            minValue: minPrice - padding,
            maxValue: maxPrice + padding,
          }
        })
      });
    }

    // 清理函数
    return () => {
      if (resizeObserver.current) {
        resizeObserver.current.disconnect();
      }
      // 不在每次数据更新时销毁图表，只在组件卸载时销毁
      if (chart.current && !chartContainerRef.current) {
        chart.current.remove();
        chart.current = null;
      }
    };
  }, [klineData, isDarkMode, chartOptions]);

  // 处理暗色模式变化
  useEffect(() => {
    if (chart.current) {
      chart.current.applyOptions(chartOptions);
    }
  }, [isDarkMode, chartOptions]);

  // 处理时间间隔变化
  const handleIntervalChange = useCallback((interval: TimeInterval) => {
    setSelectedInterval(interval);
    onIntervalChange?.(interval);
  }, [onIntervalChange]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-32" />
          <div className="flex gap-2">
            {TIME_INTERVALS.map((_, index) => (
              <Skeleton key={index} className="h-8 w-12" />
            ))}
          </div>
        </div>
        <Skeleton className="w-full h-[500px]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[500px] p-4 bg-background rounded-lg flex items-center justify-center">
        <div className="text-foreground">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">
            {formatPrice(currentPrice)}
          </span>
          <span className={cn(
            "text-sm font-medium",
            priceChange >= 0 ? "text-green-500" : "text-red-500"
          )}>
            {formatPriceChange(priceChange)}
          </span>
        </div>
        <div className="w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          {/* <div className="flex gap-1 min-w-min">
            {TIME_INTERVALS.map(({ label, value }) => (
              <Button
                key={value}
                variant={selectedInterval === value ? "primary" : "outline"}
                size="sm"
                className="min-w-[40px]"
                onClick={() => handleIntervalChange(value)}
              >
                {label}
              </Button>
            ))}
          </div> */}
        </div>
      </div>
      <div
        ref={chartContainerRef}
        className="w-full h-[500px] bg-background rounded-lg"
        style={{ cursor: 'crosshair' }}
      />
    </div>
  );
};

export default CryptoChart; 