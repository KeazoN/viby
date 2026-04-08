import { useGameStore } from '../stores/game-store';
import type { GameSession } from '../types';

/**
 * useGameSession Hook
 * 
 * Provides access to the active game session.
 * This is a selector hook that only subscribes to activeGame state,
 * minimizing re-renders when other game state changes.
 * 
 * @returns Active game session or null if no game is active
 * 
 * 
 * @example
 * ```tsx
 * function GameHeader() {
 *   const gameSession = useGameSession();
 *   
 *   if (!gameSession) return null;
 *   
 *   return (
 *     <View>
 *       <Text>Playing: {gameSession.track.title}</Text>
 *       <Text>Round {gameSession.currentRound} of {gameSession.totalRounds}</Text>
 *     </View>
 *   );
 * }
 * ```
 */
export function useGameSession(): GameSession | null {
  return useGameStore((state) => state.activeGame);
}
