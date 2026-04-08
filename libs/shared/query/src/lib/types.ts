/**
 * Type definitions for TanStack Query configuration
 */

/**
 * Query client configuration options
 */
export interface QueryClientConfig {
  staleTime?: number;
  gcTime?: number;
  retry?: number;
  retryDelay?: (attemptIndex: number) => number;
  refetchOnWindowFocus?: boolean;
  refetchOnReconnect?: boolean;
  refetchOnMount?: boolean;
}

/**
 * Persister configuration options
 */
export interface PersisterConfig {
  throttleTime?: number;
  maxAge?: number;
  buster?: string;
}

/**
 * Query invalidation options
 */
export interface InvalidationOptions {
  exact?: boolean;
  refetchType?: 'active' | 'inactive' | 'all' | 'none';
}
