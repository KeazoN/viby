import { useGameStore } from '../stores/game-store';
import type { Round } from '../types';

/**
 * useCurrentRound Hook
 * 
 * Provides access to the current round.
 * This is a selector hook that only subscribes to currentRound state,
 * minimizing re-renders when other game state changes.
 * 
 * @returns Current round or null if no round is active
 * 
 * 
 * @example
 * ```tsx
 * function RoundQuestion() {
 *   const currentRound = useCurrentRound();
 *   
 *   if (!currentRound) {
 *     return <Text>Waiting for next round...</Text>;
 *   }
 *   
 *   return (
 *     <View>
 *       <Text>{currentRound.question}</Text>
 *       {currentRound.options.map((option, index) => (
 *         <Button key={index} title={option} />
 *       ))}
 *     </View>
 *   );
 * }
 * ```
 */
export function useCurrentRound(): Round | null {
  return useGameStore((state) => state.currentRound);
}
