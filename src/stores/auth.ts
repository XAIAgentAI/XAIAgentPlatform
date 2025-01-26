import { create } from 'zustand';
import { apiClient } from '@/lib/api-client';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  lastAuthAddress: string | null;
  setAuthenticated: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  setError: (error: string | null) => void;
  setLastAuthAddress: (address: string | null) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: false,
  error: null,
  lastAuthAddress: null,
  setAuthenticated: (value) => set({ isAuthenticated: value }),
  setLoading: (value) => set({ isLoading: value }),
  setError: (error) => set({ error }),
  setLastAuthAddress: (address) => set({ lastAuthAddress: address }),
  reset: () => set({
    isAuthenticated: false,
    isLoading: false,
    error: null,
    lastAuthAddress: null,
  }),
})); 