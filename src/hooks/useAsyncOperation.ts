import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from './use-toast';

interface AsyncOperationState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface AsyncOperationOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
}

export function useAsyncOperation<T = any>(
  options: AsyncOperationOptions = {}
) {
  const { toast } = useToast();
  const [state, setState] = useState<AsyncOperationState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  // Use ref to track if component is still mounted with more stability
  const isMountedRef = useRef(true);
  const operationIdRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const execute = useCallback(
    async (asyncFunction: () => Promise<T>) => {
      console.log("=== ASYNC OPERATION STARTED ===");
      
      // Generate unique operation ID to track this specific call
      const currentOperationId = ++operationIdRef.current;
      console.log("Operation ID:", currentOperationId);
      
      setState({ data: null, loading: true, error: null });

      try {
        console.log("Creating timeout promise (30 seconds)");
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Operation timed out after 30 seconds')), 30000);
        });

        console.log("Starting async function with timeout race");
        const result = await Promise.race([
          asyncFunction(),
          timeoutPromise
        ]) as T;
        
        // Check both mount status and operation ID to prevent race conditions
        if (!isMountedRef.current || currentOperationId !== operationIdRef.current) {
          console.log("Component unmounted or superseded, ignoring result. Current:", currentOperationId, "Latest:", operationIdRef.current);
          return;
        }

        console.log("=== ASYNC OPERATION SUCCESS ===");
        console.log("Result:", result);
        
        // Use a more stable state update approach
        setState(prevState => ({
          data: result,
          loading: false,
          error: null
        }));
        
        if (options.showToast && options.successMessage) {
          toast({
            title: "Success",
            description: options.successMessage,
          });
        }
        
        options.onSuccess?.(result);
        return result;
      } catch (error) {
        console.log("=== ASYNC OPERATION ERROR ===");
        console.error("Error details:", error);
        
        // Check both mount status and operation ID
        if (!isMountedRef.current || currentOperationId !== operationIdRef.current) {
          console.log("Component unmounted or superseded, ignoring error. Current:", currentOperationId, "Latest:", operationIdRef.current);
          return;
        }

        const errorObj = error instanceof Error ? error : new Error(String(error));
        setState(prevState => ({
          data: null,
          loading: false,
          error: errorObj
        }));
        
        if (options.showToast) {
          toast({
            title: "Error",
            description: options.errorMessage || errorObj.message,
            variant: "destructive",
          });
        }
        
        options.onError?.(errorObj);
        throw errorObj;
      }
    },
    [options, toast]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}