import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMatchHistory } from './use-match-history';
import { useProfileStore } from '../stores/profile-store';
import { profileService } from '../services/profile-service';
import type { GetMatchHistoryResponse, Match } from '../types';
import React from 'react';

// Mock the profile service
jest.mock('../services/profile-service');

const mockProfileService = profileService as jest.Mocked<typeof profileService>;

describe('useMatchHistory', () => {
  let queryClient: QueryClient;

  const mockMatches: Match[] = [
    {
      id: 'match-1',
      users: [
        { id: 'user-1', username: 'user1', avatar: null },
        { id: 'user-2', username: 'user2', avatar: null },
      ],
      track: {
        id: 'track-1',
        title: 'Test Track 1',
        artist: 'Test Artist 1',
        album: 'Test Album 1',
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
    {
      id: 'match-2',
      users: [
        { id: 'user-1', username: 'user1', avatar: null },
        { id: 'user-3', username: 'user3', avatar: null },
      ],
      track: {
        id: 'track-2',
        title: 'Test Track 2',
        artist: 'Test Artist 2',
        album: 'Test Album 2',
        artwork: null,
        duration: 200,
        isrc: null,
        provider: 'deezer',
      },
      gameResult: {
        winner: 'user-3',
        scores: { 'user-1': 2, 'user-3': 4 },
        totalRounds: 5,
      },
      createdAt: '2024-01-02T00:00:00Z',
      completedAt: '2024-01-02T00:10:00Z',
    },
  ];

  const mockResponse: GetMatchHistoryResponse = {
    matches: mockMatches,
    hasMore: false,
    total: 2,
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

  it('should fetch match history successfully', async () => {
    mockProfileService.getMatchHistory.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useMatchHistory('user-1'), { wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockResponse);
    expect(mockProfileService.getMatchHistory).toHaveBeenCalledWith({
      limit: 20,
      offset: 0,
    });
  });

  it('should sync with store by default', async () => {
    mockProfileService.getMatchHistory.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useMatchHistory('user-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Check that store was updated
    const storeMatches = useProfileStore.getState().matchHistory;
    expect(storeMatches).toEqual(mockMatches);
  });

  it('should not sync with store when syncWithStore is false', async () => {
    mockProfileService.getMatchHistory.mockResolvedValue(mockResponse);

    const { result } = renderHook(
      () => useMatchHistory('user-1', { syncWithStore: false }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Check that store was NOT updated
    const storeMatches = useProfileStore.getState().matchHistory;
    expect(storeMatches).toEqual([]);
  });

  it('should support pagination with limit and offset', async () => {
    mockProfileService.getMatchHistory.mockResolvedValue(mockResponse);

    const { result } = renderHook(
      () => useMatchHistory('user-1', { limit: 10, offset: 5 }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockProfileService.getMatchHistory).toHaveBeenCalledWith({
      limit: 10,
      offset: 5,
    });
  });

  it('should handle errors gracefully', async () => {
    const error = new Error('Failed to fetch match history');
    mockProfileService.getMatchHistory.mockRejectedValue(error);

    const { result } = renderHook(() => useMatchHistory('user-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });

  it('should not fetch when userId is empty', async () => {
    const { result } = renderHook(() => useMatchHistory(''), { wrapper });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(mockProfileService.getMatchHistory).not.toHaveBeenCalled();
  });

  it('should cache results', async () => {
    mockProfileService.getMatchHistory.mockResolvedValue(mockResponse);

    const { result: result1 } = renderHook(() => useMatchHistory('user-1'), {
      wrapper,
    });

    await waitFor(() => {
      expect(result1.current.isSuccess).toBe(true);
    });

    expect(mockProfileService.getMatchHistory).toHaveBeenCalledTimes(1);

    // Second hook with same userId should use cache
    const { result: result2 } = renderHook(() => useMatchHistory('user-1'), {
      wrapper,
    });

    await waitFor(() => {
      expect(result2.current.isSuccess).toBe(true);
    });

    // Should still be called only once due to caching
    expect(mockProfileService.getMatchHistory).toHaveBeenCalledTimes(1);
    expect(result2.current.data).toEqual(mockResponse);
  });

  it('should refetch when refetch is called', async () => {
    mockProfileService.getMatchHistory.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useMatchHistory('user-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockProfileService.getMatchHistory).toHaveBeenCalledTimes(1);

    // Refetch
    result.current.refetch();

    await waitFor(() => {
      expect(mockProfileService.getMatchHistory).toHaveBeenCalledTimes(2);
    });
  });

  it('should handle empty match history', async () => {
    const emptyResponse: GetMatchHistoryResponse = {
      matches: [],
      hasMore: false,
      total: 0,
    };

    mockProfileService.getMatchHistory.mockResolvedValue(emptyResponse);

    const { result } = renderHook(() => useMatchHistory('user-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.matches).toEqual([]);
    expect(result.current.data?.total).toBe(0);

    // Store should be updated with empty array
    const storeMatches = useProfileStore.getState().matchHistory;
    expect(storeMatches).toEqual([]);
  });

  it('should handle pagination with hasMore flag', async () => {
    const paginatedResponse: GetMatchHistoryResponse = {
      matches: [mockMatches[0]],
      hasMore: true,
      total: 10,
    };

    mockProfileService.getMatchHistory.mockResolvedValue(paginatedResponse);

    const { result } = renderHook(
      () => useMatchHistory('user-1', { limit: 1, offset: 0 }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.hasMore).toBe(true);
    expect(result.current.data?.total).toBe(10);
    expect(result.current.data?.matches).toHaveLength(1);
  });
});
