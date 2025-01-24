import { useState, useEffect } from 'react';
import { useAppKitAccount } from '../lib/appkit';
import { apiClient } from '@/lib/api-client';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useAuth() {
  const { address, isConnected } = useAppKitAccount();
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    const authenticate = async () => {
      if (!isConnected || !address || state.isAuthenticated) return;

      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        // 获取 nonce
        const { nonce, message } = await apiClient.getNonce();

        // 请求签名
        const signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [message, address],
        });

        // 验证签名并登录
        const { token } = await apiClient.connectWallet({
          address,
          signature,
          message,
        });

        // 保存 token
        localStorage.setItem('token', token);
        apiClient.setToken(token);

        setState(prev => ({
          ...prev,
          isAuthenticated: true,
          isLoading: false,
        }));
      } catch (error) {
        console.error('Authentication failed:', error);
        localStorage.removeItem('token');
        apiClient.clearToken();
        setState(prev => ({
          ...prev,
          isAuthenticated: false,
          isLoading: false,
          error: error instanceof Error ? error.message : '认证失败',
        }));
      }
    };

    authenticate();
  }, [address, isConnected]);

  const logout = () => {
    localStorage.removeItem('token');
    apiClient.clearToken();
    setState({
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  };

  return {
    ...state,
    logout,
  };
} 