/**
 * Profile module hooks
 * 
 * Provides React hooks for accessing profile state and data fetching.
 * 
 * - useProfile: Access profile Zustand store state
 * - useUpdateProfile: Mutation hook for updating profile
 * - useMatchHistory: Query hook for fetching match history
 * - useMusicStats: Query hook for fetching music statistics
 */

export { useProfile } from './use-profile';
export { useUpdateProfile } from './use-update-profile';
export { useMatchHistory } from './use-match-history';
export type { UseMatchHistoryOptions } from './use-match-history';
export { useMusicStats } from './use-music-stats';
export type { UseMusicStatsOptions } from './use-music-stats';
