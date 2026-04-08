/**
 * Centralized query keys for TanStack Query
 * 
 * Benefits:
 * - Type-safe query key generation
 * - Consistent cache invalidation
 * - Easy to find all queries in one place
 * - Prevents typos and key mismatches
 * 
 * Usage:
 * ```typescript
 * const { data } = useQuery({
 *   queryKey: queryKeys.profile(userId),
 *   queryFn: () => profileService.getProfile(userId)
 * });
 * ```
 */
export const queryKeys = {
  // Profile queries
  profile: (userId: string) => ['profile', userId] as const,
  matchHistory: (userId: string) => ['matchHistory', userId] as const,
  musicStats: (userId: string) => ['musicStats', userId] as const,
  
  // Discovery queries
  currentlyPlaying: () => ['currentlyPlaying'] as const,
  listeners: () => ['listeners'] as const,
  trackClusters: () => ['trackClusters'] as const,
  
  // Chat queries
  chatHistory: (roomId: string) => ['chatHistory', roomId] as const,
  chatMessages: (roomId: string) => ['chatMessages', roomId] as const,
  
  // Game queries
  gameSession: (roomId: string) => ['gameSession', roomId] as const,
  gameHistory: (userId: string) => ['gameHistory', userId] as const,
  
  // Matchmaking queries
  matches: () => ['matches'] as const,
  activeMatch: () => ['activeMatch'] as const,
} as const;

/**
 * Query key factory type
 * Useful for type inference in hooks and utilities
 */
export type QueryKeys = typeof queryKeys;

/**
 * Helper to invalidate all queries for a specific domain
 * 
 * Usage:
 * ```typescript
 * queryClient.invalidateQueries({ queryKey: ['profile'] });
 * ```
 */
export const queryKeyPrefixes = {
  profile: ['profile'],
  discovery: ['currentlyPlaying', 'listeners', 'trackClusters'],
  chat: ['chatHistory', 'chatMessages'],
  game: ['gameSession', 'gameHistory'],
  matchmaking: ['matches', 'activeMatch'],
} as const;
