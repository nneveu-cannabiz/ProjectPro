import { useState, useCallback } from 'react';

type ErrorHandlerFunction<T> = (fn: () => Promise<T>) => Promise<T>;

interface UseErrorHandlingResult<T> {
  error: Error | null;
  isLoading: boolean;
  clearError: () => void;
  handleError: ErrorHandlerFunction<T>;
}

/**
 * Custom hook for handling errors in async operations
 */
function useErrorHandling<T = any>(): UseErrorHandlingResult<T> {
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Wraps an async function with error handling
   */
  const handleError = useCallback(async (fn: () => Promise<T>): Promise<T> => {
    try {
      setIsLoading(true);
      setError(null);
      return await fn();
    } catch (err) {
      console.error('Error caught by useErrorHandling:', err);
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { error, isLoading, clearError, handleError };
}

export default useErrorHandling;