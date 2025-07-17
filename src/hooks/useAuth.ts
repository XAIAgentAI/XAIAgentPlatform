import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth';
import { useTranslations } from 'next-intl';
import { useDisconnect } from 'wagmi';

export function useAuth() {
  const { address, isConnected, status } = useAppKitAccount();
  const { disconnect } = useDisconnect();
  const t = useTranslations();
  const {
    isAuthenticated,
    isLoading,
    error,
    lastAuthAddress,
    setAuthenticated,
    setLoading,
    setError,
    setLastAuthAddress,
    reset,
  } = useAuthStore();
  
  // 添加连接尝试次数跟踪
  const [connectAttempts, setConnectAttempts] = useState(0);
  const maxConnectAttempts = 3;
  
  // 添加防抖动函数，避免短时间内多次连接请求
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const checkToken = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;
      
      apiClient.setToken(token);
      
      // 尝试获取用户资料，如果成功则token有效
      try {
        const user = await apiClient.getUserProfile();
        if (user && user.address) {
          return true;
        }
      } catch (error) {
        console.error('获取用户资料失败:', error);
      }
      
      return false;
    } catch (error) {
      console.error('Token检查失败:', error);
      localStorage.removeItem('token');
      apiClient.clearToken();
      return false;
    }
  }, []);
  
  const authenticate = useCallback(async () => {
    if (!address || !isConnected || status !== 'connected' || isLoading) {
      return;
    }

    // 如果已经认证过相同地址，则不再重复认证
    if (isAuthenticated && address.toLowerCase() === lastAuthAddress?.toLowerCase()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 检查是否有有效的token
      const hasValidToken = await checkToken();
      if (hasValidToken) {
        setAuthenticated(true);
        setLastAuthAddress(address);
        setLoading(false);
        return;
      }

      const formattedAddress = address.toLowerCase();
      
      // 直接连接钱包（无需签名）
      try {
        const { token } = await apiClient.connectWalletNoSig({
          address: formattedAddress
        });

        // 保存token
        localStorage.setItem('token', token);
        apiClient.setToken(token);

        setLastAuthAddress(address);
        setAuthenticated(true);
        // 重置连接尝试次数
        setConnectAttempts(0);
      } catch (error: any) {
        console.error('钱包连接失败:', error);
        
        // 增加连接尝试次数
        const newAttempts = connectAttempts + 1;
        setConnectAttempts(newAttempts);
        
        // 如果错误包含"Restore will override. subscription"，尝试自动恢复
        if (error?.message?.includes('Restore will override. subscription') && newAttempts < maxConnectAttempts) {
          console.log(`检测到订阅冲突错误，正在尝试重新连接 (尝试 ${newAttempts}/${maxConnectAttempts})...`);
          
          // 延迟后自动重试
          setTimeout(() => {
            // 清除错误状态
            setError(null);
            setLoading(false);
            // 重新尝试认证
            authenticate();
          }, 1000); // 等待1秒后重试
          return;
        }
        
        // 其他错误处理
        setError(t('messages.walletConnectFailed'));
        localStorage.removeItem('token');
        apiClient.clearToken();
        reset();
        disconnect();
      }
    } catch (error: any) {
      console.error('认证失败:', error);
      localStorage.removeItem('token');
      apiClient.clearToken();
      reset();
      disconnect();
      setError(error instanceof Error ? error.message : t('messages.authenticationFailed'));
    } finally {
      setLoading(false);
    }
  }, [
    address,
    isConnected,
    status,
    isLoading,
    isAuthenticated,
    lastAuthAddress,
    checkToken,
    setAuthenticated,
    setLoading,
    setError,
    setLastAuthAddress,
    reset,
    disconnect,
    t,
    connectAttempts,
  ]);
  
  // 使用防抖动的认证函数
  const debouncedAuthenticate = useMemo(() => debounce(authenticate, 300), [authenticate]);

  // 添加连接状态监听
  useEffect(() => {
    // 页面可见性变化时检查连接
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated) {
        // 检查连接是否仍然有效
        checkToken().catch(() => {
          console.log('连接状态检查失败，尝试重新认证');
          debouncedAuthenticate();
        });
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, debouncedAuthenticate, checkToken]);

  // 监听钱包连接状态变化
  useEffect(() => {
    // 当钱包断开连接时（isConnected 从 true 变为 false）
    if (!isConnected) {
      console.log('钱包已断开连接，正在清理认证信息');
      localStorage.removeItem('token');
      apiClient.clearToken();
      reset();
    }
  }, [isConnected, reset]);

  const logout = useCallback(async () => {
    try {
      await apiClient.disconnect();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      localStorage.removeItem('token');
      apiClient.clearToken();
      reset();
    }
  }, [reset]);

  return {
    isAuthenticated,
    isLoading,
    error,
    authenticate: debouncedAuthenticate, // 使用防抖动版本
    logout,
  };
} 