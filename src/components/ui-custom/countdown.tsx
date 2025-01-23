'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface CountdownProps {
  remainingTime: number; // 剩余时间（毫秒）
  className?: string;
  onEnd?: () => void; // 倒计时结束回调
}

export function Countdown({ remainingTime, className, onEnd }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = (remaining: number) => {
      if (remaining <= 0) {
        // 倒计时结束
        onEnd?.();
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        };
      }

      return {
        days: Math.floor(remaining / (1000 * 60 * 60 * 24)),
        hours: Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((remaining % (1000 * 60)) / 1000),
      };
    };

    // 初始化倒计时
    let currentRemaining = remainingTime;
    setTimeLeft(calculateTimeLeft(currentRemaining));

    // 每秒更新一次
    const timer = setInterval(() => {
      currentRemaining -= 1000; // 每秒减少1000毫秒
      const newTimeLeft = calculateTimeLeft(currentRemaining);
      setTimeLeft(newTimeLeft);

      // 如果倒计时结束，清除定时器
      if (currentRemaining <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    // 组件卸载时清除定时器
    return () => clearInterval(timer);
  }, [remainingTime, onEnd]);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {timeLeft.days > 0 && (
        <div className="flex items-center gap-1">
          <span className="font-medium">{timeLeft.days}</span>
          <span className="text-sm text-muted-foreground">天</span>
        </div>
      )}
      <div className="flex items-center gap-1">
        <span className="font-medium">{String(timeLeft.hours).padStart(2, '0')}</span>
        <span className="text-sm text-muted-foreground">时</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="font-medium">{String(timeLeft.minutes).padStart(2, '0')}</span>
        <span className="text-sm text-muted-foreground">分</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="font-medium">{String(timeLeft.seconds).padStart(2, '0')}</span>
        <span className="text-sm text-muted-foreground">秒</span>
      </div>
    </div>
  );
} 