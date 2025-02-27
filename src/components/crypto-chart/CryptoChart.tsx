'use client';

import { createChart, ColorType } from 'lightweight-charts';
import React, { useEffect, useRef } from 'react';

const CryptoChart: React.FC<{ agent: any }> = ({ agent }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chart = useRef<any>(null);
  const resizeObserver = useRef<any>(null);

  // Get current theme colors
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

    // Create chart instance
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
    });

    // Add candlestick data series
    const candlestickSeries = chart.current.addCandlestickSeries({
      upColor: upColor,
      downColor: downColor,
      borderVisible: false,
      wickUpColor: upColor,
      wickDownColor: downColor,
    });

    // Mock data
    const data = [
      { time: '2024-01-17', open: 0, high: 0, low: 0, close: 0 },
      { time: '2024-01-18', open: 0, high: 0, low: 0, close: 0 },
    ];

    candlestickSeries.setData(data);

    // Add volume chart
    const volumeSeries = chart.current.addHistogramSeries({
      color: upColor,
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // Display below the main chart
    });

    const volumeData = [
      { time: '2024-01-17', value: 0, color: upColor },
      { time: '2024-01-18', value: 0, color: downColor },
    ];

    volumeSeries.setData(volumeData);

    // Monitor theme changes
    const observer = new MutationObserver(() => {
      if (!chart.current) return;
      try {
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
      } catch (error) {
        console.error('Error updating chart theme:', error);
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    // Handle responsiveness
    const handleResize = (entries: ResizeObserverEntry[]) => {
      if (!chart.current || entries.length === 0 || !entries[0].contentRect) return;
      try {
        const { width, height } = entries[0].contentRect;
        chart.current.applyOptions({ width, height });
      } catch (error) {
        console.error('Error resizing chart:', error);
      }
    };

    resizeObserver.current = new ResizeObserver(handleResize);
    resizeObserver.current.observe(chartContainerRef.current);

    // Cleanup function
    return () => {
      observer.disconnect();
      
      if (resizeObserver.current && chartContainerRef.current) {
        try {
          resizeObserver.current.unobserve(chartContainerRef.current);
          resizeObserver.current.disconnect();
        } catch (error) {
          console.error('Error cleaning up resize observer:', error);
        }
      }
      
      if (chart.current) {
        try {
          chart.current.remove();
          chart.current = null;
        } catch (error) {
          console.error('Error removing chart:', error);
        }
      }
    };
  }, []);

  return (
    <div className="w-full h-[400px] p-4 bg-chart-background rounded-lg">
      <div className="text-foreground mb-4">
        <h2 className="text-xl font-bold">{agent.symbol}/USDT</h2>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-chart-down">0.0000</span>
          <span className="text-sm text-chart-down">0.00%</span>
        </div>
      </div>
      <div ref={chartContainerRef} className="w-full h-[300px]" />
    </div>
  );
};

export default CryptoChart; 