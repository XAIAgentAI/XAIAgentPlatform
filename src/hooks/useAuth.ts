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
      const { nonce, message } = await apiClient.getNonce();

      // Ensure address format is correct
      const formattedAddress = address.toLowerCase();

      // Request signature
      const signature = await signMessageAsync({ message });

      // Verify signature and login
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
      setLoading(false);
    } catch (error) {
      console.error('Authentication failed:', error);
      localStorage.removeItem('token');
      apiClient.clearToken();
      reset();
      setError(error instanceof Error ? error.message : 'Authentication failed');
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