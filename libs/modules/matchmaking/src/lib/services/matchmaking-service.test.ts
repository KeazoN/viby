import { matchmakingService, MatchmakingService } from './matchmaking-service';
import { httpClient } from '@viby/shared/networking';
import { socketManager } from '@viby/modules/realtime';
import type { Match, MatchCreatedPayload } from '../types';

// Mock dependencies
jest.mock('@viby/shared/networking');
jest.mock('@viby/modules/realtime');

describe('MatchmakingService', () => {
  let service: MatchmakingService;
  const mockHttpClient = httpClient as jest.Mocked<typeof httpClient>;
  const mockSocketManager = socketManager as jest.Mocked<typeof socketManager>;

  beforeEach(() => {
    service = new MatchmakingService();
    jest.clearAllMocks();
  });

  describe('requestMatch', () => {
    it('should request a match with the given track ID', async () => {
      const trackId = 'track-123';
      const mockMatch: Match = {
        id: 'match-123',
        trackId,
        track: {
          id: trackId,
          title: 'Test Track',
          artist: 'Test Artist',
          album: 'Test Album',
          artwork: 'https://example.com/artwork.jpg',
          duration: 180,
          isrc: null,
          provider: 'spotify',
        },
        users: [
          { id: 'user-1', username: 'user1', avatar: null },
          { id: 'user-2', username: 'user2', avatar: null },
        ],
        status: 'pending',
        createdAt: '2024-01-01T00:00:00Z',
        expiresAt: '2024-01-01T00:00:30Z',
      };

      mockHttpClient.post.mockResolvedValue({ match: mockMatch });

      const result = await service.requestMatch(trackId);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/matchmaking/request',
        { trackId }
      );
      expect(result).toEqual(mockMatch);
    });

    it('should throw error when request fails', async () => {
      const trackId = 'track-123';
      const error = new Error('Network error');
      mockHttpClient.post.mockRejectedValue(error);

      await expect(service.requestMatch(trackId)).rejects.toThrow('Network error');
    });
  });

  describe('acceptMatch', () => {
    it('should accept a match and return room ID', async () => {
      const matchId = 'match-123';
      const mockResponse = {
        roomId: 'room-456',
        match: {
          id: matchId,
          trackId: 'track-123',
          track: {
            id: 'track-123',
            title: 'Test Track',
            artist: 'Test Artist',
            album: 'Test Album',
            artwork: null,
            duration: 180,
            isrc: null,
            provider: 'spotify',
          },
          users: [],
          status: 'accepted' as const,
          createdAt: '2024-01-01T00:00:00Z',
          expiresAt: '2024-01-01T00:00:30Z',
        },
      };

      mockHttpClient.post.mockResolvedValue(mockResponse);

      const result = await service.acceptMatch(matchId);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        `/matchmaking/${matchId}/accept`
      );
      expect(result).toEqual(mockResponse);
      expect(result.roomId).toBe('room-456');
    });

    it('should throw error when accept fails', async () => {
      const matchId = 'match-123';
      const error = new Error('Match already expired');
      mockHttpClient.post.mockRejectedValue(error);

      await expect(service.acceptMatch(matchId)).rejects.toThrow(
        'Match already expired'
      );
    });
  });

  describe('declineMatch', () => {
    it('should decline a match', async () => {
      const matchId = 'match-123';
      mockHttpClient.post.mockResolvedValue(undefined);

      await service.declineMatch(matchId);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        `/matchmaking/${matchId}/decline`
      );
    });

    it('should throw error when decline fails', async () => {
      const matchId = 'match-123';
      const error = new Error('Match not found');
      mockHttpClient.post.mockRejectedValue(error);

      await expect(service.declineMatch(matchId)).rejects.toThrow(
        'Match not found'
      );
    });
  });

  describe('subscribeToMatchEvents', () => {
    it('should subscribe to all match events', () => {
      service.subscribeToMatchEvents();

      expect(mockSocketManager.subscribe).toHaveBeenCalledWith(
        'match:created',
        expect.any(Function)
      );
      expect(mockSocketManager.subscribe).toHaveBeenCalledWith(
        'match:accepted',
        expect.any(Function)
      );
      expect(mockSocketManager.subscribe).toHaveBeenCalledWith(
        'match:declined',
        expect.any(Function)
      );
      expect(mockSocketManager.subscribe).toHaveBeenCalledWith(
        'match:expired',
        expect.any(Function)
      );
    });

    it('should handle match:created event', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      service.subscribeToMatchEvents();

      // Get the handler that was registered
      const handler = mockSocketManager.subscribe.mock.calls.find(
        (call) => call[0] === 'match:created'
      )?.[1];

      const payload: MatchCreatedPayload = {
        match: {
          id: 'match-123',
          trackId: 'track-123',
          track: {
            id: 'track-123',
            title: 'Test Track',
            artist: 'Test Artist',
            album: 'Test Album',
            artwork: null,
            duration: 180,
            isrc: null,
            provider: 'spotify',
          },
          users: [],
          status: 'pending',
          createdAt: '2024-01-01T00:00:00Z',
          expiresAt: '2024-01-01T00:00:30Z',
        },
        timestamp: new Date(),
      };

      handler?.(payload);

      expect(consoleSpy).toHaveBeenCalledWith('Match created:', payload.match);
      consoleSpy.mockRestore();
    });
  });

  describe('unsubscribeFromMatchEvents', () => {
    it('should unsubscribe from all match events', () => {
      service.subscribeToMatchEvents();
      service.unsubscribeFromMatchEvents();

      expect(mockSocketManager.unsubscribe).toHaveBeenCalledWith(
        'match:created',
        expect.any(Function)
      );
      expect(mockSocketManager.unsubscribe).toHaveBeenCalledWith(
        'match:accepted',
        expect.any(Function)
      );
      expect(mockSocketManager.unsubscribe).toHaveBeenCalledWith(
        'match:declined',
        expect.any(Function)
      );
      expect(mockSocketManager.unsubscribe).toHaveBeenCalledWith(
        'match:expired',
        expect.any(Function)
      );
    });

    it('should clear event handlers map', () => {
      service.subscribeToMatchEvents();
      service.unsubscribeFromMatchEvents();

      // Subscribe again should create new handlers
      service.subscribeToMatchEvents();

      // Should have 4 new subscribe calls (not reusing old handlers)
      expect(mockSocketManager.subscribe).toHaveBeenCalledTimes(8); // 4 initial + 4 new
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', () => {
      expect(matchmakingService).toBeInstanceOf(MatchmakingService);
    });
  });
});
