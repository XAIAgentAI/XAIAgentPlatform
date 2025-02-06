import { useCallback } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { apiClient } from '@/lib/api-client';
import { useSignMessage } from 'wagmi';
import { useAuthStore } from '@/stores/auth';
import { useTranslations } from 'next-intl';
import { useDisconnect } from 'wagmi';

export function useAuth() {
  const { address, isConnected, status } = useAppKitAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();
  const t = useTranslations('messages');
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
    console.log("authenticate被调用");
    
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
        setError(t('getNonceFailed'));
        setLoading(false);
        reset();
        disconnect();
        return;
      }

      const { nonce, message } = nonceResponse;

      // Ensure address format is correct
      const formattedAddress = address.toLowerCase();

      // Request signature
      let signature;
      try {
        signature = await signMessageAsync({ message });
        
        if (!signature) {
          throw new Error('No signature returned');
        }
      } catch (error) {
        console.error('User rejected signature:', error);
        setError(t('signatureRejected'));
        setLoading(false);
        reset();
        disconnect();
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
      } catch (error: any) {
        console.error('Wallet connect failed:', error);
        if (error?.message?.includes('Nonce 已过期')) {
          setError(t('nonceExpired'));
        } else {
          setError(t('walletConnectFailed'));
        }
        localStorage.removeItem('token');
        apiClient.clearToken();
        reset();
        disconnect();
      }
    } catch (error: any) {
      console.error('Authentication failed:', error);
      localStorage.removeItem('token');
      apiClient.clearToken();
      reset();
      disconnect();
      if (error?.message?.includes('Nonce 已过期')) {
        setError(t('nonceExpired'));
      } else {
        setError(error instanceof Error ? error.message : t('authenticationFailed'));
      }
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
    disconnect,
    t,
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