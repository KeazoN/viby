import { useProfileStore } from '../stores/profile-store';
import type { Profile, Match, MusicStats } from '../types';

/**
 * useProfileData Hook
 * 
 * Selector hook that provides access to the profile data only.
 * Only re-renders when profile data changes, not when match history or music stats change.
 * 
 * @returns Profile data or null
 * 
 * Requirements: 9.7 - Minimize component re-renders by using selector-based state subscriptions
 * 
 * @example
 * ```tsx
 * function ProfileHeader() {
 *   const profile = useProfileData();
 *   
 *   return (
 *     <View>
 *       <Text>{profile?.username}</Text>
 *       <Text>{profile?.bio}</Text>
 *     </View>
 *   );
 * }
 * ```
 */
export function useProfileData(): Profile | null {
  return useProfileStore((state) => state.profile);
}

/**
 * useMatchHistory Hook
 * 
 * Selector hook that provides access to match history only.
 * Only re-renders when match history changes, not when profile or music stats change.
 * 
 * @returns Array of matches
 * 
 * Requirements: 9.7 - Minimize component re-renders by using selector-based state subscriptions
 * 
 * @example
 * ```tsx
 * function MatchHistoryList() {
 *   const matchHistory = useMatchHistory();
 *   
 *   return (
 *     <FlatList
 *       data={matchHistory}
 *       renderItem={({ item }) => <MatchItem match={item} />}
 *     />
 *   );
 * }
 * ```
 */
export function useMatchHistoryData(): Match[] {
  return useProfileStore((state) => state.matchHistory);
}

/**
 * useMusicStatsData Hook
 * 
 * Selector hook that provides access to music stats only.
 * Only re-renders when music stats change, not when profile or match history change.
 * 
 * @returns Music stats or null
 * 
 * Requirements: 9.7 - Minimize component re-renders by using selector-based state subscriptions
 * 
 * @example
 * ```tsx
 * function MusicStatsCard() {
 *   const musicStats = useMusicStatsData();
 *   
 *   if (!musicStats) return null;
 *   
 *   return (
 *     <View>
 *       <Text>Top Artists: {musicStats.topArtists.length}</Text>
 *       <Text>Top Tracks: {musicStats.topTracks.length}</Text>
 *     </View>
 *   );
 * }
 * ```
 */
export function useMusicStatsData(): MusicStats | null {
  return useProfileStore((state) => state.musicStats);
}
