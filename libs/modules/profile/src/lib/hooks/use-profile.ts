import { useProfileStore } from '../stores/profile-store';

/**
 * useProfile Hook
 * 
 * Provides access to the complete profile state and actions from the Zustand store.
 * This hook gives access to client-side profile state.
 * 
 * For server-side profile data fetching, use useProfileQuery from @viby/shared/query.
 * 
 * @returns Profile store state and actions
 * 
 * 
 * @example
 * ```tsx
 * function ProfileScreen() {
 *   const { profile, matchHistory, musicStats, setProfile } = useProfile();
 *   
 *   return (
 *     <View>
 *       <Text>{profile?.username}</Text>
 *       <Text>Matches: {matchHistory.length}</Text>
 *     </View>
 *   );
 * }
 * ```
 */
export function useProfile() {
  return useProfileStore();
}
