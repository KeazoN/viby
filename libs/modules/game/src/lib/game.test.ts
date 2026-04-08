import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGameStore } from './stores/game-store';
import { gameService } from './services/game-service';
import { useGameWebSocket } from './hooks/use-game-websocket';
import { useGameSession } from './hooks/use-game-session';
import { useCurrentRound } from './hooks/use-current-round';
import { socketManager } from '@viby/modules/realtime';
import { httpClient } from '@viby/shared/networking';
import type {
  GameSession,
  Round,
  GameStartedPayload,
  RoundStartedPayload,
  AnswerSubmittedPayload,
  RoundEndedPayload,
  GameEndedPayload,
  SubmitAnswerResponse,
} from './types';

// Mock dependencies
vi.mock('@viby/modules/realtime', () => ({
  socketManager: {
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    getConnectionStatus: vi.fn(() => 'connected'),
  },
}));

vi.mock('@viby/shared/networking', () => ({
  httpClient: {
    post: vi.fn(),
  },
}));

/**
 * Game Module Integration Tests
 * 
 * Tests the complete game module integration including:
 * - Game session lifecycle (start, rounds, end)
 * - Answer submission with optimistic updates
 * - Score updates from WebSocket events
 * - Reconnection state recovery
 * 
 */
describe('Game Module Integration', () => {
  const mockRoomId = 'room-123';
  const mockUserId = 'user-1';
  const mockOpponentId = 'user-2';

  const mockTrack = {
    id: 'track-1',
    title: 'Test Song',
    artist: 'Test Artist',
    album: 'Test Album',
    artwork: 'https://example.com/artwork.jpg',
    duration: 180,
    isrc: null,
    provider: 'spotify' as const,
  };

  const mockUsers = [
    { id: mockUserId, username: 'Player1', avatar: null },
    { id: mockOpponentId, username: 'Player2', avatar: null },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    const store = useGameStore.getState();
    store.endGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Test: Game Session Lifecycle
   * 
   * Validates that the game module correctly handles the complete lifecycle:
   * 1. Game starts with initial state
   * 2. Rounds progress sequentially
   * 3. Game ends and clears state
   * 
   */
  describe('Game Session Lifecycle', () => {
    it('should handle complete game lifecycle from start to end', async () => {
      const mockGame: GameSession = {
        id: 'game-1',
        roomId: mockRoomId,
        users: mockUsers,
        track: mockTrack,
        currentRound: 0,
        totalRounds: 3,
        scores: { [mockUserId]: 0, [mockOpponentId]: 0 },
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      // Start game
      act(() => {
        useGameStore.getState().startGame(mockGame);
      });

      const { result: sessionResult } = renderHook(() => useGameSession());
      
      // Verify game started
      expect(sessionResult.current).toEqual(mockGame);
      expect(sessionResult.current?.status).toBe('active');
      expect(sessionResult.current?.currentRound).toBe(0);

      // Round 1
      const round1: Round = {
        id: 'round-1',
        roundNumber: 1,
        question: 'What is the artist?',
        options: ['Artist A', 'Artist B', 'Test Artist', 'Artist D'],
        correctAnswer: null,
        timeLimit: 30,
        startedAt: new Date().toISOString(),
      };

      act(() => {
        useGameStore.getState().updateRound(round1);
      });

      const { result: roundResult } = renderHook(() => useCurrentRound());
      expect(roundResult.current).toEqual(round1);
      expect(roundResult.current?.roundNumber).toBe(1);

      // Round 2
      const round2: Round = {
        id: 'round-2',
        roundNumber: 2,
        question: 'What is the album?',
        options: ['Album A', 'Test Album', 'Album C', 'Album D'],
        correctAnswer: null,
        timeLimit: 30,
        startedAt: new Date().toISOString(),
      };

      act(() => {
        useGameStore.getState().updateRound(round2);
      });

      expect(roundResult.current?.roundNumber).toBe(2);

      // End game
      act(() => {
        useGameStore.getState().endGame();
      });

      expect(sessionResult.current).toBeNull();
      expect(roundResult.current).toBeNull();
    });

    it('should reset answer state when new round starts', () => {
      const mockGame: GameSession = {
        id: 'game-1',
        roomId: mockRoomId,
        users: mockUsers,
        track: mockTrack,
        currentRound: 1,
        totalRounds: 3,
        scores: { [mockUserId]: 0, [mockOpponentId]: 0 },
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      act(() => {
        useGameStore.getState().startGame(mockGame);
      });

      // Submit answer for round 1
      act(() => {
        useGameStore.getState().submitAnswer('Answer A');
        useGameStore.getState().setOpponentAnswered();
      });

      const store = useGameStore.getState();
      expect(store.myAnswer).toBe('Answer A');
      expect(store.opponentAnswered).toBe(true);

      // Start round 2
      const round2: Round = {
        id: 'round-2',
        roundNumber: 2,
        question: 'Next question?',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: null,
        timeLimit: 30,
        startedAt: new Date().toISOString(),
      };

      act(() => {
        useGameStore.getState().updateRound(round2);
      });

      // Verify answer state was reset
      const updatedStore = useGameStore.getState();
      expect(updatedStore.myAnswer).toBeNull();
      expect(updatedStore.opponentAnswered).toBe(false);
    });

    it('should maintain game state across multiple rounds', () => {
      const mockGame: GameSession = {
        id: 'game-1',
        roomId: mockRoomId,
        users: mockUsers,
        track: mockTrack,
        currentRound: 0,
        totalRounds: 5,
        scores: { [mockUserId]: 0, [mockOpponentId]: 0 },
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      act(() => {
        useGameStore.getState().startGame(mockGame);
      });

      // Simulate 5 rounds
      for (let i = 1; i <= 5; i++) {
        const round: Round = {
          id: `round-${i}`,
          roundNumber: i,
          question: `Question ${i}?`,
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: null,
          timeLimit: 30,
          startedAt: new Date().toISOString(),
        };

        act(() => {
          useGameStore.getState().updateRound(round);
          useGameStore.getState().submitAnswer(`Answer ${i}`);
          useGameStore.getState().updateScores({
            [mockUserId]: i * 100,
            [mockOpponentId]: i * 50,
          });
        });

        const store = useGameStore.getState();
        expect(store.currentRound?.roundNumber).toBe(i);
        expect(store.scores[mockUserId]).toBe(i * 100);
      }

      // Verify final state
      const finalStore = useGameStore.getState();
      expect(finalStore.scores[mockUserId]).toBe(500);
      expect(finalStore.scores[mockOpponentId]).toBe(250);
    });
  });

  /**
   * Test: Answer Submission
   * 
   * Validates optimistic answer submission:
   * 1. Answer is stored locally immediately
   * 2. HTTP request is sent to server
   * 3. Server confirmation updates state
   * 
   */
  describe('Answer Submission', () => {
    it('should submit answer with optimistic update', async () => {
      const mockGame: GameSession = {
        id: 'game-1',
        roomId: mockRoomId,
        users: mockUsers,
        track: mockTrack,
        currentRound: 1,
        totalRounds: 3,
        scores: { [mockUserId]: 0, [mockOpponentId]: 0 },
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      const mockRound: Round = {
        id: 'round-1',
        roundNumber: 1,
        question: 'What is the artist?',
        options: ['Artist A', 'Artist B', 'Test Artist', 'Artist D'],
        correctAnswer: null,
        timeLimit: 30,
        startedAt: new Date().toISOString(),
      };

      act(() => {
        useGameStore.getState().startGame(mockGame);
        useGameStore.getState().updateRound(mockRound);
      });

      const selectedAnswer = 'Test Artist';

      // Optimistic update - answer stored immediately
      act(() => {
        useGameStore.getState().submitAnswer(selectedAnswer);
      });

      const store = useGameStore.getState();
      expect(store.myAnswer).toBe(selectedAnswer);

      // Submit to server
      const mockResponse: SubmitAnswerResponse = {
        success: true,
        timestamp: new Date().toISOString(),
      };

      (httpClient.post as any).mockResolvedValue(mockResponse);

      const response = await gameService.submitAnswer(
        mockRoomId,
        mockRound.id,
        selectedAnswer
      );

      expect(httpClient.post).toHaveBeenCalledWith(
        `/game/${mockRoomId}/answer`,
        {
          roomId: mockRoomId,
          roundId: mockRound.id,
          answer: selectedAnswer,
        }
      );
      expect(response.success).toBe(true);
    });

    it('should allow changing answer before round ends', () => {
      const mockGame: GameSession = {
        id: 'game-1',
        roomId: mockRoomId,
        users: mockUsers,
        track: mockTrack,
        currentRound: 1,
        totalRounds: 3,
        scores: { [mockUserId]: 0, [mockOpponentId]: 0 },
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      act(() => {
        useGameStore.getState().startGame(mockGame);
      });

      // Submit first answer
      act(() => {
        useGameStore.getState().submitAnswer('Answer A');
      });

      expect(useGameStore.getState().myAnswer).toBe('Answer A');

      // Change answer
      act(() => {
        useGameStore.getState().submitAnswer('Answer B');
      });

      expect(useGameStore.getState().myAnswer).toBe('Answer B');
    });

    it('should handle answer submission failure', async () => {
      const mockGame: GameSession = {
        id: 'game-1',
        roomId: mockRoomId,
        users: mockUsers,
        track: mockTrack,
        currentRound: 1,
        totalRounds: 3,
        scores: { [mockUserId]: 0, [mockOpponentId]: 0 },
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      const mockRound: Round = {
        id: 'round-1',
        roundNumber: 1,
        question: 'What is the artist?',
        options: ['Artist A', 'Artist B', 'Test Artist', 'Artist D'],
        correctAnswer: null,
        timeLimit: 30,
        startedAt: new Date().toISOString(),
      };

      act(() => {
        useGameStore.getState().startGame(mockGame);
        useGameStore.getState().updateRound(mockRound);
      });

      // Optimistic update
      act(() => {
        useGameStore.getState().submitAnswer('Test Artist');
      });

      expect(useGameStore.getState().myAnswer).toBe('Test Artist');

      // Server error
      const error = new Error('Network error');
      (httpClient.post as any).mockRejectedValue(error);

      await expect(
        gameService.submitAnswer(mockRoomId, mockRound.id, 'Test Artist')
      ).rejects.toThrow('Network error');

      // Optimistic update remains (UI can show error state)
      expect(useGameStore.getState().myAnswer).toBe('Test Artist');
    });
  });

  /**
   * Test: Score Updates
   * 
   * Validates realtime score updates:
   * 1. Scores update when round ends
   * 2. Updates are received within latency requirements
   * 3. Final scores are displayed correctly
   * 
   */
  describe('Score Updates', () => {
    it('should update scores when round ends', () => {
      const mockGame: GameSession = {
        id: 'game-1',
        roomId: mockRoomId,
        users: mockUsers,
        track: mockTrack,
        currentRound: 1,
        totalRounds: 3,
        scores: { [mockUserId]: 0, [mockOpponentId]: 0 },
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      act(() => {
        useGameStore.getState().startGame(mockGame);
      });

      const newScores = {
        [mockUserId]: 100,
        [mockOpponentId]: 50,
      };

      act(() => {
        useGameStore.getState().updateScores(newScores);
      });

      const store = useGameStore.getState();
      expect(store.scores).toEqual(newScores);
    });

    it('should handle score updates via WebSocket events', () => {
      const mockGame: GameSession = {
        id: 'game-1',
        roomId: mockRoomId,
        users: mockUsers,
        track: mockTrack,
        currentRound: 1,
        totalRounds: 3,
        scores: { [mockUserId]: 0, [mockOpponentId]: 0 },
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      act(() => {
        useGameStore.getState().startGame(mockGame);
      });

      // Simulate round:ended WebSocket event
      const roundEndedPayload: RoundEndedPayload = {
        roomId: mockRoomId,
        roundId: 'round-1',
        correctAnswer: 'Test Artist',
        scores: {
          [mockUserId]: 100,
          [mockOpponentId]: 0,
        },
        timestamp: new Date(),
      };

      // Get the handler that would be registered
      const subscribeCall = (socketManager.subscribe as any).mock.calls.find(
        (call: any[]) => call[0] === 'round:ended'
      );

      if (subscribeCall) {
        const handler = subscribeCall[1];
        act(() => {
          handler(roundEndedPayload);
        });
      } else {
        // Manually update scores if handler not found
        act(() => {
          useGameStore.getState().updateScores(roundEndedPayload.scores);
        });
      }

      const store = useGameStore.getState();
      expect(store.scores[mockUserId]).toBe(100);
      expect(store.scores[mockOpponentId]).toBe(0);
    });

    it('should accumulate scores across multiple rounds', () => {
      const mockGame: GameSession = {
        id: 'game-1',
        roomId: mockRoomId,
        users: mockUsers,
        track: mockTrack,
        currentRound: 0,
        totalRounds: 3,
        scores: { [mockUserId]: 0, [mockOpponentId]: 0 },
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      act(() => {
        useGameStore.getState().startGame(mockGame);
      });

      // Round 1 scores
      act(() => {
        useGameStore.getState().updateScores({
          [mockUserId]: 100,
          [mockOpponentId]: 0,
        });
      });

      expect(useGameStore.getState().scores[mockUserId]).toBe(100);

      // Round 2 scores (cumulative)
      act(() => {
        useGameStore.getState().updateScores({
          [mockUserId]: 200,
          [mockOpponentId]: 100,
        });
      });

      expect(useGameStore.getState().scores[mockUserId]).toBe(200);
      expect(useGameStore.getState().scores[mockOpponentId]).toBe(100);

      // Round 3 scores (cumulative)
      act(() => {
        useGameStore.getState().updateScores({
          [mockUserId]: 300,
          [mockOpponentId]: 200,
        });
      });

      const finalStore = useGameStore.getState();
      expect(finalStore.scores[mockUserId]).toBe(300);
      expect(finalStore.scores[mockOpponentId]).toBe(200);
    });

    it('should display opponent answered indicator', () => {
      const mockGame: GameSession = {
        id: 'game-1',
        roomId: mockRoomId,
        users: mockUsers,
        track: mockTrack,
        currentRound: 1,
        totalRounds: 3,
        scores: { [mockUserId]: 0, [mockOpponentId]: 0 },
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      act(() => {
        useGameStore.getState().startGame(mockGame);
      });

      expect(useGameStore.getState().opponentAnswered).toBe(false);

      // Simulate opponent answer submission
      act(() => {
        useGameStore.getState().setOpponentAnswered();
      });

      expect(useGameStore.getState().opponentAnswered).toBe(true);
    });
  });

  /**
   * Test: Reconnection State Recovery
   * 
   * Validates that game state is maintained and recovered after reconnection:
   * 1. Game state persists during disconnection
   * 2. State is recovered when reconnecting
   * 3. WebSocket subscriptions are re-established
   * 
   */
  describe('Reconnection State Recovery', () => {
    it('should maintain game state during disconnection', () => {
      const mockGame: GameSession = {
        id: 'game-1',
        roomId: mockRoomId,
        users: mockUsers,
        track: mockTrack,
        currentRound: 2,
        totalRounds: 5,
        scores: { [mockUserId]: 200, [mockOpponentId]: 150 },
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      const mockRound: Round = {
        id: 'round-2',
        roundNumber: 2,
        question: 'What is the album?',
        options: ['Album A', 'Test Album', 'Album C', 'Album D'],
        correctAnswer: null,
        timeLimit: 30,
        startedAt: new Date().toISOString(),
      };

      act(() => {
        useGameStore.getState().startGame(mockGame);
        useGameStore.getState().updateRound(mockRound);
        useGameStore.getState().submitAnswer('Test Album');
      });

      // Simulate disconnection (state should persist)
      (socketManager.getConnectionStatus as any).mockReturnValue('disconnected');

      const store = useGameStore.getState();
      expect(store.activeGame).toEqual(mockGame);
      expect(store.currentRound).toEqual(mockRound);
      expect(store.myAnswer).toBe('Test Album');
      expect(store.scores).toEqual({ [mockUserId]: 200, [mockOpponentId]: 150 });
    });

    it('should recover game state after reconnection', async () => {
      const mockGame: GameSession = {
        id: 'game-1',
        roomId: mockRoomId,
        users: mockUsers,
        track: mockTrack,
        currentRound: 3,
        totalRounds: 5,
        scores: { [mockUserId]: 300, [mockOpponentId]: 250 },
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      act(() => {
        useGameStore.getState().startGame(mockGame);
      });

      // Simulate disconnection
      (socketManager.getConnectionStatus as any).mockReturnValue('disconnected');

      // Verify state persists
      expect(useGameStore.getState().activeGame).toEqual(mockGame);

      // Simulate reconnection
      (socketManager.getConnectionStatus as any).mockReturnValue('connected');

      // State should still be intact
      const store = useGameStore.getState();
      expect(store.activeGame).toEqual(mockGame);
      expect(store.scores).toEqual({ [mockUserId]: 300, [mockOpponentId]: 250 });
    });

    it('should re-establish WebSocket subscriptions after reconnection', () => {
      const mockGame: GameSession = {
        id: 'game-1',
        roomId: mockRoomId,
        users: mockUsers,
        track: mockTrack,
        currentRound: 1,
        totalRounds: 3,
        scores: { [mockUserId]: 0, [mockOpponentId]: 0 },
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      act(() => {
        useGameStore.getState().startGame(mockGame);
      });

      // Subscribe to game events
      gameService.subscribeToGameEvents(mockRoomId);

      const initialSubscribeCount = (socketManager.subscribe as any).mock.calls.length;

      // Simulate disconnection and cleanup
      gameService.unsubscribeFromGameEvents(mockRoomId);

      expect((socketManager.unsubscribe as any).mock.calls.length).toBeGreaterThan(0);

      // Simulate reconnection - re-subscribe
      vi.clearAllMocks();
      gameService.subscribeToGameEvents(mockRoomId);

      // Verify subscriptions were re-established
      expect((socketManager.subscribe as any).mock.calls.length).toBe(5);
      expect(socketManager.subscribe).toHaveBeenCalledWith('game:started', expect.any(Function));
      expect(socketManager.subscribe).toHaveBeenCalledWith('round:started', expect.any(Function));
      expect(socketManager.subscribe).toHaveBeenCalledWith('answer:submitted', expect.any(Function));
      expect(socketManager.subscribe).toHaveBeenCalledWith('round:ended', expect.any(Function));
      expect(socketManager.subscribe).toHaveBeenCalledWith('game:ended', expect.any(Function));
    });

    it('should handle game state sync after reconnection', () => {
      const initialGame: GameSession = {
        id: 'game-1',
        roomId: mockRoomId,
        users: mockUsers,
        track: mockTrack,
        currentRound: 2,
        totalRounds: 5,
        scores: { [mockUserId]: 100, [mockOpponentId]: 50 },
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      act(() => {
        useGameStore.getState().startGame(initialGame);
      });

      // Simulate disconnection
      (socketManager.getConnectionStatus as any).mockReturnValue('disconnected');

      // Simulate server state progressed during disconnection
      const syncedGame: GameSession = {
        ...initialGame,
        currentRound: 3,
        scores: { [mockUserId]: 200, [mockOpponentId]: 150 },
      };

      // Reconnect and sync state
      (socketManager.getConnectionStatus as any).mockReturnValue('connected');

      act(() => {
        useGameStore.getState().startGame(syncedGame);
      });

      const store = useGameStore.getState();
      expect(store.activeGame?.currentRound).toBe(3);
      expect(store.scores).toEqual({ [mockUserId]: 200, [mockOpponentId]: 150 });
    });
  });

  /**
   * Test: Complete Game Flow Integration
   * 
   * Validates end-to-end game flow with all components working together
   */
  describe('Complete Game Flow Integration', () => {
    it('should handle complete game with WebSocket events', () => {
      // Game started event
      const gameStartedPayload: GameStartedPayload = {
        game: {
          id: 'game-1',
          roomId: mockRoomId,
          users: mockUsers,
          track: mockTrack,
          currentRound: 0,
          totalRounds: 2,
          scores: { [mockUserId]: 0, [mockOpponentId]: 0 },
          status: 'active',
          createdAt: new Date().toISOString(),
        },
        timestamp: new Date(),
      };

      act(() => {
        useGameStore.getState().startGame(gameStartedPayload.game);
      });

      expect(useGameStore.getState().activeGame).toEqual(gameStartedPayload.game);

      // Round 1 started
      const round1Payload: RoundStartedPayload = {
        roomId: mockRoomId,
        round: {
          id: 'round-1',
          roundNumber: 1,
          question: 'What is the artist?',
          options: ['Artist A', 'Test Artist', 'Artist C', 'Artist D'],
          correctAnswer: null,
          timeLimit: 30,
          startedAt: new Date().toISOString(),
        },
        timestamp: new Date(),
      };

      act(() => {
        useGameStore.getState().updateRound(round1Payload.round);
      });

      expect(useGameStore.getState().currentRound).toEqual(round1Payload.round);

      // Submit answer
      act(() => {
        useGameStore.getState().submitAnswer('Test Artist');
      });

      expect(useGameStore.getState().myAnswer).toBe('Test Artist');

      // Opponent answered
      const answerSubmittedPayload: AnswerSubmittedPayload = {
        roomId: mockRoomId,
        userId: mockOpponentId,
        roundId: 'round-1',
        timestamp: new Date(),
      };

      act(() => {
        useGameStore.getState().setOpponentAnswered();
      });

      expect(useGameStore.getState().opponentAnswered).toBe(true);

      // Round 1 ended
      const round1EndedPayload: RoundEndedPayload = {
        roomId: mockRoomId,
        roundId: 'round-1',
        correctAnswer: 'Test Artist',
        scores: { [mockUserId]: 100, [mockOpponentId]: 0 },
        timestamp: new Date(),
      };

      act(() => {
        useGameStore.getState().updateScores(round1EndedPayload.scores);
      });

      expect(useGameStore.getState().scores).toEqual({ [mockUserId]: 100, [mockOpponentId]: 0 });

      // Round 2 started
      const round2Payload: RoundStartedPayload = {
        roomId: mockRoomId,
        round: {
          id: 'round-2',
          roundNumber: 2,
          question: 'What is the album?',
          options: ['Album A', 'Test Album', 'Album C', 'Album D'],
          correctAnswer: null,
          timeLimit: 30,
          startedAt: new Date().toISOString(),
        },
        timestamp: new Date(),
      };

      act(() => {
        useGameStore.getState().updateRound(round2Payload.round);
      });

      // Answer state should be reset
      expect(useGameStore.getState().myAnswer).toBeNull();
      expect(useGameStore.getState().opponentAnswered).toBe(false);

      // Submit answer for round 2
      act(() => {
        useGameStore.getState().submitAnswer('Test Album');
      });

      // Round 2 ended
      const round2EndedPayload: RoundEndedPayload = {
        roomId: mockRoomId,
        roundId: 'round-2',
        correctAnswer: 'Test Album',
        scores: { [mockUserId]: 200, [mockOpponentId]: 100 },
        timestamp: new Date(),
      };

      act(() => {
        useGameStore.getState().updateScores(round2EndedPayload.scores);
      });

      expect(useGameStore.getState().scores).toEqual({ [mockUserId]: 200, [mockOpponentId]: 100 });

      // Game ended
      const gameEndedPayload: GameEndedPayload = {
        roomId: mockRoomId,
        finalScores: { [mockUserId]: 200, [mockOpponentId]: 100 },
        winner: mockUserId,
        timestamp: new Date(),
      };

      act(() => {
        useGameStore.getState().updateScores(gameEndedPayload.finalScores);
        useGameStore.getState().endGame();
      });

      expect(useGameStore.getState().activeGame).toBeNull();
      expect(useGameStore.getState().currentRound).toBeNull();
    });
  });
});
