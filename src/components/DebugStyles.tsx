'use client';

import { useEffect } from 'react';

export default function DebugStyles() {
  useEffect(() => {
    // 每秒检查一次CSS变量
    const interval = setInterval(() => {
      const styles = getComputedStyle(document.documentElement);
      console.log('CSS Variables Check:', {
        primary: styles.getPropertyValue('--primary'),
        background: styles.getPropertyValue('--background'),
        dataTheme: document.documentElement.getAttribute('data-theme'),
        time: new Date().toISOString()
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return null;
} 