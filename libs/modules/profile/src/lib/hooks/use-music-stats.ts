import { useQuery } from '@tanstack/react-query';
import { profileService } from '../services/profile-service';
import { useProfileStore } from '../stores/profile-store';
import { queryKeys } from '@viby/shared/query';
import { useEffect } from 'react';
import type { MusicStats } from '../types';

/**
 * Options for useMusicStats hook
 */
export interface UseMusicStatsOptions {
  /**
   * Whether to automatically sync with store
   * @default true
   */
  syncWithStore?: boolean;

  /**
   * Stale time in milliseconds
   * @default 600000 (10 minutes)
   */
  staleTime?: number;
}

/**
 * useMusicStats Hook
 * 
 * Query hook for fetching user music statistics with TanStack Query.
 * Automatically syncs with Profile Zustand store.
 * 
 * Features:
 * - Automatic caching and deduplication
 * - Store synchronization
 * - Error handling with retry logic
 * - Configurable stale time
 * 
 * @param userId - The user ID to fetch music stats for
 * @param options - Query options
 * @returns Query result with music stats data
 * 
 * 
 * @example
 * ```tsx
 * function MusicStatsScreen({ userId }: Props) {
 *   const { data: stats, isLoading, error, refetch } = useMusicStats(userId);
 *   
 *   if (isLoading) return <Spinner />;
 *   if (error) return <ErrorMessage error={error} />;
 *   
 *   return (
 *     <View>
 *       <Text>Top Artists</Text>
 *       {stats?.topArtists.map((artist) => (
 *         <ArtistCard key={artist.id} artist={artist} />
 *       ))}
 *       
 *       <Text>Top Tracks</Text>
 *       {stats?.topTracks.map((track) => (
 *         <TrackCard key={track.id} track={track} />
 *       ))}
 *       
 *       <Text>Top Genres</Text>
 *       {stats?.topGenres.map((genre) => (
 *         <Badge key={genre}>{genre}</Badge>
 *       ))}
 *     </View>
 *   );
 * }
 * ```
 */
export function useMusicStats(
  userId: string,
  options: UseMusicStatsOptions = {}
) {
  const { syncWithStore = true, staleTime = 1000 * 60 * 10 } = options;
  const setMusicStats = useProfileStore((state) => state.setMusicStats);

  const query = useQuery({
    queryKey: queryKeys.musicStats(userId),
    queryFn: async () => {
      const stats = await profileService.getMusicStats();
      return stats;
    },
    staleTime, // 10 minutes by default - music stats don't change frequently
    enabled: !!userId, // Only fetch if userId is provided
  });

  // Sync with store when data changes
  useEffect(() => {
    if (syncWithStore && query.data) {
      setMusicStats(query.data);
    }
  }, [query.data, syncWithStore, setMusicStats]);

  return query;
}
