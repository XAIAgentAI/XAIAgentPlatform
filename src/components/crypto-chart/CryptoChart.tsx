'use client';

import { createChart, ColorType, IChartApi, DeepPartial, ChartOptions, CrosshairMode, TimeScaleOptions, LineWidth } from 'lightweight-charts';
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { TimeInterval, KLineData } from '@/hooks/useTokenPrice';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslations } from 'next-intl';

interface CryptoChartProps {
  agent: any;
  klineData: KLineData[];
  currentPrice: number;
  priceChange: number;
  isLoading?: boolean;
  error?: string | null;
  onIntervalChange?: (interval: TimeInterval) => void;
  onRetry?: () => void;
  dbcPriceUsd: number;
}

const TIME_INTERVALS: { label: string; value: TimeInterval }[] = [
  // { label: '1分钟', value: '1m' },
  // { label: '5分钟', value: '5m' },
  // { label: '15分钟', value: '15m' },
  { label: '30分钟', value: '30m' },
  { label: '1小时', value: '1h' },
  { label: '4小时', value: '4h' },
  { label: '1天', value: '1d' },
  { label: '1周', value: '1w' },
];

const CHART_COLORS = {
  light: {
    background: '#ffffff',
    text: '#374151',
    grid: '#e5e7eb',
    upColor: '#16a34a',
    downColor: '#dc2626',
    volume: '#9ca3af',
    separator: 'rgba(55, 65, 81, 0.4)',
  },
  dark: {
    background: '#1a1a1a',
    text: '#d1d5db',
    grid: '#2d2d2d',
    upColor: '#22c55e',
    downColor: '#ef4444',
    volume: '#4b5563',
    separator: 'rgba(209, 213, 219, 0.4)',
  },
};

