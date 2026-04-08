import { useGameStore } from '../stores/game-store';

/**
 * useGame Hook
 * 
 * Provides access to the complete game state and actions.
 * 
 * @returns Game store state and actions
 * 
 * 
 * @example
 * ```tsx
 * function GameScreen() {
 *   const { activeGame, currentRound, scores, submitAnswer } = useGame();
 *   
 *   if (!activeGame) return null;
 *   
 *   return (
 *     <View>
 *       <Text>Round {currentRound?.roundNumber} of {activeGame.totalRounds}</Text>
 *       <Text>Your Score: {scores[userId]}</Text>
 *       <Button onPress={() => submitAnswer('A')}>Answer A</Button>
 *     </View>
 *   );
 * }
 * ```
 */
export function useGame() {
  return useGameStore();
}
