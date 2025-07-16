'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface CountdownProps {
  remainingTime: number; // Remaining time (milliseconds)
  className?: string;
  onEnd?: () => void; // Countdown end callback
  mode?: 'full' | 'compact' | 'minimal'; // 显示模式: full(完整显示)、compact(紧凑显示)、minimal(最小显示)
  hideZeroUnits?: boolean; // 是否隐藏为0的单位
  alwaysShowSeconds?: boolean; // 是否始终显示秒数
  color?: 'default' | 'warning' | 'danger' | 'success'; // 颜色主题
  // 注意：IaoEndedView.tsx中原来的等待时间已被移除，不再使用10分钟或100分钟的等待期
}

export function Countdown({ 
  remainingTime, 
  className, 
  onEnd, 
  mode = 'full',
  hideZeroUnits = true, 
  alwaysShowSeconds = true,
  color = 'default'
}: CountdownProps) {
  const t = useTranslations('common.timeUnits');
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
        // Countdown ended
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

    // Initialize countdown
    let currentRemaining = remainingTime;
    setTimeLeft(calculateTimeLeft(currentRemaining));

    // Update every second
    const timer = setInterval(() => {
      currentRemaining -= 1000; // Decrease 1000ms per second
      const newTimeLeft = calculateTimeLeft(currentRemaining);
      setTimeLeft(newTimeLeft);

      // If countdown ends, clear timer
      if (currentRemaining <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    // Clear timer when component unmounts
    return () => clearInterval(timer);
  }, [remainingTime, onEnd]);

  // 根据颜色主题设置样式
  const getColorStyles = () => {
    switch (color) {
      case 'warning':
        return {
          number: "font-medium text-yellow-600",
          text: "text-sm text-yellow-500"
        };
      case 'danger':
        return {
          number: "font-medium text-red-600",
          text: "text-sm text-red-500"
        };
      case 'success':
        return {
          number: "font-medium text-green-600",
          text: "text-sm text-green-500"
        };
      default:
        return {
          number: "font-medium",
          text: "text-sm text-muted-foreground"
        };
    }
  };

  const colorStyles = getColorStyles();

  // 极简模式 - 只显示分:秒
  if (mode === 'minimal') {
    return (
      <div className={cn("flex items-center", className)}>
        <span className={colorStyles.number}>
          {String(timeLeft.days * 24 + timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
        </span>
      </div>
    );
  }

  // 紧凑模式 - 数字和单位组合在一起，但不使用div分隔
  if (mode === 'compact') {
    const parts: string[] = [];
    if (timeLeft.days > 0 || !hideZeroUnits) parts.push(`${timeLeft.days}${t('days')}`);
    if (timeLeft.hours > 0 || !hideZeroUnits) parts.push(`${String(timeLeft.hours).padStart(2, '0')}${t('hours')}`);
    if (timeLeft.minutes > 0 || !hideZeroUnits) parts.push(`${String(timeLeft.minutes).padStart(2, '0')}${t('minutes')}`);
    if (timeLeft.seconds > 0 || alwaysShowSeconds || !hideZeroUnits) parts.push(`${String(timeLeft.seconds).padStart(2, '0')}${t('seconds')}`);
    
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <span className={colorStyles.number}>{parts.join(' ')}</span>
      </div>
    );
  }

  // 完整模式 - 默认样式
  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      {(timeLeft.days > 0 || !hideZeroUnits) && (
        <div className="flex items-center gap-1">
          <span className={colorStyles.number}>{timeLeft.days}</span>
          <span className={colorStyles.text}>{t('days')}</span>
        </div>
      )}
      {(timeLeft.hours > 0 || !hideZeroUnits) && (
        <div className="flex items-center gap-1">
          <span className={colorStyles.number}>{String(timeLeft.hours).padStart(2, '0')}</span>
          <span className={colorStyles.text}>{t('hours')}</span>
        </div>
      )}
      {(timeLeft.minutes > 0 || !hideZeroUnits) && (
        <div className="flex items-center gap-1">
          <span className={colorStyles.number}>{String(timeLeft.minutes).padStart(2, '0')}</span>
          <span className={colorStyles.text}>{t('minutes')}</span>
        </div>
      )}
      {(timeLeft.seconds > 0 || alwaysShowSeconds || !hideZeroUnits) && (
        <div className="flex items-center gap-1">
          <span className={colorStyles.number}>{String(timeLeft.seconds).padStart(2, '0')}</span>
          <span className={colorStyles.text}>{t('seconds')}</span>
        </div>
      )}
    </div>
  );
} 