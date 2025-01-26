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
      // Check if there is a saved token
      const token = localStorage.getItem('token');
      console.log('Stored token:', token);
      
      if (token) {
        try {
          // Set token
          apiClient.setToken(token);
          console.log('Token set to apiClient');
          
          // Verify if token is valid
          const user = await apiClient.getUserProfile();
          console.log('User profile fetched:', user);
          
          setState(prev => ({
            ...prev,
            address: user.address,
            error: null,
          }));
        } catch (error) {
          console.error('Token validation failed:', error);
          // If token is invalid, clear it
          localStorage.removeItem('token');
          apiClient.clearToken();
          setState(prev => ({
            ...prev,
            address: null,
            error: 'Login expired, please reconnect wallet',
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
        error: 'Please install MetaMask wallet',
      }));
      return;
    }

    try {
      setState(prev => ({
        ...prev,
        isConnecting: true,
        error: null,
      }));

      console.log('Start connecting wallet...');

      // Request wallet connection
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      const address = accounts[0];
      console.log('Wallet address:', address);

      // Get nonce
      console.log('Getting nonce...');
      const { nonce, message } = await apiClient.getNonce();
      console.log('Received nonce:', nonce);
      console.log('Signature message:', message);

      // Request signature
      console.log('Requesting signature...');
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, address],
      });
      console.log('Received signature:', signature);

      // Verify signature and login
      console.log('Verifying signature and logging in...');
      const { token } = await apiClient.connectWallet({
        address,
        signature,
        message,
      });
      console.log('Received token:', token);

      // Save token
      localStorage.setItem('token', token);
      apiClient.setToken(token);

      // Verify if token is valid
      console.log('Verifying token...');
      const user = await apiClient.getUserProfile();
      console.log('Verification successful, user information:', user);

      setState(prev => ({
        ...prev,
        address,
        isConnecting: false,
      }));
    } catch (error) {
      console.error('Connection failed:', error);
      // Clear possibly invalid token
      localStorage.removeItem('token');
      apiClient.clearToken();
      
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      }));
    }
  };

  const disconnect = () => {
    // Clear local state
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