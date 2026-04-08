import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GameService, gameService } from './game-service';
import { httpClient } from '@viby/shared/networking';
import { socketManager } from '@viby/modules/realtime';
import type {
  GameStartedPayload,
  RoundStartedPayload,
  AnswerSubmittedPayload,
  RoundEndedPayload,
  GameEndedPayload,
  SubmitAnswerResponse,
  LeaveGameResponse,
} from '../types';

// Mock dependencies
vi.mock('@viby/shared/networking', () => ({
  httpClient: {
    post: vi.fn(),
  },
}));

vi.mock('@viby/modules/realtime', () => ({
  socketManager: {
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  },
}));

describe('GameService', () => {
  let service: GameService;

  beforeEach(() => {
    service = new GameService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('subscribeToGameEvents', () => {
    it('should subscribe to all game events', () => {
      const roomId = 'room-123';

      service.subscribeToGameEvents(roomId);

      expect(socketManager.subscribe).toHaveBeenCalledTimes(5);
      expect(socketManager.subscribe).toHaveBeenCalledWith('game:started', expect.any(Function));
      expect(socketManager.subscribe).toHaveBeenCalledWith('round:started', expect.any(Function));
      expect(socketManager.subscribe).toHaveBeenCalledWith('answer:submitted', expect.any(Function));
      expect(socketManager.subscribe).toHaveBeenCalledWith('round:ended', expect.any(Function));
      expect(socketManager.subscribe).toHaveBeenCalledWith('game:ended', expect.any(Function));
    });

    it('should store event handlers for cleanup', () => {
      const roomId = 'room-123';

      service.subscribeToGameEvents(roomId);

      // Access private eventHandlers map via type assertion
      const eventHandlers = (service as any).eventHandlers as Map<string, Function>;

      expect(eventHandlers.size).toBe(5);
      expect(eventHandlers.has(`game:started:${roomId}`)).toBe(true);
      expect(eventHandlers.has(`round:started:${roomId}`)).toBe(true);
      expect(eventHandlers.has(`answer:submitted:${roomId}`)).toBe(true);
      expect(eventHandlers.has(`round:ended:${roomId}`)).toBe(true);
      expect(eventHandlers.has(`game:ended:${roomId}`)).toBe(true);
    });

    it('should handle game:started event', () => {
      const roomId = 'room-123';
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      service.subscribeToGameEvents(roomId);

      // Get the handler that was registered
      const subscribeCall = (socketManager.subscribe as any).mock.calls.find(
        (call: any[]) => call[0] === 'game:started'
      );
      const handler = subscribeCall[1];

      const payload: GameStartedPayload = {
        game: {
          id: 'game-1',
          roomId,
          users: [],
          track: {
            id: 'track-1',
            title: 'Test Track',
            artist: 'Test Artist',
            album: 'Test Album',
            artwork: null,
            duration: 180,
            isrc: null,
            provider: 'spotify',
          },
          currentRound: 1,
          totalRounds: 5,
          scores: {},
          status: 'active',
          createdAt: new Date().toISOString(),
        },
        timestamp: new Date(),
      };

      handler(payload);

      expect(consoleSpy).toHaveBeenCalledWith('Game started:', payload.game);
      consoleSpy.mockRestore();
    });

    it('should handle round:started event for matching roomId', () => {
      const roomId = 'room-123';
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      service.subscribeToGameEvents(roomId);

      const subscribeCall = (socketManager.subscribe as any).mock.calls.find(
        (call: any[]) => call[0] === 'round:started'
      );
      const handler = subscribeCall[1];

      const payload: RoundStartedPayload = {
        roomId,
        round: {
          id: 'round-1',
          roundNumber: 1,
          question: 'What is the artist?',
          options: ['Artist A', 'Artist B', 'Artist C', 'Artist D'],
          correctAnswer: null,
          timeLimit: 30,
          startedAt: new Date().toISOString(),
        },
        timestamp: new Date(),
      };

      handler(payload);

      expect(consoleSpy).toHaveBeenCalledWith('Round started:', payload.round);
      consoleSpy.mockRestore();
    });

    it('should not handle round:started event for different roomId', () => {
      const roomId = 'room-123';
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      service.subscribeToGameEvents(roomId);

      const subscribeCall = (socketManager.subscribe as any).mock.calls.find(
        (call: any[]) => call[0] === 'round:started'
      );
      const handler = subscribeCall[1];

      const payload: RoundStartedPayload = {
        roomId: 'different-room',
        round: {
          id: 'round-1',
          roundNumber: 1,
          question: 'What is the artist?',
          options: ['Artist A', 'Artist B', 'Artist C', 'Artist D'],
          correctAnswer: null,
          timeLimit: 30,
          startedAt: new Date().toISOString(),
        },
        timestamp: new Date(),
      };

      handler(payload);

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('unsubscribeFromGameEvents', () => {
    it('should unsubscribe from all game events', () => {
      const roomId = 'room-123';

      // First subscribe
      service.subscribeToGameEvents(roomId);

      // Then unsubscribe
      service.unsubscribeFromGameEvents(roomId);

      expect(socketManager.unsubscribe).toHaveBeenCalledTimes(5);
      expect(socketManager.unsubscribe).toHaveBeenCalledWith('game:started', expect.any(Function));
      expect(socketManager.unsubscribe).toHaveBeenCalledWith('round:started', expect.any(Function));
      expect(socketManager.unsubscribe).toHaveBeenCalledWith('answer:submitted', expect.any(Function));
      expect(socketManager.unsubscribe).toHaveBeenCalledWith('round:ended', expect.any(Function));
      expect(socketManager.unsubscribe).toHaveBeenCalledWith('game:ended', expect.any(Function));
    });

    it('should clear event handlers from map', () => {
      const roomId = 'room-123';

      service.subscribeToGameEvents(roomId);
      service.unsubscribeFromGameEvents(roomId);

      const eventHandlers = (service as any).eventHandlers as Map<string, Function>;

      expect(eventHandlers.size).toBe(0);
    });

    it('should handle unsubscribe when no handlers exist', () => {
      const roomId = 'room-123';

      // Unsubscribe without subscribing first
      expect(() => service.unsubscribeFromGameEvents(roomId)).not.toThrow();

      expect(socketManager.unsubscribe).not.toHaveBeenCalled();
    });
  });

  describe('submitAnswer', () => {
    it('should submit answer via HTTP client', async () => {
      const roomId = 'room-123';
      const roundId = 'round-1';
      const answer = 'Artist A';

      const mockResponse: SubmitAnswerResponse = {
        success: true,
        timestamp: new Date().toISOString(),
      };

      (httpClient.post as any).mockResolvedValue(mockResponse);

      const result = await service.submitAnswer(roomId, roundId, answer);

      expect(httpClient.post).toHaveBeenCalledWith(
        `/game/${roomId}/answer`,
        { roomId, roundId, answer }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle submit answer error', async () => {
      const roomId = 'room-123';
      const roundId = 'round-1';
      const answer = 'Artist A';
      const error = new Error('Network error');

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      (httpClient.post as any).mockRejectedValue(error);

      await expect(service.submitAnswer(roomId, roundId, answer)).rejects.toThrow('Network error');

      expect(consoleSpy).toHaveBeenCalledWith('Failed to submit answer:', error);
      consoleSpy.mockRestore();
    });
  });

  describe('leaveGame', () => {
    it('should leave game via HTTP client', async () => {
      const roomId = 'room-123';

      const mockResponse: LeaveGameResponse = {
        success: true,
      };

      (httpClient.post as any).mockResolvedValue(mockResponse);

      const result = await service.leaveGame(roomId);

      expect(httpClient.post).toHaveBeenCalledWith(
        `/game/${roomId}/leave`,
        { roomId }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle leave game error', async () => {
      const roomId = 'room-123';
      const error = new Error('Network error');

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      (httpClient.post as any).mockRejectedValue(error);

      await expect(service.leaveGame(roomId)).rejects.toThrow('Network error');

      expect(consoleSpy).toHaveBeenCalledWith('Failed to leave game:', error);
      consoleSpy.mockRestore();
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', () => {
      expect(gameService).toBeInstanceOf(GameService);
    });
  });
});
