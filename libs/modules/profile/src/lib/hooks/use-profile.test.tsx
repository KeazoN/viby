import { renderHook, act } from '@testing-library/react-native';
import { useProfile } from './use-profile';
import { useProfileStore } from '../stores/profile-store';
import type { Profile, Match, MusicStats } from '../types';

describe('useProfile', () => {
  beforeEach(() => {
    // Clear store before each test
    useProfileStore.getState().clear();
  });

  it('should return profile store state and actions', () => {
    const { result } = renderHook(() => useProfile());

    expect(result.current).toHaveProperty('profile');
    expect(result.current).toHaveProperty('matchHistory');
    expect(result.current).toHaveProperty('musicStats');
    expect(result.current).toHaveProperty('setProfile');
    expect(result.current).toHaveProperty('updateProfile');
    expect(result.current).toHaveProperty('setMatchHistory');
    expect(result.current).toHaveProperty('setMusicStats');
    expect(result.current).toHaveProperty('clear');
  });

  it('should have null profile initially', () => {
    const { result } = renderHook(() => useProfile());

    expect(result.current.profile).toBeNull();
    expect(result.current.matchHistory).toEqual([]);
    expect(result.current.musicStats).toBeNull();
  });

  it('should update profile when setProfile is called', () => {
    const { result } = renderHook(() => useProfile());

    const mockProfile: Profile = {
      id: 'profile-1',
      userId: 'user-1',
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

    act(() => {
      result.current.setProfile(mockProfile);
    });

    expect(result.current.profile).toEqual(mockProfile);
  });

  it('should update profile partially when updateProfile is called', () => {
    const { result } = renderHook(() => useProfile());

    const mockProfile: Profile = {
      id: 'profile-1',
      userId: 'user-1',
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

    act(() => {
      result.current.setProfile(mockProfile);
    });

    act(() => {
      result.current.updateProfile({ username: 'newusername', bio: 'New bio' });
    });

    expect(result.current.profile?.username).toBe('newusername');
    expect(result.current.profile?.bio).toBe('New bio');
    expect(result.current.profile?.avatar).toBe('https://example.com/avatar.jpg');
  });

  it('should set match history', () => {
    const { result } = renderHook(() => useProfile());

    const mockMatches: Match[] = [
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
    ];

    act(() => {
      result.current.setMatchHistory(mockMatches);
    });

    expect(result.current.matchHistory).toEqual(mockMatches);
  });

  it('should set music stats', () => {
    const { result } = renderHook(() => useProfile());

    const mockStats: MusicStats = {
      topArtists: [
        {
          id: 'artist-1',
          name: 'Test Artist',
          image: null,
          genres: ['rock', 'indie'],
        },
      ],
      topTracks: [
        {
          id: 'track-1',
          title: 'Test Track',
          artist: 'Test Artist',
          album: 'Test Album',
          artwork: null,
          duration: 180,
          isrc: null,
          provider: 'spotify',
        },
      ],
      topGenres: ['rock', 'indie', 'alternative'],
      totalListeningTime: 3600,
      totalMatches: 10,
      totalGamesPlayed: 8,
    };

    act(() => {
      result.current.setMusicStats(mockStats);
    });

    expect(result.current.musicStats).toEqual(mockStats);
  });

  it('should clear all state when clear is called', () => {
    const { result } = renderHook(() => useProfile());

    const mockProfile: Profile = {
      id: 'profile-1',
      userId: 'user-1',
      username: 'testuser',
      avatar: null,
      bio: null,
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

    act(() => {
      result.current.setProfile(mockProfile);
      result.current.setMatchHistory([]);
      result.current.setMusicStats({
        topArtists: [],
        topTracks: [],
        topGenres: [],
        totalListeningTime: 0,
        totalMatches: 0,
        totalGamesPlayed: 0,
      });
    });

    act(() => {
      result.current.clear();
    });

    expect(result.current.profile).toBeNull();
    expect(result.current.matchHistory).toEqual([]);
    expect(result.current.musicStats).toBeNull();
  });
});
