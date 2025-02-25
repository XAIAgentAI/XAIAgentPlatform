'use client';

import { createChart, ColorType, IChartApi, DeepPartial, ChartOptions, CrosshairMode, TimeScaleOptions } from 'lightweight-charts';
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { TimeInterval, createTokenPriceManager, KLineData } from '@/hooks/useTokenPrice';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface CryptoChartProps {
  agent: any;
}

interface ChartData {
  klineData: KLineData[];
  currentPrice: number;
  priceChange: number;
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

const CryptoChart: React.FC<CryptoChartProps> = ({ agent }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chart = useRef<IChartApi | null>(null);
  const resizeObserver = useRef<ResizeObserver | null>(null);
  const candlestickSeries = useRef<any>(null);
  const lineSeries = useRef<any>(null);
  const volumeSeries = useRef<any>(null);
  const [selectedInterval, setSelectedInterval] = useState<TimeInterval>('1h');
  const [chartData, setChartData] = useState<ChartData>({
    klineData: [],
    currentPrice: 0,
    priceChange: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const priceManagerRef = useRef<ReturnType<typeof createTokenPriceManager> | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 添加格式化价格的辅助函数
  const formatPrice = (price: number): string => {
    if (price === 0) return '$0.00';

    // 计算小数点后连续0的个数
    const priceStr = Math.abs(price).toString();
    const match = priceStr.match(/^0\.0+/);
    const zeroCount = match ? match[0].length - 2 : 0;

    if (zeroCount >= 2) {
      // 使用统一的 0.{n}xxx 格式
      const absPrice = Math.abs(price);
      const digits = absPrice.toFixed(zeroCount + 3).slice(-3);
      return `$0.{${zeroCount}}${digits}`;
    } else if (price < 0.01) {
      // 对于小于0.01但大于0.00001的数，也使用统一格式
      const zeroCount = Math.floor(Math.log10(1 / price));
      const digits = price.toFixed(zeroCount + 3).slice(-3);
      return `$0.{${zeroCount}}${digits}`;
    } else {
      // 常规数字显示2位小数
      return `$${price.toFixed(2)}`;
    }
  };

  // 添加格式化坐标轴价格的函数
  const formatAxisPrice = (price: number): string => {
    if (price === 0) return '0.00';
    if (isNaN(price)) return '0.00';
    if (!isFinite(price)) return '0.00';

    // 计算小数点后连续0的个数
    const priceStr = Math.abs(price).toString();
    const match = priceStr.match(/^0\.0+/);
    const zeroCount = match ? match[0].length - 2 : 0;

    if (zeroCount >= 2) {
      // 使用统一的 0.{n}xxx 格式
      const absPrice = Math.abs(price);
      const digits = absPrice.toFixed(zeroCount + 3).slice(-3);
      return (price < 0 ? '-' : '') + `0.{${zeroCount}}${digits}`;
    } else if (price < 0.01 && price > 0) {
      // 对于小于0.01但大于0的数，使用统一格式
      const zeroCount = Math.floor(Math.log10(1 / price));
      const digits = price.toFixed(zeroCount + 3).slice(-3);
      return `0.{${zeroCount}}${digits}`;
    } else {
      // 常规数字显示2位小数
      return price.toFixed(2);
    }
  };

  // 添加格式化价格变化的辅助函数
  const formatPriceChange = (change: number): string => {
    const sign = change >= 0 ? '+' : '';
    if (Math.abs(change) < 0.01) {
      return `${sign}${change.toFixed(4)}%`;
    }
    return `${sign}${change.toFixed(2)}%`;
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
      // 十字线（crosshair）的时间显示是需要单独配置的
      localization: {
        timeFormatter: (time: number) => {
          const date = new Date(time * 1000);
          return date.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          });
        },
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
        tickMarkFormatter: (time: number) => {
          // 使用用户的本地时区设置
          const date = new Date(time * 1000);
          return date.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone // 自动获取用户时区
          });
        },
      } as DeepPartial<TimeScaleOptions>,
      rightPriceScale: {
        borderColor: colors.grid,
        scaleMargins: {
          top: 0.1,
          bottom: 0.2,
        },
        formatPrice: formatAxisPrice,
        autoScale: true,
        mode: 0,
        alignLabels: true,
        entireTextOnly: false,
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
  }, [isDarkMode]);

  // 初始化价格管理器
  useEffect(() => {
    const priceManager = createTokenPriceManager(agent.tokens, selectedInterval, agent.id);
    priceManagerRef.current = priceManager;

    setLoading(true);
    priceManager.init()
      .catch(err => {
        console.error('Failed to initialize price manager:', err);
        setError('Failed to load chart data');
      })
      .finally(() => setLoading(false));

    const unsubscribe = priceManager.subscribe((data) => {
      setChartData(data);
    });

    return () => {
      unsubscribe();
      priceManager.destroy();
      priceManagerRef.current = null;
    };
  }, [agent.tokens, selectedInterval, agent.id]);

  // 创建和更新图表
  useEffect(() => {
    if (!chartContainerRef.current || loading || error) return;

    const colors = isDarkMode ? CHART_COLORS.dark : CHART_COLORS.light;

    // 创建图表实例
    if (!chart.current) {
      chart.current = createChart(chartContainerRef.current, {
        ...chartOptions,
        width: chartContainerRef.current.clientWidth,
        height: 500,
      });

      // 添加价格线图系列
      lineSeries.current = chart.current.addLineSeries({
        color: colors.upColor,
        lineWidth: 2,
        lastPriceAnimation: 1,  // 添加最后价格的动画效果
        priceFormat: {
          type: 'custom',
          formatter: (price: number) => {
            if (price === 0) return '0.00';
            if (isNaN(price)) return '0.00';
            if (!isFinite(price)) return '0.00';

            const priceStr = Math.abs(price).toString();
            const match = priceStr.match(/^0\.0+/);
            const zeroCount = match ? match[0].length - 2 : 0;

            if (zeroCount >= 2) {
              // 使用统一的 0.{n}xxx 格式
              const absPrice = Math.abs(price);
              const digits = absPrice.toFixed(zeroCount + 3).slice(-3);
              return (price < 0 ? '-' : '') + `0.{${zeroCount}}${digits}`;
            } else if (price < 0.01 && price > 0) {
              // 对于小于0.01但大于0的数，使用统一格式
              const zeroCount = Math.floor(Math.log10(1 / price));
              const digits = price.toFixed(zeroCount + 3).slice(-3);
              return (price < 0 ? '-' : '') + `0.{${zeroCount}}${digits}`;
            }
            return price.toFixed(2);
          },
          minMove: 0.000000000001,
        },
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

            const priceStr = Math.abs(price).toString();
            const match = priceStr.match(/^0\.0+/);
            const zeroCount = match ? match[0].length - 2 : 0;

            if (zeroCount >= 2) {
              // 使用统一的 0.{n}xxx 格式
              const absPrice = Math.abs(price);
              const digits = absPrice.toFixed(zeroCount + 3).slice(-3);
              return (price < 0 ? '-' : '') + `0.{${zeroCount}}${digits}`;
            } else if (price < 0.01 && price > 0) {
              // 对于小于0.01但大于0的数，使用统一格式
              const zeroCount = Math.floor(Math.log10(1 / price));
              const digits = price.toFixed(zeroCount + 3).slice(-3);
              return (price < 0 ? '-' : '') + `0.{${zeroCount}}${digits}`;
            }
            return price.toFixed(2);
          },
          minMove: 0.000000000001,
        },
        visible: false, // 隐藏K线，只显示线图
      });

      // 添加成交量系列
      volumeSeries.current = chart.current.addHistogramSeries({
        color: colors.volume,
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: '',
      });

      // 添加图表交互事件
      chart.current.subscribeClick((param) => {
        if (param.time) {
          const dataPoint = chartData.klineData.find(d => d.time === param.time);
          if (dataPoint) {
            console.log('Clicked data point:', dataPoint);
          }
        }
      });

      // 添加十字线移动事件
      chart.current.subscribeCrosshairMove((param) => {
        if (param.time) {
          const dataPoint = chartData.klineData.find(d => d.time === param.time);
          if (dataPoint) {
            // 这里可以更新tooltip或其他UI元素
          }
        }
      });
    }

    // 更新数据
    if (!chartData.klineData.length || !chart.current || !lineSeries.current) {
      return;
    }

    console.log('Updating chart with new data:', {
      dataPoints: chartData.klineData.length,
      currentPrice: chartData.currentPrice,
      priceChange: chartData.priceChange
    });

    // 更新线图数据
    lineSeries.current.setData(
      chartData.klineData.map(item => ({
        time: item.time as any,
        value: item.close
      }))
    );

    // 更新K线数据
    candlestickSeries.current.setData(chartData.klineData);

    // // 更新成交量数据
    // volumeSeries.current.setData(
    //   chartData.klineData.map(item => ({
    //     time: item.time,
    //     value: item.volume,
    //     color: item.close >= item.open ? colors.upColor : colors.downColor,
    //   }))
    // );

    // 自动调整视图以显示最新数据
    const timeScale = chart.current.timeScale();
    const lastBar = chartData.klineData[chartData.klineData.length - 1];
    if (lastBar) {
      timeScale.scrollToPosition(5, false);
    }

    // 强制重新渲染
    chart.current.applyOptions(chartOptions);

    // 设置调整大小观察器
    resizeObserver.current = new ResizeObserver(entries => {
      if (entries.length === 0 || !chart.current) return;
      const { width } = entries[0].contentRect;
      chart.current.applyOptions({ width });
      chart.current.timeScale().fitContent();
    });

    resizeObserver.current.observe(chartContainerRef.current);

    // 在更新数据后添加自动调整范围的代码
    if (chartData.klineData.length > 0) {
      const prices = chartData.klineData.map(d => d.close);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const priceRange = maxPrice - minPrice;

      // 设置价格范围，添加较小的边距以放大波动
      const padding = priceRange * 0.05; // 使用5%的边距
      lineSeries.current.applyOptions({
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
      if (chart.current) {
        chart.current.remove();
        chart.current = null;
      }
      if (resizeObserver.current) {
        resizeObserver.current.disconnect();
      }
    };
  }, [chartData, loading, error, isDarkMode, chartOptions]);

  // 处理时间间隔变化
  const handleIntervalChange = useCallback((interval: TimeInterval) => {
    setSelectedInterval(interval);
  }, []);


  if (loading) {
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
            {formatPrice(chartData.currentPrice)}
          </span>
          <span className={cn(
            "text-sm font-medium",
            chartData.priceChange >= 0 ? "text-green-500" : "text-red-500"
          )}>
            {formatPriceChange(chartData.priceChange)}
          </span>
        </div>
        <div className="w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          <div className="flex gap-1 min-w-min">
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
          </div>
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