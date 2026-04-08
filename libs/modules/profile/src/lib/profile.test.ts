import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { profileService } from './services/profile-service';
import { useProfileStore } from './stores/profile-store';
import { useProfile } from './hooks/use-profile';
import { useUpdateProfile } from './hooks/use-update-profile';
import { useMatchHistory } from './hooks/use-match-history';
import { useMusicStats } from './hooks/use-music-stats';
import { httpClient } from '@viby/shared/networking';
import type {
  Profile,
  MusicStats,
  Match,
  GetProfileResponse,
  UpdateProfileResponse,
  GetMatchHistoryResponse,
  GetMusicStatsResponse,
} from './types';

// Mock dependencies
jest.mock('@viby/shared/networking', () => ({
  httpClient: {
    get: jest.fn(),
    patch: jest.fn(),
  },
}));

/**
 * Integration tests for Profile Module
 * 
 * Tests the complete flow of profile functionality including:
 * - Profile fetching from API
 * - Profile updates with optimistic updates
 * - Match history fetching and display
 * - Integration between service, store, and hooks
 * - Error handling scenarios
 * 
 */
describe('Profile Module Integration Tests', () => {
  let queryClient: QueryClient;

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
    totalGamesPlayed: 8,
  };

  const mockMatches: Match[] = [
    {
      id: 'match-1',
      users: [
        { id: 'user-123', username: 'testuser', avatar: 'https://example.com/avatar.jpg' },
        { id: 'user-456', username: 'opponent', avatar: 'https://example.com/opponent.jpg' },
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
        scores: { 'user-123': 5, 'user-456': 3 },
        totalRounds: 5,
      },
      createdAt: '2024-01-01T00:00:00Z',
      completedAt: '2024-01-01T00:10:00Z',
    },
  ];

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Clear store before each test
    useProfileStore.getState().clear();

    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('Profile Fetching Integration', () => {
    /**
     * Display user information including username, avatar, and music statistics
     */
    it('should fetch profile from API and update store', async () => {
      const mockResponse: GetProfileResponse = {
        profile: mockProfile,
      };

      (httpClient.get as any).mockResolvedValue(mockResponse);

      // Fetch profile via service
      const profile = await profileService.getProfile('user-123');

      expect(httpClient.get).toHaveBeenCalledWith('/profile/user-123');
      expect(profile).toEqual(mockProfile);

      // Update store
      act(() => {
        useProfileStore.getState().setProfile(profile);
      });

      // Verify store state
      const storeProfile = useProfileStore.getState().profile;
      expect(storeProfile).toEqual(mockProfile);
      expect(storeProfile?.username).toBe('testuser');
      expect(storeProfile?.avatar).toBe('https://example.com/avatar.jpg');
    });

    it('should handle profile fetch errors gracefully', async () => {
      const error = new Error('Network error');
      (httpClient.get as any).mockRejectedValue(error);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await expect(profileService.getProfile('user-123')).rejects.toThrow('Network error');

      expect(consoleSpy).toHaveBeenCalledWith('Failed to get profile:', error);
      consoleSpy.mockRestore();
    });

    it('should fetch profile with null avatar and bio', async () => {
      const profileWithNulls: Profile = {
        ...mockProfile,
        avatar: null,
        bio: null,
      };

      const mockResponse: GetProfileResponse = {
        profile: profileWithNulls,
      };

      (httpClient.get as any).mockResolvedValue(mockResponse);

      const profile = await profileService.getProfile('user-123');

      expect(profile.avatar).toBeNull();
      expect(profile.bio).toBeNull();
    });
  });

  describe('Profile Updates Integration', () => {
    /**
     * Send updates to Backend_API when profile changes are saved
     */
    it('should update profile with optimistic updates', async () => {
      // Set initial profile in store
      act(() => {
        useProfileStore.getState().setProfile(mockProfile);
      });

      const updatedProfile: Profile = {
        ...mockProfile,
        username: 'newusername',
        avatar: 'https://example.com/new-avatar.jpg',
        updatedAt: '2024-01-02T00:00:00Z',
      };

      const mockResponse: UpdateProfileResponse = {
        profile: updatedProfile,
      };

      (httpClient.patch as any).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useUpdateProfile(), { wrapper });

      // Perform optimistic update
      act(() => {
        result.current.mutate({
          username: 'newusername',
          avatar: 'https://example.com/new-avatar.jpg',
        });
      });

      // Check optimistic update in store (should be immediate)
      await waitFor(() => {
        const storeProfile = useProfileStore.getState().profile;
        expect(storeProfile?.username).toBe('newusername');
        expect(storeProfile?.avatar).toBe('https://example.com/new-avatar.jpg');
      });

      // Wait for mutation to complete
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(httpClient.patch).toHaveBeenCalledWith('/profile', {
        username: 'newusername',
        avatar: 'https://example.com/new-avatar.jpg',
      });
    });

    it('should rollback optimistic update on error', async () => {
      // Set initial profile in store
      act(() => {
        useProfileStore.getState().setProfile(mockProfile);
      });

      const error = new Error('Update failed');
      (httpClient.patch as any).mockRejectedValue(error);

      const { result } = renderHook(() => useUpdateProfile(), { wrapper });

      act(() => {
        result.current.mutate({ username: 'newusername' });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Check that store was rolled back to original value
      const storeProfile = useProfileStore.getState().profile;
      expect(storeProfile?.username).toBe('testuser');
    });

    it('should update multiple profile fields', async () => {
      act(() => {
        useProfileStore.getState().setProfile(mockProfile);
      });

      const updatedProfile: Profile = {
        ...mockProfile,
        username: 'newusername',
        bio: 'New bio',
        preferences: {
          ...mockProfile.preferences,
          notificationsEnabled: false,
        },
        updatedAt: '2024-01-02T00:00:00Z',
      };

      const mockResponse: UpdateProfileResponse = {
        profile: updatedProfile,
      };

      (httpClient.patch as any).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useUpdateProfile(), { wrapper });

      act(() => {
        result.current.mutate({
          username: 'newusername',
          bio: 'New bio',
          preferences: {
            notificationsEnabled: false,
          },
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const storeProfile = useProfileStore.getState().profile;
      expect(storeProfile?.username).toBe('newusername');
      expect(storeProfile?.bio).toBe('New bio');
      expect(storeProfile?.preferences.notificationsEnabled).toBe(false);
    });
  });

  describe('Match History Integration', () => {
    /**
     * Display match history with past opponents and game results
     */
    it('should fetch match history and sync with store', async () => {
      const mockResponse: GetMatchHistoryResponse = {
        matches: mockMatches,
        hasMore: false,
        total: 1,
      };

      (httpClient.get as any).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useMatchHistory('user-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(httpClient.get).toHaveBeenCalledWith('/profile/matches?limit=20&offset=0');
      expect(result.current.data).toEqual(mockResponse);

      // Check that store was updated
      const storeMatches = useProfileStore.getState().matchHistory;
      expect(storeMatches).toEqual(mockMatches);
      expect(storeMatches[0].users).toHaveLength(2);
      expect(storeMatches[0].gameResult?.winner).toBe('user-123');
    });

    it('should support pagination for match history', async () => {
      const mockResponse: GetMatchHistoryResponse = {
        matches: mockMatches,
        hasMore: true,
        total: 25,
      };

      (httpClient.get as any).mockResolvedValue(mockResponse);

      const { result } = renderHook(
        () => useMatchHistory('user-123', { limit: 10, offset: 0 }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(httpClient.get).toHaveBeenCalledWith('/profile/matches?limit=10&offset=0');
      expect(result.current.data?.hasMore).toBe(true);
      expect(result.current.data?.total).toBe(25);
    });

    it('should handle empty match history', async () => {
      const mockResponse: GetMatchHistoryResponse = {
        matches: [],
        hasMore: false,
        total: 0,
      };

      (httpClient.get as any).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useMatchHistory('user-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.matches).toEqual([]);
      expect(result.current.data?.total).toBe(0);

      const storeMatches = useProfileStore.getState().matchHistory;
      expect(storeMatches).toEqual([]);
    });

    it('should handle match history fetch errors', async () => {
      const error = new Error('Failed to fetch match history');
      (httpClient.get as any).mockRejectedValue(error);

      const { result } = renderHook(() => useMatchHistory('user-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });

  describe('Music Statistics Integration', () => {
    it('should fetch music stats and sync with store', async () => {
      const mockResponse: GetMusicStatsResponse = {
        stats: mockMusicStats,
      };

      (httpClient.get as any).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useMusicStats('user-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(httpClient.get).toHaveBeenCalledWith('/profile/music-stats');
      expect(result.current.data).toEqual(mockMusicStats);

      // Check that store was updated
      const storeStats = useProfileStore.getState().musicStats;
      expect(storeStats).toEqual(mockMusicStats);
      expect(storeStats?.topArtists).toHaveLength(1);
      expect(storeStats?.topTracks).toHaveLength(1);
      expect(storeStats?.topGenres).toHaveLength(3);
    });

    it('should handle empty music stats', async () => {
      const emptyStats: MusicStats = {
        topArtists: [],
        topTracks: [],
        topGenres: [],
        totalListeningTime: 0,
        totalMatches: 0,
        totalGamesPlayed: 0,
      };

      const mockResponse: GetMusicStatsResponse = {
        stats: emptyStats,
      };

      (httpClient.get as any).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useMusicStats('user-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(emptyStats);

      const storeStats = useProfileStore.getState().musicStats;
      expect(storeStats).toEqual(emptyStats);
    });
  });

  describe('Complete Profile Flow Integration', () => {
    /**
     * Tests the complete flow: fetch profile -> update profile -> fetch match history
     */
    it('should handle complete profile workflow', async () => {
      // Step 1: Fetch profile
      const profileResponse: GetProfileResponse = {
        profile: mockProfile,
      };

      (httpClient.get as any).mockResolvedValueOnce(profileResponse);

      const profile = await profileService.getProfile('user-123');

      act(() => {
        useProfileStore.getState().setProfile(profile);
      });

      expect(useProfileStore.getState().profile).toEqual(mockProfile);

      // Step 2: Update profile
      const updatedProfile: Profile = {
        ...mockProfile,
        username: 'updateduser',
        updatedAt: '2024-01-02T00:00:00Z',
      };

      const updateResponse: UpdateProfileResponse = {
        profile: updatedProfile,
      };

      (httpClient.patch as any).mockResolvedValueOnce(updateResponse);

      const { result: updateResult } = renderHook(() => useUpdateProfile(), { wrapper });

      act(() => {
        updateResult.current.mutate({ username: 'updateduser' });
      });

      await waitFor(() => {
        expect(updateResult.current.isSuccess).toBe(true);
      });

      expect(useProfileStore.getState().profile?.username).toBe('updateduser');

      // Step 3: Fetch match history
      const matchHistoryResponse: GetMatchHistoryResponse = {
        matches: mockMatches,
        hasMore: false,
        total: 1,
      };

      (httpClient.get as any).mockResolvedValueOnce(matchHistoryResponse);

      const { result: matchResult } = renderHook(() => useMatchHistory('user-123'), { wrapper });

      await waitFor(() => {
        expect(matchResult.current.isSuccess).toBe(true);
      });

      expect(useProfileStore.getState().matchHistory).toEqual(mockMatches);

      // Step 4: Fetch music stats
      const statsResponse: GetMusicStatsResponse = {
        stats: mockMusicStats,
      };

      (httpClient.get as any).mockResolvedValueOnce(statsResponse);

      const { result: statsResult } = renderHook(() => useMusicStats('user-123'), { wrapper });

      await waitFor(() => {
        expect(statsResult.current.isSuccess).toBe(true);
      });

      expect(useProfileStore.getState().musicStats).toEqual(mockMusicStats);

      // Verify complete state
      const finalState = useProfileStore.getState();
      expect(finalState.profile?.username).toBe('updateduser');
      expect(finalState.matchHistory).toHaveLength(1);
      expect(finalState.musicStats).toEqual(mockMusicStats);
    });

    it('should handle errors at different stages of workflow', async () => {
      // Step 1: Profile fetch succeeds
      const profileResponse: GetProfileResponse = {
        profile: mockProfile,
      };

      (httpClient.get as any).mockResolvedValueOnce(profileResponse);

      const profile = await profileService.getProfile('user-123');

      act(() => {
        useProfileStore.getState().setProfile(profile);
      });

      // Step 2: Profile update fails
      const updateError = new Error('Update failed');
      (httpClient.patch as any).mockRejectedValueOnce(updateError);

      const { result: updateResult } = renderHook(() => useUpdateProfile(), { wrapper });

      act(() => {
        updateResult.current.mutate({ username: 'newusername' });
      });

      await waitFor(() => {
        expect(updateResult.current.isError).toBe(true);
      });

      // Profile should be rolled back
      expect(useProfileStore.getState().profile?.username).toBe('testuser');

      // Step 3: Match history fetch fails
      const matchError = new Error('Match history fetch failed');
      (httpClient.get as any).mockRejectedValueOnce(matchError);

      const { result: matchResult } = renderHook(() => useMatchHistory('user-123'), { wrapper });

      await waitFor(() => {
        expect(matchResult.current.isError).toBe(true);
      });

      expect(matchResult.current.error).toEqual(matchError);
    });
  });

  describe('Store State Management', () => {
    it('should clear all profile state', () => {
      // Set all state
      act(() => {
        useProfileStore.getState().setProfile(mockProfile);
        useProfileStore.getState().setMatchHistory(mockMatches);
        useProfileStore.getState().setMusicStats(mockMusicStats);
      });

      expect(useProfileStore.getState().profile).not.toBeNull();
      expect(useProfileStore.getState().matchHistory).toHaveLength(1);
      expect(useProfileStore.getState().musicStats).not.toBeNull();

      // Clear all state
      act(() => {
        useProfileStore.getState().clear();
      });

      expect(useProfileStore.getState().profile).toBeNull();
      expect(useProfileStore.getState().matchHistory).toEqual([]);
      expect(useProfileStore.getState().musicStats).toBeNull();
    });

    it('should handle partial profile updates', () => {
      act(() => {
        useProfileStore.getState().setProfile(mockProfile);
      });

      act(() => {
        useProfileStore.getState().updateProfile({
          username: 'partialupdate',
        });
      });

      const profile = useProfileStore.getState().profile;
      expect(profile?.username).toBe('partialupdate');
      expect(profile?.avatar).toBe(mockProfile.avatar);
      expect(profile?.bio).toBe(mockProfile.bio);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors during profile fetch', async () => {
      const error = new Error('Network error');
      (httpClient.get as any).mockRejectedValue(error);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await expect(profileService.getProfile('user-123')).rejects.toThrow('Network error');

      expect(consoleSpy).toHaveBeenCalledWith('Failed to get profile:', error);
      consoleSpy.mockRestore();
    });

    it('should handle network errors during profile update', async () => {
      const error = new Error('Network error');
      (httpClient.patch as any).mockRejectedValue(error);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await expect(
        profileService.updateProfile({ username: 'newusername' })
      ).rejects.toThrow('Network error');

      expect(consoleSpy).toHaveBeenCalledWith('Failed to update profile:', error);
      consoleSpy.mockRestore();
    });

    it('should handle network errors during match history fetch', async () => {
      const error = new Error('Network error');
      (httpClient.get as any).mockRejectedValue(error);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await expect(profileService.getMatchHistory()).rejects.toThrow('Network error');

      expect(consoleSpy).toHaveBeenCalledWith('Failed to get match history:', error);
      consoleSpy.mockRestore();
    });

    it('should handle network errors during music stats fetch', async () => {
      const error = new Error('Network error');
      (httpClient.get as any).mockRejectedValue(error);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await expect(profileService.getMusicStats()).rejects.toThrow('Network error');

      expect(consoleSpy).toHaveBeenCalledWith('Failed to get music stats:', error);
      consoleSpy.mockRestore();
    });
  });
});
