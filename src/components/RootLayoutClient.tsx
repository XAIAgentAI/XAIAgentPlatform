'use client';

import { useEffect } from 'react';
import { Toaster } from '@/components/Toaster';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/use-toast';

// 全局WebSocket错误处理器
const setupGlobalErrorHandlers = () => {
  if (typeof window !== 'undefined') {
    // 防止重复设置
    if ((window as any).__errorHandlersSetup) return;
    (window as any).__errorHandlersSetup = true;
    
    // 全局错误处理
    const originalOnError = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      // 处理WebSocket订阅冲突错误
      if (message && typeof message === 'string' && message.includes('Restore will override. subscription')) {
        console.log('全局错误处理器: 捕获到WebSocket订阅冲突错误');
        // 返回true表示错误已处理，不会显示在控制台
        return true;
      }
      
      // 调用原始错误处理器
      if (originalOnError) {
        return originalOnError(message, source, lineno, colno, error);
      }
      return false;
    };
    
    // 捕获未处理的Promise拒绝
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason && event.reason.message && 
          typeof event.reason.message === 'string' && 
          event.reason.message.includes('Restore will override. subscription')) {
        console.log('全局错误处理器: 捕获到WebSocket订阅Promise拒绝');
        event.preventDefault();
      }
    });
  }
};

export default function RootLayoutClient({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const t = useTranslations();
  
  // 设置全局错误处理器
  useEffect(() => {
    setupGlobalErrorHandlers();
    
    // 添加网络状态监听
    const handleOnline = () => {
      console.log('网络连接已恢复');
      // 可以在这里添加网络恢复后的逻辑
    };
    
    const handleOffline = () => {
      console.log('网络连接已断开');
      toast({
        title: t('messages.networkError'),
        description: t('messages.networkError'),
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast, t]);

  return (
    <>
      {children}
      <Toaster />
    </>
  );
} 