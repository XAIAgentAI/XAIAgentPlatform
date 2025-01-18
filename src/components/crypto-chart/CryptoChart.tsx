'use client';

import { createChart, ColorType } from 'lightweight-charts';
import React, { useEffect, useRef } from 'react';

const CryptoChart: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chart = useRef<any>(null);
  const resizeObserver = useRef<any>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // 创建图表实例
    chart.current = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#1B2028' },
        textColor: '#DDD',
      },
      grid: {
        vertLines: { color: '#2B2B43' },
        horzLines: { color: '#2B2B43' },
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
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
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
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // 在主图表下方显示
    });

    const volumeData = [
      { time: '2024-01-17', value: 200000, color: '#26a69a' },
      { time: '2024-01-18', value: 150000, color: '#ef5350' },
      // 可以添加更多数据点
    ];

    volumeSeries.setData(volumeData);

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
    };
  }, []);

  return (
    <div className="w-full h-[600px] p-4 bg-[#1B2028] rounded-lg">
      <div className="text-white mb-4">
        <h2 className="text-xl font-bold">AIXBT/USDT</h2>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-red-500">0.6442</span>
          <span className="text-sm text-red-500">-1.95%</span>
        </div>
      </div>
      <div ref={chartContainerRef} className="w-full h-[500px]" />
    </div>
  );
};

export default CryptoChart; 