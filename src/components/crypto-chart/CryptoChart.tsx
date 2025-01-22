'use client';

import { createChart, ColorType } from 'lightweight-charts';
import React, { useEffect, useRef } from 'react';

const CryptoChart: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chart = useRef<any>(null);
  const resizeObserver = useRef<any>(null);

  // 获取当前主题下的实际颜色值
  const getThemeColor = (cssVar: string) => {
    if (typeof window === 'undefined') return '';
    return getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
  };

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // 获取当前主题的颜色
    const backgroundColor = getThemeColor('--chart-background');
    const textColor = getThemeColor('--chart-text');
    const gridColor = getThemeColor('--chart-grid');
    const upColor = getThemeColor('--chart-up');
    const downColor = getThemeColor('--chart-down');

    // 创建图表实例
    chart.current = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor: textColor,
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
    //   watermark: {
    //     visible: true,
    //     text: 'AIXBT',
    //     fontSize: 24,
    //     color: 'rgba(255, 255, 255, 0.1)',
    //     fontFamily: 'system-ui',
    //   },
    });

    // 添加K线数据系列
    const candlestickSeries = chart.current.addCandlestickSeries({
      upColor: upColor,
      downColor: downColor,
      borderVisible: false,
      wickUpColor: upColor,
      wickDownColor: downColor,
    });

    // 模拟数据
    const data = [
      { time: '2024-01-17', open: 0.8, high: 0.85, low: 0.79, close: 0.82 },
      { time: '2024-01-18', open: 0.82, high: 0.83, low: 0.64, close: 0.64 },
      // 可以添加更多数据点
    ];

    candlestickSeries.setData(data);

    // 添加成交量图表
    const volumeSeries = chart.current.addHistogramSeries({
      color: upColor,
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // 在主图表下方显示
    });

    const volumeData = [
      { time: '2024-01-17', value: 200000, color: upColor },
      { time: '2024-01-18', value: 150000, color: downColor },
      // 可以添加更多数据点
    ];

    volumeSeries.setData(volumeData);

    // 监听主题变化
    const observer = new MutationObserver(() => {
      if (!chart.current) return;
      
      const newBackgroundColor = getThemeColor('--chart-background');
      const newTextColor = getThemeColor('--chart-text');
      const newGridColor = getThemeColor('--chart-grid');
      
      chart.current.applyOptions({
        layout: {
          background: { type: ColorType.Solid, color: newBackgroundColor },
          textColor: newTextColor,
        },
        grid: {
          vertLines: { color: newGridColor },
          horzLines: { color: newGridColor },
        },
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    // 响应式处理
    resizeObserver.current = new ResizeObserver(entries => {
      if (entries.length === 0 || !entries[0].contentRect) return;
      const { width, height } = entries[0].contentRect;
      chart.current.applyOptions({ width, height });
    });

    resizeObserver.current.observe(chartContainerRef.current);

    return () => {
      if (chart.current) {
        chart.current.remove();
      }
      if (resizeObserver.current && chartContainerRef.current) {
        resizeObserver.current.unobserve(chartContainerRef.current);
      }
      observer.disconnect();
    };
  }, []);

  return (
    <div className="w-full h-[600px] p-4 bg-chart-background rounded-lg">
      <div className="text-foreground mb-4">
        <h2 className="text-xl font-bold">AIXBT/USDT</h2>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-chart-down">0.6442</span>
          <span className="text-sm text-chart-down">-1.95%</span>
        </div>
      </div>
      <div ref={chartContainerRef} className="w-full h-[500px]" />
    </div>
  );
};

export default CryptoChart; 