import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { storageService } from '@viby/shared/storage';

/**
 * QueryClient configuration with caching strategy and persistence
 * 
 * Features:
 * - 5-minute stale time for queries
 * - 30-minute cache time before garbage collection
 * - Exponential backoff retry strategy (max 30s)
 * - Automatic refetch on window focus and reconnect
 * - MMKV-based persistence for offline support
 * 
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: 1000 * 60 * 5, // 5 minutes
      
      // Cache persists for 30 minutes after last use
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      
      // Retry failed requests up to 3 times
      retry: 3,
      
      // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch when app returns to foreground
      refetchOnWindowFocus: true,
      
      // Refetch when network reconnects
      refetchOnReconnect: true,
      
      // Refetch when component mounts if data is stale
      refetchOnMount: true,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
      
      // No retry delay for mutations
      retryDelay: 0,
    },
  },
});

/**
 * Storage persister for TanStack Query cache
 * 
 * Uses MMKV storage service for fast, synchronous persistence
 * Enables offline-first capabilities and faster app startup
 */
export const queryPersister = createSyncStoragePersister({
  storage: {
    getItem: (key) => {
      const value = storageService.get(key);
      return value ?? null;
    },
    setItem: (key, value) => {
      storageService.set(key, value);
    },
    removeItem: (key) => {
      storageService.delete(key);
    },
  },
  // Throttle writes to storage to avoid excessive I/O
  throttleTime: 1000,
});
