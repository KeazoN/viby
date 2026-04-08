import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ProfileService, profileService } from './profile-service';
import { httpClient } from '@viby/shared/networking';
import type {
  Profile,
  MusicStats,
  GetProfileResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
  GetMatchHistoryResponse,
  GetMusicStatsResponse,
} from '../types';

// Mock dependencies
vi.mock('@viby/shared/networking', () => ({
  httpClient: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('ProfileService', () => {
  let service: ProfileService;

  beforeEach(() => {
    service = new ProfileService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getProfile', () => {
    it('should fetch user profile via HTTP client', async () => {
      const userId = 'user-123';
      const mockProfile: Profile = {
        id: 'profile-1',
        userId,
        username: 'testuser',
        avatar: 'https://example.com/avatar.jpg',
        bio: 'Music lover',
        musicStats: null,
        preferences: {
          notificationsEnabled: true,
          matchNotifications: true,
          messageNotifications: true,
          privacyMode: 'public',
        },
        spotifyLinked: true,
        deezerLinked: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const mockResponse: GetProfileResponse = {
        profile: mockProfile,
      };

      (httpClient.get as any).mockResolvedValue(mockResponse);

      const result = await service.getProfile(userId);

      expect(httpClient.get).toHaveBeenCalledWith(`/profile/${userId}`);
      expect(result).toEqual(mockProfile);
    });

    it('should handle get profile error', async () => {
      const userId = 'user-123';
      const error = new Error('Network error');

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      (httpClient.get as any).mockRejectedValue(error);

      await expect(service.getProfile(userId)).rejects.toThrow('Network error');

      expect(consoleSpy).toHaveBeenCalledWith('Failed to get profile:', error);
      consoleSpy.mockRestore();
    });

    it('should fetch profile with null avatar', async () => {
      const userId = 'user-456';
      const mockProfile: Profile = {
        id: 'profile-2',
        userId,
        username: 'anotheruser',
        avatar: null,
        bio: null,
        musicStats: null,
        preferences: {
          notificationsEnabled: false,
          matchNotifications: false,
          messageNotifications: false,
          privacyMode: 'private',
        },
        spotifyLinked: false,
        deezerLinked: true,
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      };

      const mockResponse: GetProfileResponse = {
        profile: mockProfile,
      };

      (httpClient.get as any).mockResolvedValue(mockResponse);

      const result = await service.getProfile(userId);

      expect(result.avatar).toBeNull();
      expect(result.bio).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('should update profile via HTTP client', async () => {
      const updates: UpdateProfileRequest = {
        username: 'newusername',
        avatar: 'https://example.com/new-avatar.jpg',
      };

      const mockProfile: Profile = {
        id: 'profile-1',
        userId: 'user-123',
        username: 'newusername',
        avatar: 'https://example.com/new-avatar.jpg',
        bio: 'Music lover',
        musicStats: null,
        preferences: {
          notificationsEnabled: true,
          matchNotifications: true,
          messageNotifications: true,
          privacyMode: 'public',
        },
        spotifyLinked: true,
        deezerLinked: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-03T00:00:00Z',
      };

      const mockResponse: UpdateProfileResponse = {
        profile: mockProfile,
      };

      (httpClient.patch as any).mockResolvedValue(mockResponse);

      const result = await service.updateProfile(updates);

      expect(httpClient.patch).toHaveBeenCalledWith('/profile', updates);
      expect(result).toEqual(mockProfile);
      expect(result.username).toBe('newusername');
    });

    it('should update only username', async () => {
      const updates: UpdateProfileRequest = {
        username: 'updatedname',
      };

      const mockProfile: Profile = {
        id: 'profile-1',
        userId: 'user-123',
        username: 'updatedname',
        avatar: 'https://example.com/avatar.jpg',
        bio: 'Music lover',
        musicStats: null,
        preferences: {
          notificationsEnabled: true,
          matchNotifications: true,
          messageNotifications: true,
          privacyMode: 'public',
        },
        spotifyLinked: true,
        deezerLinked: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-03T00:00:00Z',
      };

      const mockResponse: UpdateProfileResponse = {
        profile: mockProfile,
      };

      (httpClient.patch as any).mockResolvedValue(mockResponse);

      const result = await service.updateProfile(updates);

      expect(httpClient.patch).toHaveBeenCalledWith('/profile', updates);
      expect(result.username).toBe('updatedname');
    });

    it('should update preferences', async () => {
      const updates: UpdateProfileRequest = {
        preferences: {
          notificationsEnabled: false,
          matchNotifications: false,
        },
      };

      const mockProfile: Profile = {
        id: 'profile-1',
        userId: 'user-123',
        username: 'testuser',
        avatar: 'https://example.com/avatar.jpg',
        bio: 'Music lover',
        musicStats: null,
        preferences: {
          notificationsEnabled: false,
          matchNotifications: false,
          messageNotifications: true,
          privacyMode: 'public',
        },
        spotifyLinked: true,
        deezerLinked: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-03T00:00:00Z',
      };

      const mockResponse: UpdateProfileResponse = {
        profile: mockProfile,
      };

      (httpClient.patch as any).mockResolvedValue(mockResponse);

      const result = await service.updateProfile(updates);

      expect(result.preferences.notificationsEnabled).toBe(false);
      expect(result.preferences.matchNotifications).toBe(false);
    });

    it('should handle update profile error', async () => {
      const updates: UpdateProfileRequest = {
        username: 'newusername',
      };
      const error = new Error('Network error');

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      (httpClient.patch as any).mockRejectedValue(error);

      await expect(service.updateProfile(updates)).rejects.toThrow('Network error');

      expect(consoleSpy).toHaveBeenCalledWith('Failed to update profile:', error);
      consoleSpy.mockRestore();
    });
  });

  describe('getMatchHistory', () => {
    it('should fetch match history without pagination', async () => {
      const mockResponse: GetMatchHistoryResponse = {
        matches: [
          {
            id: 'match-1',
            users: [
              { id: 'user-1', username: 'user1', avatar: null },
              { id: 'user-2', username: 'user2', avatar: null },
            ],
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
            gameResult: {
              winner: 'user-1',
              scores: { 'user-1': 5, 'user-2': 3 },
              totalRounds: 5,
            },
            createdAt: '2024-01-01T00:00:00Z',
            completedAt: '2024-01-01T00:10:00Z',
          },
        ],
        hasMore: false,
        total: 1,
      };

      (httpClient.get as any).mockResolvedValue(mockResponse);

      const result = await service.getMatchHistory();

      expect(httpClient.get).toHaveBeenCalledWith('/profile/matches');
      expect(result).toEqual(mockResponse);
      expect(result.matches).toHaveLength(1);
    });

    it('should fetch match history with pagination', async () => {
      const options = { limit: 10, offset: 0 };

      const mockResponse: GetMatchHistoryResponse = {
        matches: [],
        hasMore: true,
        total: 25,
      };

      (httpClient.get as any).mockResolvedValue(mockResponse);

      const result = await service.getMatchHistory(options);

      expect(httpClient.get).toHaveBeenCalledWith('/profile/matches?limit=10&offset=0');
      expect(result.hasMore).toBe(true);
      expect(result.total).toBe(25);
    });

    it('should fetch match history with only limit', async () => {
      const options = { limit: 5 };

      const mockResponse: GetMatchHistoryResponse = {
        matches: [],
        hasMore: false,
        total: 3,
      };

      (httpClient.get as any).mockResolvedValue(mockResponse);

      const result = await service.getMatchHistory(options);

      expect(httpClient.get).toHaveBeenCalledWith('/profile/matches?limit=5');
      expect(result.total).toBe(3);
    });

    it('should fetch match history with only offset', async () => {
      const options = { offset: 10 };

      const mockResponse: GetMatchHistoryResponse = {
        matches: [],
        hasMore: false,
        total: 15,
      };

      (httpClient.get as any).mockResolvedValue(mockResponse);

      await service.getMatchHistory(options);

      expect(httpClient.get).toHaveBeenCalledWith('/profile/matches?offset=10');
    });

    it('should handle get match history error', async () => {
      const error = new Error('Network error');

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      (httpClient.get as any).mockRejectedValue(error);

      await expect(service.getMatchHistory()).rejects.toThrow('Network error');

      expect(consoleSpy).toHaveBeenCalledWith('Failed to get match history:', error);
      consoleSpy.mockRestore();
    });

    it('should return empty matches array', async () => {
      const mockResponse: GetMatchHistoryResponse = {
        matches: [],
        hasMore: false,
        total: 0,
      };

      (httpClient.get as any).mockResolvedValue(mockResponse);

      const result = await service.getMatchHistory();

      expect(result.matches).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('getMusicStats', () => {
    it('should fetch music statistics via HTTP client', async () => {
      const mockStats: MusicStats = {
        topArtists: [
          {
            id: 'artist-1',
            name: 'Artist One',
            image: 'https://example.com/artist1.jpg',
            genres: ['pop', 'rock'],
          },
          {
            id: 'artist-2',
            name: 'Artist Two',
            image: null,
            genres: ['jazz'],
          },
        ],
        topTracks: [
          {
            id: 'track-1',
            title: 'Track One',
            artist: 'Artist One',
            album: 'Album One',
            artwork: 'https://example.com/track1.jpg',
            duration: 200,
            isrc: 'USRC12345678',
            provider: 'spotify',
          },
        ],
        topGenres: ['pop', 'rock', 'jazz'],
        totalListeningTime: 36000,
        totalMatches: 15,
        totalGamesPlayed: 12,
      };

      const mockResponse: GetMusicStatsResponse = {
        stats: mockStats,
      };

      (httpClient.get as any).mockResolvedValue(mockResponse);

      const result = await service.getMusicStats();

      expect(httpClient.get).toHaveBeenCalledWith('/profile/music-stats');
      expect(result).toEqual(mockStats);
      expect(result.topArtists).toHaveLength(2);
      expect(result.topTracks).toHaveLength(1);
      expect(result.topGenres).toHaveLength(3);
    });

    it('should fetch empty music statistics', async () => {
      const mockStats: MusicStats = {
        topArtists: [],
        topTracks: [],
        topGenres: [],
        totalListeningTime: 0,
        totalMatches: 0,
        totalGamesPlayed: 0,
      };

      const mockResponse: GetMusicStatsResponse = {
        stats: mockStats,
      };

      (httpClient.get as any).mockResolvedValue(mockResponse);

      const result = await service.getMusicStats();

      expect(result.topArtists).toEqual([]);
      expect(result.totalListeningTime).toBe(0);
      expect(result.totalMatches).toBe(0);
    });

    it('should handle get music stats error', async () => {
      const error = new Error('Network error');

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      (httpClient.get as any).mockRejectedValue(error);

      await expect(service.getMusicStats()).rejects.toThrow('Network error');

      expect(consoleSpy).toHaveBeenCalledWith('Failed to get music stats:', error);
      consoleSpy.mockRestore();
    });

    it('should fetch music stats with large numbers', async () => {
      const mockStats: MusicStats = {
        topArtists: [],
        topTracks: [],
        topGenres: ['electronic', 'house', 'techno'],
        totalListeningTime: 1000000,
        totalMatches: 500,
        totalGamesPlayed: 450,
      };

      const mockResponse: GetMusicStatsResponse = {
        stats: mockStats,
      };

      (httpClient.get as any).mockResolvedValue(mockResponse);

      const result = await service.getMusicStats();

      expect(result.totalListeningTime).toBe(1000000);
      expect(result.totalMatches).toBe(500);
      expect(result.totalGamesPlayed).toBe(450);
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', () => {
      expect(profileService).toBeInstanceOf(ProfileService);
    });
  });
});
