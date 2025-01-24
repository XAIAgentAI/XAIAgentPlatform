import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { ApiError } from '@/lib/error';

interface WalletState {
  address: string | null;
  isConnecting: boolean;
  error: string | null;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    isConnecting: false,
    error: null,
  });

  useEffect(() => {
    const validateToken = async () => {
      // 检查是否有保存的 token
      const token = localStorage.getItem('token');
      console.log('Stored token:', token);
      
      if (token) {
        try {
          // 设置 token
          apiClient.setToken(token);
          console.log('Token set to apiClient');
          
          // 验证 token 是否有效
          const user = await apiClient.getUserProfile();
          console.log('User profile fetched:', user);
          
          setState(prev => ({
            ...prev,
            address: user.address,
            error: null,
          }));
        } catch (error) {
          console.error('Token validation failed:', error);
          // 如果 token 无效，清除它
          localStorage.removeItem('token');
          apiClient.clearToken();
          setState(prev => ({
            ...prev,
            address: null,
            error: '登录已过期，请重新连接钱包',
          }));
        }
      }
    };

    validateToken();
  }, []);

  const connect = async () => {
    if (!window.ethereum) {
      setState(prev => ({
        ...prev,
        error: '请安装 MetaMask 钱包',
      }));
      return;
    }

    try {
      setState(prev => ({
        ...prev,
        isConnecting: true,
        error: null,
      }));

      console.log('开始连接钱包...');

      // 请求连接钱包
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      const address = accounts[0];
      console.log('钱包地址:', address);

      // 获取 nonce
      console.log('获取 nonce...');
      const { nonce, message } = await apiClient.getNonce();
      console.log('获取到 nonce:', nonce);
      console.log('签名消息:', message);

      // 请求签名
      console.log('请求签名...');
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, address],
      });
      console.log('获取到签名:', signature);

      // 验证签名并登录
      console.log('验证签名并登录...');
      const { token } = await apiClient.connectWallet({
        address,
        signature,
        message,
      });
      console.log('获取到 token:', token);

      // 保存 token
      localStorage.setItem('token', token);
      apiClient.setToken(token);

      // 验证 token 是否有效
      console.log('验证 token...');
      const user = await apiClient.getUserProfile();
      console.log('验证成功，用户信息:', user);

      setState(prev => ({
        ...prev,
        address,
        isConnecting: false,
      }));
    } catch (error) {
      console.error('连接失败:', error);
      // 清除可能存在的无效 token
      localStorage.removeItem('token');
      apiClient.clearToken();
      
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : '连接失败',
      }));
    }
  };

  const disconnect = () => {
    // 清除本地状态
    localStorage.removeItem('token');
    apiClient.clearToken();
    setState({
      address: null,
      isConnecting: false,
      error: null,
    });
  };

  return {
    address: state.address,
    isConnecting: state.isConnecting,
    error: state.error,
    connect,
    disconnect,
  };
} 