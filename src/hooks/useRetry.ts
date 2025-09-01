import { useState, useCallback } from 'react';

interface UseRetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

interface UseRetryReturn {
  isRetrying: boolean;
  retryCount: number;
  retry: () => Promise<void>;
  reset: () => void;
}

export function useRetry(
  operation: () => Promise<void>,
  {
    maxRetries = 3,
    retryDelay = 2000,
    onSuccess,
    onError
  }: UseRetryOptions = {}
): UseRetryReturn {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const reset = useCallback(() => {
    setIsRetrying(false);
    setRetryCount(0);
  }, []);

  const retry = useCallback(async () => {
    if (isRetrying) return;

    try {
      setIsRetrying(true);
      await operation();
      onSuccess?.();
      reset();
    } catch (error) {
      const nextRetryCount = retryCount + 1;
      if (nextRetryCount < maxRetries) {
        setRetryCount(nextRetryCount);
        // 使用指数退避策略
        const delay = retryDelay * Math.pow(2, retryCount);
        setTimeout(() => retry(), delay);
        onError?.(error as Error);
      } else {
        onError?.(error as Error);
        reset();
      }
    } finally {
      setIsRetrying(false);
    }
  }, [isRetrying, operation, retryCount, maxRetries, retryDelay, onSuccess, onError, reset]);

  return {
    isRetrying,
    retryCount,
    retry,
    reset
  };
} 