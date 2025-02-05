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
    // If loading, don't process again
    if (isLoading) return;

    // If not connected or no address, reset status
    if (!isConnected || !address) {
      reset();
      return;
    }

    // If connecting, don't start authentication
    if (status === 'connecting') return;

    // If address hasn't changed and already authenticated, don't reauthenticate
    if (lastAuthAddress === address && isAuthenticated) return;

    try {
      setLoading(true);
      setError(null);

      // First check token
      const isValidToken = await checkToken();
      if (isValidToken) {
        setLoading(false);
        return;
      }

      // Get nonce
      let nonceResponse;
      try {
        nonceResponse = await apiClient.getNonce();
      } catch (error) {
        console.error('Failed to get nonce:', error);
        setError('获取 nonce 失败，请稍后重试');
        setLoading(false);
        return;
      }

      const { nonce, message } = nonceResponse;

      // Ensure address format is correct
      const formattedAddress = address.toLowerCase();

      // Request signature
      let signature;
      try {
        signature = await signMessageAsync({ message });
      } catch (error) {
        console.error('User rejected signature:', error);
        setError('用户拒绝签名');
        setLoading(false);
        return;
      }

      // Verify signature and login
      try {
        const { token } = await apiClient.connectWallet({
          address: formattedAddress,
          signature,
          message,
        });

        // Save token
        localStorage.setItem('token', token);
        apiClient.setToken(token);

        setLastAuthAddress(address);
        setAuthenticated(true);
      } catch (error) {
        console.error('Wallet connect failed:', error);
        setError('钱包连接失败，请稍后重试');
        localStorage.removeItem('token');
        apiClient.clearToken();
        reset();
      }
    } catch (error) {
      console.error('Authentication failed:', error);
      localStorage.removeItem('token');
      apiClient.clearToken();
      reset();
      setError(error instanceof Error ? error.message : '认证失败');
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