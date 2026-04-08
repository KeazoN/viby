import { useQuery } from '@tanstack/react-query';
import { profileService } from '../services/profile-service';
import { useProfileStore } from '../stores/profile-store';
import { queryKeys } from '@viby/shared/query';
import { useEffect } from 'react';
import type { GetMatchHistoryResponse } from '../types';

/**
 * Options for useMatchHistory hook
 */
export interface UseMatchHistoryOptions {
  /**
   * Maximum number of matches to fetch
   * @default 20
   */
  limit?: number;

  /**
   * Offset for pagination
   * @default 0
   */
  offset?: number;

  /**
   * Whether to automatically sync with store
   * @default true
   */
  syncWithStore?: boolean;
}

/**
 * useMatchHistory Hook
 * 
 * Query hook for fetching user match history with TanStack Query.
 * Automatically syncs with Profile Zustand store.
 * 
 * Features:
 * - Automatic caching and deduplication
 * - Pagination support
 * - Store synchronization
 * - Error handling with retry logic
 * 
 * @param userId - The user ID to fetch match history for
 * @param options - Query options including pagination
 * @returns Query result with match history data
 * 
 * 
 * @example
 * ```tsx
 * function MatchHistoryScreen({ userId }: Props) {
 *   const { data, isLoading, error, refetch } = useMatchHistory(userId, {
 *     limit: 20,
 *     offset: 0,
 *   });
 *   
 *   if (isLoading) return <Spinner />;
 *   if (error) return <ErrorMessage error={error} />;
 *   
 *   return (
 *     <FlatList
 *       data={data?.matches}
 *       renderItem={({ item }) => <MatchCard match={item} />}
 *       onEndReached={() => {
 *         // Load more with pagination
 *       }}
 *     />
 *   );
 * }
 * ```
 */
export function useMatchHistory(
  userId: string,
  options: UseMatchHistoryOptions = {}
) {
  const { limit = 20, offset = 0, syncWithStore = true } = options;
  const setMatchHistory = useProfileStore((state) => state.setMatchHistory);

  const query = useQuery({
    queryKey: [...queryKeys.matchHistory(userId), { limit, offset }] as const,
    queryFn: async () => {
      const response = await profileService.getMatchHistory({ limit, offset });
      return response;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - match history doesn't change frequently
    enabled: !!userId, // Only fetch if userId is provided
  });

  // Sync with store when data changes
  useEffect(() => {
    if (syncWithStore && query.data?.matches) {
      setMatchHistory(query.data.matches);
    }
  }, [query.data, syncWithStore, setMatchHistory]);

  return query;
}
