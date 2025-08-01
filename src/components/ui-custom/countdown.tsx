'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface CountdownProps {
  remainingTime: number; // Remaining time (milliseconds)
  className?: string;
  onEnd?: () => void; // Countdown end callback
  mode?: 'full' | 'compact' | 'minimal'; // Display mode: full, compact, or minimal
  hideZeroUnits?: boolean; // Whether to hide units with zero values
  alwaysShowSeconds?: boolean; // Whether to always show seconds
  alwaysShowMinutes?: boolean; 
  color?: 'default' | 'warning' | 'danger' | 'success'; // Color theme
  // Note: The waiting period in IaoEndedView.tsx has been removed, no longer using 10 or 100 minute waiting periods
}

export function Countdown({ 
  remainingTime, 
  className, 
  onEnd, 
  mode = 'full',
  hideZeroUnits = true, 
  alwaysShowSeconds = true,
  alwaysShowMinutes = true,
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

  // Set styles based on color theme
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

  // Minimal mode - only show minutes:seconds
  if (mode === 'minimal') {
    return (
      <div className={cn("flex items-center", className)}>
        <span className={colorStyles.number}>
          {String(timeLeft.days * 24 + timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
        </span>
      </div>
    );
  }

  // Compact mode - numbers and units combined without div separators
  if (mode === 'compact') {
    const parts: string[] = [];
    if (timeLeft.days > 0 || !hideZeroUnits) parts.push(`${timeLeft.days}${t('days')}`);
    if (timeLeft.hours > 0 || !hideZeroUnits) parts.push(`${String(timeLeft.hours).padStart(2, '0')}${t('hours')}`);
    if ((timeLeft.minutes > 0 || !hideZeroUnits) && alwaysShowMinutes) parts.push(`${String(timeLeft.minutes).padStart(2, '0')}${t('minutes')}`);
    if ((timeLeft.seconds > 0 || alwaysShowSeconds || !hideZeroUnits) && alwaysShowSeconds) parts.push(`${String(timeLeft.seconds).padStart(2, '0')}${t('seconds')}`);
    
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <span className={colorStyles.number}>{parts.length > 0 ? parts.join(' ') : '-'}</span>
      </div>
    );
  }

  // Full mode - default style
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