import { useEffect } from 'react';
import { socketManager } from '@viby/modules/realtime';
import { useGameStore } from '../stores/game-store';
import { gameService } from '../services/game-service';
import type {
  GameStartedPayload,
  RoundStartedPayload,
  AnswerSubmittedPayload,
  RoundEndedPayload,
  GameEndedPayload,
} from '../types';

export interface UseGameWebSocketOptions {
  /**
   * The room ID to subscribe to game events for
   */
  roomId: string;

  /**
   * Whether to automatically subscribe to game events
   * @default true
   */
  enabled?: boolean;

  /**
   * Callback when a game starts
   */
  onGameStarted?: (payload: GameStartedPayload) => void;

  /**
   * Callback when a round starts
   */
  onRoundStarted?: (payload: RoundStartedPayload) => void;

  /**
   * Callback when an answer is submitted
   */
  onAnswerSubmitted?: (payload: AnswerSubmittedPayload) => void;

  /**
   * Callback when a round ends
   */
  onRoundEnded?: (payload: RoundEndedPayload) => void;

  /**
   * Callback when a game ends
   */
  onGameEnded?: (payload: GameEndedPayload) => void;
}

/**
 * useGameWebSocket Hook
 * 
 * Manages WebSocket event subscriptions for the Game module.
 * Automatically subscribes to game events and updates the game store.
 * 
 * Events handled:
 * - game:started - When a new game session starts
 * - round:started - When a new round begins
 * - answer:submitted - When a player submits an answer
 * - round:ended - When a round ends with correct answer and scores
 * - game:ended - When a game session completes
 * 
 * @param options - Configuration options including roomId
 * 
 * 
 * @example
 * ```tsx
 * function GameScreen({ roomId }: { roomId: string }) {
 *   const { activeGame, currentRound } = useGame();
 *   
 *   // Subscribe to WebSocket events for this room
 *   useGameWebSocket({
 *     roomId,
 *     onGameStarted: (payload) => {
 *       console.log('Game started:', payload.game.id);
 *     },
 *     onRoundStarted: (payload) => {
 *       console.log('Round started:', payload.round.roundNumber);
 *       // Start countdown timer
 *     },
 *     onRoundEnded: (payload) => {
 *       console.log('Round ended. Correct answer:', payload.correctAnswer);
 *       // Show correct answer animation
 *     },
 *     onGameEnded: (payload) => {
 *       console.log('Game ended. Winner:', payload.winner);
 *       // Navigate to results screen
 *     },
 *   });
 *   
 *   return (
 *     <View>
 *       {currentRound && <RoundQuestion round={currentRound} />}
 *     </View>
 *   );
 * }
 * ```
 */
export function useGameWebSocket(
  options: UseGameWebSocketOptions
): void {
  const {
    roomId,
    enabled = true,
    onGameStarted,
    onRoundStarted,
    onAnswerSubmitted,
    onRoundEnded,
    onGameEnded,
  } = options;

  const {
    startGame,
    updateRound,
    setOpponentAnswered,
    updateScores,
    endGame,
  } = useGameStore();

  useEffect(() => {
    if (!enabled || !roomId) return;

    // Handler for game:started event
    const handleGameStarted = (payload: GameStartedPayload) => {
      // Update store with new game session
      startGame(payload.game);

      // Call optional callback
      if (onGameStarted) {
        onGameStarted(payload);
      }
    };

    // Handler for round:started event
    const handleRoundStarted = (payload: RoundStartedPayload) => {
      if (payload.roomId !== roomId) return;

      // Update store with new round
      updateRound(payload.round);

      // Call optional callback
      if (onRoundStarted) {
        onRoundStarted(payload);
      }
    };

    // Handler for answer:submitted event
    const handleAnswerSubmitted = (payload: AnswerSubmittedPayload) => {
      if (payload.roomId !== roomId) return;

      // Mark that opponent has answered (for visual feedback)
      setOpponentAnswered();

      // Call optional callback
      if (onAnswerSubmitted) {
        onAnswerSubmitted(payload);
      }
    };

    // Handler for round:ended event
    const handleRoundEnded = (payload: RoundEndedPayload) => {
      if (payload.roomId !== roomId) return;

      // Update scores with new values
      updateScores(payload.scores);

      // Call optional callback
      if (onRoundEnded) {
        onRoundEnded(payload);
      }
    };

    // Handler for game:ended event
    const handleGameEnded = (payload: GameEndedPayload) => {
      if (payload.roomId !== roomId) return;

      // Update final scores
      updateScores(payload.finalScores);

      // Call optional callback
      if (onGameEnded) {
        onGameEnded(payload);
      }

      // End game after a short delay to allow UI to show final state
      setTimeout(() => {
        endGame();
      }, 500);
    };

    // Subscribe to WebSocket events
    socketManager.subscribe('game:started', handleGameStarted);
    socketManager.subscribe('round:started', handleRoundStarted);
    socketManager.subscribe('answer:submitted', handleAnswerSubmitted);
    socketManager.subscribe('round:ended', handleRoundEnded);
    socketManager.subscribe('game:ended', handleGameEnded);

    // Subscribe to game events via service (sets up additional handlers)
    gameService.subscribeToGameEvents(roomId);

    // Cleanup: unsubscribe on unmount or when roomId changes
    return () => {
      socketManager.unsubscribe('game:started', handleGameStarted);
      socketManager.unsubscribe('round:started', handleRoundStarted);
      socketManager.unsubscribe('answer:submitted', handleAnswerSubmitted);
      socketManager.unsubscribe('round:ended', handleRoundEnded);
      socketManager.unsubscribe('game:ended', handleGameEnded);
      
      gameService.unsubscribeFromGameEvents(roomId);
    };
  }, [
    roomId,
    enabled,
    startGame,
    updateRound,
    setOpponentAnswered,
    updateScores,
    endGame,
    onGameStarted,
    onRoundStarted,
    onAnswerSubmitted,
    onRoundEnded,
    onGameEnded,
  ]);
}
