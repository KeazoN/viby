import { httpClient, signedPost } from '@viby/shared/networking';
import { socketManager } from '@viby/modules/realtime';
import { analyticsTracker } from '@viby/shared/analytics';
import type {
  GameSession,
  Round,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
  LeaveGameResponse,
  GameStartedPayload,
  RoundStartedPayload,
  AnswerSubmittedPayload,
  RoundEndedPayload,
  GameEndedPayload,
} from '../types';

/**
 * GameService handles music trivia game session management.
 * 
 * Integrates with:
 * - SocketManager from realtime module for WebSocket events
 * - HttpClient from networking module for REST API calls
 * 

 */
export class GameService {
  private eventHandlers: Map<string, (data: any) => void> = new Map();
  private gameStartTimes: Map<string, number> = new Map();

  /**
   * Subscribe to game events from WebSocket for a specific room
   * Sets up event handlers for game:started, round:started, answer:submitted, round:ended, and game:ended events
   * @param roomId - The room ID to subscribe to
   */
  subscribeToGameEvents(roomId: string): void {
    // Handler for game:started event
    const gameStartedHandler = (payload: GameStartedPayload) => {
      console.log('Game started:', payload.game);
      
      // Track game start time
      this.gameStartTimes.set(payload.game.roomId, Date.now());
      
      // Track game start
      analyticsTracker.engagement.trackGameStart(
        payload.game.roomId,
        payload.game.opponentId
      );
    };

    // Handler for round:started event
    const roundStartedHandler = (payload: RoundStartedPayload) => {
      if (payload.roomId === roomId) {
        console.log('Round started:', payload.round);
      }
    };

    // Handler for answer:submitted event
    const answerSubmittedHandler = (payload: AnswerSubmittedPayload) => {
      if (payload.roomId === roomId) {
        console.log('Answer submitted by user:', payload.userId);
      }
    };

    // Handler for round:ended event
    const roundEndedHandler = (payload: RoundEndedPayload) => {
      if (payload.roomId === roomId) {
        console.log('Round ended. Correct answer:', payload.correctAnswer, 'Scores:', payload.scores);
      }
    };

    // Handler for game:ended event
    const gameEndedHandler = (payload: GameEndedPayload) => {
      if (payload.roomId === roomId) {
        console.log('Game ended. Winner:', payload.winner, 'Final scores:', payload.finalScores);
        
        // Calculate game duration
        const startTime = this.gameStartTimes.get(roomId);
        const duration = startTime ? Date.now() - startTime : 0;
        
        // Determine winner
        const myScore = payload.finalScores.me || 0;
        const opponentScore = payload.finalScores.opponent || 0;
        const winner = myScore > opponentScore ? 'me' : myScore < opponentScore ? 'opponent' : 'tie';
        
        // Track game complete
        analyticsTracker.engagement.trackGameComplete(
          roomId,
          duration,
          myScore,
          opponentScore,
          winner
        );
        
        // Clean up start time
        this.gameStartTimes.delete(roomId);
      }
    };

    // Store handlers for cleanup with room-specific keys
    this.eventHandlers.set(`game:started:${roomId}`, gameStartedHandler);
    this.eventHandlers.set(`round:started:${roomId}`, roundStartedHandler);
    this.eventHandlers.set(`answer:submitted:${roomId}`, answerSubmittedHandler);
    this.eventHandlers.set(`round:ended:${roomId}`, roundEndedHandler);
    this.eventHandlers.set(`game:ended:${roomId}`, gameEndedHandler);

    // Subscribe to WebSocket events
    socketManager.subscribe('game:started', gameStartedHandler);
    socketManager.subscribe('round:started', roundStartedHandler);
    socketManager.subscribe('answer:submitted', answerSubmittedHandler);
    socketManager.subscribe('round:ended', roundEndedHandler);
    socketManager.subscribe('game:ended', gameEndedHandler);
  }

  /**
   * Unsubscribe from game events for a specific room
   * Cleans up all WebSocket event subscriptions for the room
   * @param roomId - The room ID to unsubscribe from
   */
  unsubscribeFromGameEvents(roomId: string): void {
    // Unsubscribe from all events for this room
    const gameStartedHandler = this.eventHandlers.get(`game:started:${roomId}`);
    const roundStartedHandler = this.eventHandlers.get(`round:started:${roomId}`);
    const answerSubmittedHandler = this.eventHandlers.get(`answer:submitted:${roomId}`);
    const roundEndedHandler = this.eventHandlers.get(`round:ended:${roomId}`);
    const gameEndedHandler = this.eventHandlers.get(`game:ended:${roomId}`);

    if (gameStartedHandler) {
      socketManager.unsubscribe('game:started', gameStartedHandler);
      this.eventHandlers.delete(`game:started:${roomId}`);
    }

    if (roundStartedHandler) {
      socketManager.unsubscribe('round:started', roundStartedHandler);
      this.eventHandlers.delete(`round:started:${roomId}`);
    }

    if (answerSubmittedHandler) {
      socketManager.unsubscribe('answer:submitted', answerSubmittedHandler);
      this.eventHandlers.delete(`answer:submitted:${roomId}`);
    }

    if (roundEndedHandler) {
      socketManager.unsubscribe('round:ended', roundEndedHandler);
      this.eventHandlers.delete(`round:ended:${roomId}`);
    }

    if (gameEndedHandler) {
      socketManager.unsubscribe('game:ended', gameEndedHandler);
      this.eventHandlers.delete(`game:ended:${roomId}`);
    }
  }

  /**
   * Submit an answer for the current round
   * @param roomId - The room ID
   * @param roundId - The round ID
   * @param answer - The selected answer
   * @returns Promise resolving to the submission response
   */
  async submitAnswer(roomId: string, roundId: string, answer: string): Promise<SubmitAnswerResponse> {
    try {
      const response = await signedPost<SubmitAnswerResponse>(
        `/game/${roomId}/answer`,
        { roomId, roundId, answer } as SubmitAnswerRequest
      );
      return response;
    } catch (error) {
      console.error('Failed to submit answer:', error);
      throw error;
    }
  }

  /**
   * Leave the current game session
   * @param roomId - The room ID to leave
   * @returns Promise resolving to the leave response
   */
  async leaveGame(roomId: string): Promise<LeaveGameResponse> {
    try {
      const response = await signedPost<LeaveGameResponse>(
        `/game/${roomId}/leave`,
        { roomId }
      );
      return response;
    } catch (error) {
      console.error('Failed to leave game:', error);
      throw error;
    }
  }

  /**
   * Request current game state from the server
   * Used for state recovery after WebSocket reconnection
   * @param roomId - The room ID to get state for
   * @returns Promise resolving to the current game session and round
   */
  async getGameState(roomId: string): Promise<{ game: GameSession; currentRound: Round | null }> {
    try {
      const response = await httpClient.get<{ game: GameSession; currentRound: Round | null }>(
        `/game/${roomId}/state`
      );
      return response;
    } catch (error) {
      console.error('Failed to get game state:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const gameService = new GameService();
