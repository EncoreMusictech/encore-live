import { useState, useCallback, useRef } from 'react';

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  backoffMultiplier?: number;
  maxDelay?: number;
  shouldRetry?: (error: Error, attempt: number) => boolean;
}

interface RetryState {
  isRetrying: boolean;
  retryCount: number;
  lastError: Error | null;
  nextRetryDelay: number;
}

export function useRetryLogic<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    backoffMultiplier = 2,
    maxDelay = 10000,
    shouldRetry = () => true,
  } = options;

  const [retryState, setRetryState] = useState<RetryState>({
    isRetrying: false,
    retryCount: 0,
    lastError: null,
    nextRetryDelay: initialDelay,
  });

  const timeoutRef = useRef<NodeJS.Timeout>();

  const calculateDelay = useCallback((attempt: number) => {
    const delay = initialDelay * Math.pow(backoffMultiplier, attempt);
    return Math.min(delay, maxDelay);
  }, [initialDelay, backoffMultiplier, maxDelay]);

  const executeWithRetry = useCallback(async (): Promise<T> => {
    let attempt = 0;
    let lastError: Error;

    while (attempt <= maxRetries) {
      try {
        setRetryState(prev => ({
          ...prev,
          isRetrying: attempt > 0,
          retryCount: attempt,
          lastError: null,
        }));

        const result = await operation();
        
        // Success - reset state
        setRetryState({
          isRetrying: false,
          retryCount: 0,
          lastError: null,
          nextRetryDelay: initialDelay,
        });

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt >= maxRetries || !shouldRetry(lastError, attempt)) {
          setRetryState(prev => ({
            ...prev,
            isRetrying: false,
            lastError,
          }));
          throw lastError;
        }

        const delay = calculateDelay(attempt);
        setRetryState(prev => ({
          ...prev,
          lastError,
          nextRetryDelay: delay,
        }));

        // Wait before next retry
        await new Promise(resolve => {
          timeoutRef.current = setTimeout(resolve, delay);
        });

        attempt++;
      }
    }

    throw lastError!;
  }, [operation, maxRetries, shouldRetry, calculateDelay, initialDelay]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setRetryState(prev => ({
      ...prev,
      isRetrying: false,
    }));
  }, []);

  const reset = useCallback(() => {
    cancel();
    setRetryState({
      isRetrying: false,
      retryCount: 0,
      lastError: null,
      nextRetryDelay: initialDelay,
    });
  }, [cancel, initialDelay]);

  return {
    executeWithRetry,
    cancel,
    reset,
    ...retryState,
  };
}