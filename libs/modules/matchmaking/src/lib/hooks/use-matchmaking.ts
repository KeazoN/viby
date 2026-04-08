import { useMatchmakingStore } from '../stores/matchmaking-store';

/**
 * useMatchmaking Hook
 * 
 * Provides access to the complete matchmaking state and actions.
 * 
 * @returns Matchmaking store state and actions
 * 
 * 
 * @example
 * ```tsx
 * function MatchNotification() {
 *   const { activeMatch, matchStatus, clearActiveMatch } = useMatchmaking();
 *   
 *   if (!activeMatch) return null;
 *   
 *   return (
 *     <View>
 *       <Text>Match found with {activeMatch.users[1].username}!</Text>
 *       <Button onPress={() => acceptMatch(activeMatch.id)}>Accept</Button>
 *       <Button onPress={() => {
 *         declineMatch(activeMatch.id);
 *         clearActiveMatch();
 *       }}>Decline</Button>
 *     </View>
 *   );
 * }
 * ```
 */
export function useMatchmaking() {
  return useMatchmakingStore();
}
