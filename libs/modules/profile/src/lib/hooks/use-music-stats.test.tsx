import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMusicStats } from './use-music-stats';
import { useProfileStore } from '../stores/profile-store';
import { profileService } from '../services/profile-service';
import type { MusicStats } from '../types';
import React from 'react';

// Mock the profile service
jest.mock('../services/profile-service');

const mockProfileService = profileService as jest.Mocked<typeof profileService>;

describe('useMusicStats', () => {
  let queryClient: QueryClient;

  const mockStats: MusicStats = {
    topArtists: [
      {
        id: 'artist-1',
        name: 'Test Artist 1',
        image: 'https://example.com/artist1.jpg',
        genres: ['rock', 'indie'],
      },
      {
        id: 'artist-2',
        name: 'Test Artist 2',
        image: 'https://example.com/artist2.jpg',
        genres: ['pop', 'electronic'],
      },
    ],
    topTracks: [
      {
        id: 'track-1',
        title: 'Test Track 1',
        artist: 'Test Artist 1',
        album: 'Test Album 1',
        artwork: 'https://example.com/track1.jpg',
        duration: 180,
        isrc: 'USRC12345678',
        provider: 'spotify',
      },
      {
        id: 'track-2',
        title: 'Test Track 2',
        artist: 'Test Artist 2',
        album: 'Test Album 2',
        artwork: 'https://example.com/track2.jpg',
        duration: 200,
        isrc: 'USRC87654321',
        provider: 'deezer',
      },
    ],
    topGenres: ['rock', 'indie', 'pop', 'electronic', 'alternative'],
    totalListeningTime: 7200, // 2 hours
    totalMatches: 25,
    totalGamesPlayed: 20,
  };

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

  it('should fetch music stats successfully', async () => {
    mockProfileService.getMusicStats.mockResolvedValue(mockStats);

    const { result } = renderHook(() => useMusicStats('user-1'), { wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockStats);
    expect(mockProfileService.getMusicStats).toHaveBeenCalled();
  });

  it('should sync with store by default', async () => {
    mockProfileService.getMusicStats.mockResolvedValue(mockStats);

    const { result } = renderHook(() => useMusicStats('user-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Check that store was updated
    const storeStats = useProfileStore.getState().musicStats;
    expect(storeStats).toEqual(mockStats);
  });

  it('should not sync with store when syncWithStore is false', async () => {
    mockProfileService.getMusicStats.mockResolvedValue(mockStats);

    const { result } = renderHook(
      () => useMusicStats('user-1', { syncWithStore: false }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Check that store was NOT updated
    const storeStats = useProfileStore.getState().musicStats;
    expect(storeStats).toBeNull();
  });

  it('should handle errors gracefully', async () => {
    const error = new Error('Failed to fetch music stats');
    mockProfileService.getMusicStats.mockRejectedValue(error);

    const { result } = renderHook(() => useMusicStats('user-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });

  it('should not fetch when userId is empty', async () => {
    const { result } = renderHook(() => useMusicStats(''), { wrapper });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(mockProfileService.getMusicStats).not.toHaveBeenCalled();
  });

  it('should cache results', async () => {
    mockProfileService.getMusicStats.mockResolvedValue(mockStats);

    const { result: result1 } = renderHook(() => useMusicStats('user-1'), {
      wrapper,
    });

    await waitFor(() => {
      expect(result1.current.isSuccess).toBe(true);
    });

    expect(mockProfileService.getMusicStats).toHaveBeenCalledTimes(1);

    // Second hook with same userId should use cache
    const { result: result2 } = renderHook(() => useMusicStats('user-1'), {
      wrapper,
    });

    await waitFor(() => {
      expect(result2.current.isSuccess).toBe(true);
    });

    // Should still be called only once due to caching
    expect(mockProfileService.getMusicStats).toHaveBeenCalledTimes(1);
    expect(result2.current.data).toEqual(mockStats);
  });

  it('should refetch when refetch is called', async () => {
    mockProfileService.getMusicStats.mockResolvedValue(mockStats);

    const { result } = renderHook(() => useMusicStats('user-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockProfileService.getMusicStats).toHaveBeenCalledTimes(1);

    // Refetch
    result.current.refetch();

    await waitFor(() => {
      expect(mockProfileService.getMusicStats).toHaveBeenCalledTimes(2);
    });
  });

  it('should support custom stale time', async () => {
    mockProfileService.getMusicStats.mockResolvedValue(mockStats);

    const customStaleTime = 1000 * 60 * 5; // 5 minutes

    const { result } = renderHook(
      () => useMusicStats('user-1', { staleTime: customStaleTime }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockStats);
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

    mockProfileService.getMusicStats.mockResolvedValue(emptyStats);

    const { result } = renderHook(() => useMusicStats('user-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(emptyStats);

    // Store should be updated with empty stats
    const storeStats = useProfileStore.getState().musicStats;
    expect(storeStats).toEqual(emptyStats);
  });

  it('should handle partial music stats', async () => {
    const partialStats: MusicStats = {
      topArtists: [
        {
          id: 'artist-1',
          name: 'Test Artist',
          image: null,
          genres: [],
        },
      ],
      topTracks: [],
      topGenres: ['rock'],
      totalListeningTime: 100,
      totalMatches: 1,
      totalGamesPlayed: 0,
    };

    mockProfileService.getMusicStats.mockResolvedValue(partialStats);

    const { result } = renderHook(() => useMusicStats('user-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(partialStats);
    expect(result.current.data?.topArtists).toHaveLength(1);
    expect(result.current.data?.topTracks).toHaveLength(0);
  });

  it('should provide loading state', async () => {
    mockProfileService.getMusicStats.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(mockStats), 50);
        })
    );

    const { result } = renderHook(() => useMusicStats('user-1'), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toEqual(mockStats);
  });

  it('should handle multiple top artists and tracks', async () => {
    const largeStats: MusicStats = {
      topArtists: Array.from({ length: 10 }, (_, i) => ({
        id: `artist-${i}`,
        name: `Artist ${i}`,
        image: `https://example.com/artist${i}.jpg`,
        genres: ['genre1', 'genre2'],
      })),
      topTracks: Array.from({ length: 20 }, (_, i) => ({
        id: `track-${i}`,
        title: `Track ${i}`,
        artist: `Artist ${i}`,
        album: `Album ${i}`,
        artwork: `https://example.com/track${i}.jpg`,
        duration: 180 + i,
        isrc: `ISRC${i}`,
        provider: i % 2 === 0 ? ('spotify' as const) : ('deezer' as const),
      })),
      topGenres: ['rock', 'pop', 'indie', 'electronic', 'jazz'],
      totalListeningTime: 36000,
      totalMatches: 100,
      totalGamesPlayed: 85,
    };

    mockProfileService.getMusicStats.mockResolvedValue(largeStats);

    const { result } = renderHook(() => useMusicStats('user-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.topArtists).toHaveLength(10);
    expect(result.current.data?.topTracks).toHaveLength(20);
    expect(result.current.data?.topGenres).toHaveLength(5);
  });
});
