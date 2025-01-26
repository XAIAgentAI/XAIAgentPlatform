import { useCallback } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { apiClient } from '@/lib/api-client';
import { useSignMessage } from 'wagmi';
import { useAuthStore } from '@/stores/auth';

export function useAuth() {
  const { address, isConnected, status } = useAppKitAccount();
  const { signMessageAsync } = useSignMessage();
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

  const checkToken = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      apiClient.setToken(token);
      const user = await apiClient.getUserProfile();
      if (user.address.toLowerCase() === address?.toLowerCase()) {
        setAuthenticated(true);
        setLastAuthAddress(address);
        return true;
      }
    } catch (error) {
      console.error('Token validation failed:', error);
      localStorage.removeItem('token');
      apiClient.clearToken();
    }
    return false;
  }, [address, setAuthenticated, setLastAuthAddress]);

  const authenticate = useCallback(async () => {
    // 如果正在加载，不要重复处理
    if (isLoading) return;

    // 如果没有连接或没有地址，重置状态
    if (!isConnected || !address) {
      reset();
      return;
    }

    // 如果正在连接中，不要开始认证
    if (status === 'connecting') return;

    // 如果地址没有变化，且已经认证，不需要重新认证
    if (lastAuthAddress === address && isAuthenticated) return;

    try {
      setLoading(true);
      setError(null);

      // 先检查 token
      const isValidToken = await checkToken();
      if (isValidToken) {
        setLoading(false);
        return;
      }

      // 获取 nonce
      const { nonce, message } = await apiClient.getNonce();

      // 确保地址格式正确
      const formattedAddress = address.toLowerCase();

      // 请求签名
      const signature = await signMessageAsync({ message });

      // 验证签名并登录
      const { token } = await apiClient.connectWallet({
        address: formattedAddress,
        signature,
        message,
      });

      // 保存 token
      localStorage.setItem('token', token);
      apiClient.setToken(token);

      setLastAuthAddress(address);
      setAuthenticated(true);
      setLoading(false);
    } catch (error) {
      console.error('认证失败:', error);
      localStorage.removeItem('token');
      apiClient.clearToken();
      reset();
      setError(error instanceof Error ? error.message : '认证失败');
    }
  }, [
    address,
    isConnected,
    status,
    isLoading,
    isAuthenticated,
    lastAuthAddress,
    signMessageAsync,
    checkToken,
    setAuthenticated,
    setLoading,
    setError,
    setLastAuthAddress,
    reset,
  ]);

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
    authenticate,
    logout,
  };
} 