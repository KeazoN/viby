import { renderHook, act } from '@testing-library/react-native';
import { useProfileStore } from './profile-store';
import type { Profile, Match, MusicStats } from '../types';

describe('useProfileStore', () => {
  const mockProfile: Profile = {
    id: 'profile-123',
    userId: 'user-123',
    username: 'testuser',
    avatar: 'https://example.com/avatar.jpg',
    bio: 'Test bio',
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

  const mockMusicStats: MusicStats = {
    topArtists: [
      {
        id: 'artist-1',
        name: 'Test Artist',
        image: 'https://example.com/artist.jpg',
        genres: ['rock', 'indie'],
      },
    ],
    topTracks: [
      {
        id: 'track-1',
        title: 'Test Track',
        artist: 'Test Artist',
        album: 'Test Album',
        artwork: 'https://example.com/track.jpg',
        duration: 180,
        isrc: 'USRC12345678',
        provider: 'spotify',
      },
    ],
    topGenres: ['rock', 'indie', 'pop'],
    totalListeningTime: 3600,
    totalMatches: 10,
    totalGamesPlayed: 15,
  };

  const mockMatch: Match = {
    id: 'match-123',
    users: [
      {
        id: 'user-123',
        username: 'testuser',
        avatar: 'https://example.com/avatar.jpg',
      },
      {
        id: 'user-456',
        username: 'opponent',
        avatar: 'https://example.com/opponent.jpg',
      },
    ],
    track: {
      id: 'track-1',
      title: 'Test Track',
      artist: 'Test Artist',
      album: 'Test Album',
      artwork: 'https://example.com/track.jpg',
      duration: 180,
      isrc: 'USRC12345678',
      provider: 'spotify',
    },
    gameResult: {
      winner: 'user-123',
      scores: {
        'user-123': 5,
        'user-456': 3,
      },
      totalRounds: 5,
    },
    createdAt: '2024-01-01T00:00:00Z',
    completedAt: '2024-01-01T00:10:00Z',
  };

  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useProfileStore());
    act(() => {
      result.current.clear();
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useProfileStore());

      expect(result.current.profile).toBeNull();
      expect(result.current.matchHistory).toEqual([]);
      expect(result.current.musicStats).toBeNull();
    });
  });

  describe('setProfile', () => {
    it('should set profile data', () => {
      const { result } = renderHook(() => useProfileStore());

      act(() => {
        result.current.setProfile(mockProfile);
      });

      expect(result.current.profile).toEqual(mockProfile);
    });

    it('should replace existing profile data', () => {
      const { result } = renderHook(() => useProfileStore());

      const firstProfile: Profile = { ...mockProfile, username: 'first' };
      const secondProfile: Profile = { ...mockProfile, username: 'second' };

      act(() => {
        result.current.setProfile(firstProfile);
      });

      expect(result.current.profile?.username).toBe('first');

      act(() => {
        result.current.setProfile(secondProfile);
      });

      expect(result.current.profile?.username).toBe('second');
    });
  });

  describe('updateProfile', () => {
    it('should update profile with partial data', () => {
      const { result } = renderHook(() => useProfileStore());

      act(() => {
        result.current.setProfile(mockProfile);
      });

      act(() => {
        result.current.updateProfile({
          username: 'updateduser',
          bio: 'Updated bio',
        });
      });

      expect(result.current.profile?.username).toBe('updateduser');
      expect(result.current.profile?.bio).toBe('Updated bio');
      expect(result.current.profile?.avatar).toBe(mockProfile.avatar);
    });

    it('should not update if profile is null', () => {
      const { result } = renderHook(() => useProfileStore());

      act(() => {
        result.current.updateProfile({
          username: 'updateduser',
        });
      });

      expect(result.current.profile).toBeNull();
    });

    it('should update nested preferences', () => {
      const { result } = renderHook(() => useProfileStore());

      act(() => {
        result.current.setProfile(mockProfile);
      });

      act(() => {
        result.current.updateProfile({
          preferences: {
            ...mockProfile.preferences,
            notificationsEnabled: false,
          },
        });
      });

      expect(result.current.profile?.preferences.notificationsEnabled).toBe(
        false
      );
      expect(result.current.profile?.preferences.matchNotifications).toBe(true);
    });
  });

  describe('setMatchHistory', () => {
    it('should set match history', () => {
      const { result } = renderHook(() => useProfileStore());

      const matches = [mockMatch];

      act(() => {
        result.current.setMatchHistory(matches);
      });

      expect(result.current.matchHistory).toEqual(matches);
      expect(result.current.matchHistory).toHaveLength(1);
    });

    it('should replace existing match history', () => {
      const { result } = renderHook(() => useProfileStore());

      const firstMatches = [mockMatch];
      const secondMatch: Match = { ...mockMatch, id: 'match-456' };
      const secondMatches = [mockMatch, secondMatch];

      act(() => {
        result.current.setMatchHistory(firstMatches);
      });

      expect(result.current.matchHistory).toHaveLength(1);

      act(() => {
        result.current.setMatchHistory(secondMatches);
      });

      expect(result.current.matchHistory).toHaveLength(2);
    });

    it('should handle empty match history', () => {
      const { result } = renderHook(() => useProfileStore());

      act(() => {
        result.current.setMatchHistory([mockMatch]);
      });

      expect(result.current.matchHistory).toHaveLength(1);

      act(() => {
        result.current.setMatchHistory([]);
      });

      expect(result.current.matchHistory).toEqual([]);
    });
  });

  describe('setMusicStats', () => {
    it('should set music statistics', () => {
      const { result } = renderHook(() => useProfileStore());

      act(() => {
        result.current.setMusicStats(mockMusicStats);
      });

      expect(result.current.musicStats).toEqual(mockMusicStats);
    });

    it('should replace existing music stats', () => {
      const { result } = renderHook(() => useProfileStore());

      const firstStats: MusicStats = {
        ...mockMusicStats,
        totalMatches: 5,
      };
      const secondStats: MusicStats = {
        ...mockMusicStats,
        totalMatches: 10,
      };

      act(() => {
        result.current.setMusicStats(firstStats);
      });

      expect(result.current.musicStats?.totalMatches).toBe(5);

      act(() => {
        result.current.setMusicStats(secondStats);
      });

      expect(result.current.musicStats?.totalMatches).toBe(10);
    });
  });

  describe('clear', () => {
    it('should clear all profile state', () => {
      const { result } = renderHook(() => useProfileStore());

      // Set all state
      act(() => {
        result.current.setProfile(mockProfile);
        result.current.setMatchHistory([mockMatch]);
        result.current.setMusicStats(mockMusicStats);
      });

      expect(result.current.profile).not.toBeNull();
      expect(result.current.matchHistory).toHaveLength(1);
      expect(result.current.musicStats).not.toBeNull();

      // Clear all state
      act(() => {
        result.current.clear();
      });

      expect(result.current.profile).toBeNull();
      expect(result.current.matchHistory).toEqual([]);
      expect(result.current.musicStats).toBeNull();
    });
  });

  describe('Behavior checks', () => {
    it('should validate Display user information', () => {
      const { result } = renderHook(() => useProfileStore());

      act(() => {
        result.current.setProfile(mockProfile);
      });

      // Profile should contain username, avatar, and music statistics
      expect(result.current.profile?.username).toBe('testuser');
      expect(result.current.profile?.avatar).toBe(
        'https://example.com/avatar.jpg'
      );
      expect(result.current.profile?.musicStats).toBeNull();

      act(() => {
        result.current.setMusicStats(mockMusicStats);
      });

      expect(result.current.musicStats).toEqual(mockMusicStats);
    });

    it('should validate Display match history', () => {
      const { result } = renderHook(() => useProfileStore());

      act(() => {
        result.current.setMatchHistory([mockMatch]);
      });

      // Match history should contain past opponents and game results
      expect(result.current.matchHistory).toHaveLength(1);
      expect(result.current.matchHistory[0].users).toHaveLength(2);
      expect(result.current.matchHistory[0].gameResult).toBeDefined();
      expect(result.current.matchHistory[0].gameResult?.winner).toBe(
        'user-123'
      );
    });

    it('should validate Support profile updates', () => {
      const { result } = renderHook(() => useProfileStore());

      act(() => {
        result.current.setProfile(mockProfile);
      });

      // Should support partial updates for optimistic updates
      act(() => {
        result.current.updateProfile({
          username: 'newusername',
          avatar: 'https://example.com/new-avatar.jpg',
        });
      });

      expect(result.current.profile?.username).toBe('newusername');
      expect(result.current.profile?.avatar).toBe(
        'https://example.com/new-avatar.jpg'
      );
      // Other fields should remain unchanged
      expect(result.current.profile?.bio).toBe('Test bio');
    });
  });
});
