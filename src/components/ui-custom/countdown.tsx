'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface CountdownProps {
  remainingTime: number; // Remaining time (milliseconds)
  className?: string;
  onEnd?: () => void; // Countdown end callback
}

export function Countdown({ remainingTime, className, onEnd }: CountdownProps) {
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

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {timeLeft.days > 0 && (
        <div className="flex items-center gap-1">
          <span className="font-medium">{timeLeft.days}</span>
          <span className="text-sm text-muted-foreground">{t('days')}</span>
        </div>
      )}
      <div className="flex items-center gap-1">
        <span className="font-medium">{String(timeLeft.hours).padStart(2, '0')}</span>
        <span className="text-sm text-muted-foreground">{t('hours')}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="font-medium">{String(timeLeft.minutes).padStart(2, '0')}</span>
        <span className="text-sm text-muted-foreground">{t('minutes')}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="font-medium">{String(timeLeft.seconds).padStart(2, '0')}</span>
        <span className="text-sm text-muted-foreground">{t('seconds')}</span>
      </div>
    </div>
  );
} 