const CryptoChart: React.FC<CryptoChartProps> = ({
  agent,
  klineData,
  currentPrice,
  priceChange,
  isLoading = false,
  error = null,
  onIntervalChange,
  onRetry,
  dbcPriceUsd
}) => {
  const t = useTranslations('cryptoChart');
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chart = useRef<IChartApi | null>(null);
  const resizeObserver = useRef<ResizeObserver | null>(null);
  const candlestickSeries = useRef<any>(null);
  const lineSeries = useRef<any>(null);
  const volumeSeries = useRef<any>(null);
  const separatorSeriesRef = useRef<any>(null);
  const [selectedInterval, setSelectedInterval] = useState<TimeInterval>('1h');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);

  // 添加格式化价格的辅助函数
  const formatPrice = (price: number | undefined, decimals: number = 5): { value: string; pair: string } => {
    const pair = 'XAA/DBC';
    if (price === undefined || price === null) return { value: `0.${'0'.repeat(decimals)}`, pair };
    if (price === 0) return { value: `0.${'0'.repeat(decimals)}`, pair };

    const absPrice = Math.abs(price);
    if (absPrice < Math.pow(10, -decimals)) {
      // 只有在非常小的数字时才使用 0.0{x}y 格式
      const priceStr = absPrice.toString();
      const match = priceStr.match(/^0\.0+/);
      const zeroCount = match ? match[0].length - 2 : 0;
      const lastDigit = priceStr.replace(/^0\.0+/, '')[0] || '0';
      return { value: `0.0{${zeroCount}}${lastDigit}`, pair };
    }
    // 根据指定的精度显示小数位数
    return { value: absPrice.toFixed(decimals), pair };
  };

  // 添加格式化坐标轴价格的函数
  const formatAxisPrice = (price: number | undefined): string => {
    if (price === undefined || price === null) return '0.00000';
    if (price === 0) return '0.00000';
    if (isNaN(price)) return '0.00000';
    if (!isFinite(price)) return '0.00000';

    const absPrice = Math.abs(price);
    if (absPrice < 0.00001) {
      // 只有在非常小的数字时才使用 0.0{x}y 格式
      const priceStr = absPrice.toString();
      const match = priceStr.match(/^0\.0+/);
      const zeroCount = match ? match[0].length - 2 : 0;
      const lastDigit = priceStr.replace(/^0\.0+/, '')[0] || '0';
      return (price < 0 ? '-' : '') + `0.0{${zeroCount}}${lastDigit}`;
    }
    // 所有数字都显示5位小数
    return (price < 0 ? '-' : '') + absPrice.toFixed(5);
  };

  // 添加格式化价格变化的辅助函数
  const formatPriceChange = (change: number | undefined): string => {
    if (change === undefined || change === null) return '+0.00%';
    const sign = change >= 0 ? '+' : '';
    
    // 确保格式与首页一致，始终保留两位小数
    if (Math.abs(change) < 0.01) {
      return `${sign}${change.toFixed(2)}%`;
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
      case '1w':
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

    // 根据不同的时间间隔设置合适的时间刻度
    const getTimeScaleOptions = (interval: TimeInterval): DeepPartial<TimeScaleOptions> => {
      const baseOptions = {
        timeVisible: true,
        secondsVisible: false,
        borderColor: colors.grid,
        tickMarkFormatter: (time: number) => formatChartTime(time, interval),
      };

      switch (interval) {
        case '30m':
          return {
            ...baseOptions,
            timeVisible: true,
            rightOffset: 12,
            barSpacing: 6,
            minBarSpacing: 4,
            fixLeftEdge: true,
            fixRightEdge: true,
          };
        case '1h':
          return {
            ...baseOptions,
            timeVisible: true,
            rightOffset: 12,
            barSpacing: 8,
            minBarSpacing: 6,
            fixLeftEdge: true,
            fixRightEdge: true,
          };
        case '4h':
          return {
            ...baseOptions,
            timeVisible: true,
            rightOffset: 12,
            barSpacing: 12,
            minBarSpacing: 8,
            fixLeftEdge: true,
            fixRightEdge: true,
          };
        case '1d':
          return {
            ...baseOptions,
            timeVisible: true,
            rightOffset: 12,
            barSpacing: 16,
            minBarSpacing: 12,
            fixLeftEdge: true,
            fixRightEdge: true,
          };
        case '1w':
          return {
            ...baseOptions,
            timeVisible: true,
            rightOffset: 12,
            barSpacing: 20,
            minBarSpacing: 16,
            fixLeftEdge: true,
            fixRightEdge: true,
          };
        default:
          return baseOptions;
      }
    };

    return {
      layout: {
        background: { type: ColorType.Solid, color: colors.background },
        textColor: colors.text,
        fontSize: 12,
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
      timeScale: getTimeScaleOptions(selectedInterval),
      rightPriceScale: {
        borderColor: colors.grid,
        scaleMargins: {
          top: 0.1,
          bottom: 0.2,
        },
        formatPrice: (price: number) => {
          if (price === 0) return '0.00000';
          if (isNaN(price)) return '0.00000';
          if (!isFinite(price)) return '0.00000';

          const absPrice = Math.abs(price);
          if (absPrice < 0.00001) {
            const priceStr = absPrice.toString();
            const match = priceStr.match(/^0\.0+/);
            const zeroCount = match ? match[0].length - 2 : 0;
            const lastDigit = priceStr.replace(/^0\.0+/, '')[0] || '0';
            return (price < 0 ? '-' : '') + `0.0{${zeroCount}}${lastDigit}`;
          }
          return price.toFixed(5);
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
          formatter: formatAxisPrice,
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

      // 设置成交量图表的位置和样式
      chart.current.priceScale('volume').applyOptions({
        scaleMargins: {
          top: 0.85,
          bottom: 0,
        },
        borderVisible: false,
        visible: false, // 隐藏成交量的刻度
      });

      // 添加分隔线系列和标签
      separatorSeriesRef.current = chart.current.addLineSeries({
        color: colors.separator,
        lineWidth: 1 as DeepPartial<LineWidth>,
        lineStyle: 0,
        lastValueVisible: false,
        priceLineVisible: false,
        crosshairMarkerVisible: false,
        title: t('volume'),
        priceScaleId: 'volume',
        baseLineVisible: false,
      });

      // 设置标签样式
      separatorSeriesRef.current.applyOptions({
        title: `${t('priceArea')} ↑ | ${t('volumeArea')} ↓`,
        titleVisible: true,
        lastValueVisible: false,
      });

      // 设置主图表区域样式
      chart.current.applyOptions({
        layout: {
          background: {
            type: ColorType.Solid,
            color: colors.background
          },
        },
        grid: {
          vertLines: { color: colors.grid },
          horzLines: { color: colors.grid },
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
        color: item.close >= item.open
          ? `${colors.upColor}99`
          : `${colors.downColor}99`
      }))
    );

    // 更新分隔区域
    if (klineData.length > 0) {
      const firstTime = klineData[0].time;
      const lastTime = klineData[klineData.length - 1].time;
      const maxVolume = Math.max(...klineData.map(d => d.volume || 0));
      const volumeHeight = maxVolume * 0.7;

      // 创建一个渐变色的分隔区域
      const separator = Array.from({ length: klineData.length }, (_, i) => ({
        time: klineData[i].time as any,
        value: volumeHeight,
      }));

      separatorSeriesRef.current?.setData(separator);
    }

    // 调整时间范围
    const fitContent = () => {
      if (chart.current) {
        // 设置合适的时间范围
        const timeScale = chart.current.timeScale();

        // 根据不同的时间间隔设置不同的可见范围
        let visibleRange = 30; // 默认显示30个数据点
        switch (selectedInterval) {
          case '30m':
            visibleRange = 96; // 显示48小时的数据
            break;
          case '1h':
            visibleRange = 72; // 显示72小时的数据
            break;
          case '4h':
            visibleRange = 30; // 显示5天的数据
            break;
          case '1d':
            visibleRange = 30; // 显示30天的数据
            break;
          case '1w':
            visibleRange = 52; // 显示52周的数据
            break;
        }

        // 计算要显示的数据范围
        const dataLength = klineData.length;
        if (dataLength > 0) {
          const to = dataLength - 1;
          const from = Math.max(0, to - visibleRange + 1);
          timeScale.setVisibleLogicalRange({
            from,
            to: to + 5, // 多显示一些空白区域
          });
        }
      }
    };

    // 在数据更新后调整显示范围
    setTimeout(fitContent, 0);

    // 清理函数
    return () => {
      if (resizeObserver.current) {
        resizeObserver.current.disconnect();
      }
      if (chart.current && !chartContainerRef.current) {
        chart.current.remove();
        chart.current = null;
      }
    };
  }, [klineData, isDarkMode, chartOptions, t, selectedInterval]);

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

  // 添加错误恢复机制
  useEffect(() => {
    if (error) {
      setChartError(error);
      // 清除现有图表
      if (chart.current) {
        chart.current.remove();
        chart.current = null;
      }
    } else {
      setChartError(null);
    }
  }, [error]);

  // 处理图表重试
  const handleRetry = useCallback(() => {
    setChartError(null);
    if (onRetry) {
      onRetry();
    }
  }, [onRetry]);

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

  if (!klineData.length) {
    return (
      <div className="w-full h-[500px] flex flex-col items-center justify-center space-y-4 bg-background/50 rounded-lg border border-border">
        <div className="text-muted-foreground text-center">
          <p>{t('noData')}</p>
        </div>
      </div>
    );
  }

  if (error || chartError) {
    return (
      <div className="w-full h-[500px] flex flex-col items-center justify-center space-y-4 bg-background/50 rounded-lg border border-border">
        <div className="text-destructive text-center">
          <p className="mb-2">{error || chartError}</p>
          <Button
            variant="outline"
            onClick={handleRetry}
            className="hover:bg-destructive hover:text-destructive-foreground"
          >
            {t('retry')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-2 items-baseline">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold tracking-tight">
              {formatPrice(currentPrice).value}
            </span>
            <span className="text-xl font-medium text-muted-foreground">
              {agent.symbol + '/' + (agent.symbol === 'XAA' ? 'DBC' : 'XAA')}
            </span>
          </div>
          <div className={cn(
            "text-sm font-medium flex items-center gap-1",
            priceChange >= 0 ? "text-green-500" : "text-red-500"
          )}>
            {priceChange >= 0 ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M12.577 4.878a.75.75 0 01.919-.53l4.78 1.281a.75.75 0 01.531.919l-1.281 4.78a.75.75 0 01-1.449-.387l.81-3.022a19.407 19.407 0 00-5.594 5.203.75.75 0 01-1.139.093L7 10.06l-4.72 4.72a.75.75 0 01-1.06-1.061l5.25-5.25a.75.75 0 011.06 0l3.074 3.073a20.923 20.923 0 015.545-4.931l-3.042-.815a.75.75 0 01-.53-.919z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M1.22 5.222a.75.75 0 011.06 0L7 9.942l3.768-3.769a.75.75 0 011.113.058 20.908 20.908 0 013.813 7.254l1.574-2.727a.75.75 0 011.3.75l-2.475 4.286a.75.75 0 01-1.025.275l-4.287-2.475a.75.75 0 01.75-1.3l2.71 1.565a19.422 19.422 0 00-3.013-6.024L7.53 11.533a.75.75 0 01-1.06 0l-5.25-5.25a.75.75 0 010-1.06z" clipRule="evenodd" />
              </svg>
            )}
            <span>{formatPriceChange(priceChange)}</span>
            <span className="text-xs text-muted-foreground">24h</span>
          </div>
        </div>
        <div className="w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          <div className="flex gap-1 min-w-min">
            {TIME_INTERVALS.map(({ label, value }) => (
              <Button
                key={value}
                variant={selectedInterval === value ? "primary" : "outline"}
                size="sm"
                className={cn(
                  "min-w-[40px] transition-all duration-200",
                  selectedInterval === value && "shadow-md"
                )}
                onClick={() => handleIntervalChange(value)}
              >
                {t(`timeIntervals.${value}`)}
              </Button>
            ))}
          </div>
        </div>
      </div>
      <div
        ref={chartContainerRef}
        className={cn(
          "w-full h-[500px] bg-background rounded-lg",
          "transition-opacity duration-200",
          (!klineData.length || isLoading) && "opacity-50"
        )}
        style={{ cursor: 'crosshair' }}
      />
    </div>
  );
};

export default CryptoChart; 