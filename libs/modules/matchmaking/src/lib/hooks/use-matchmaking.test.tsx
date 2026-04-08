import { renderHook, act } from '@testing-library/react';
import { useMatchmaking } from './use-matchmaking';
import { useMatchmakingStore } from '../stores/matchmaking-store';
import type { Match, Track, User } from '../types';

describe('useMatchmaking', () => {
  beforeEach(() => {
    // Clear store before each test
    const store = useMatchmakingStore.getState();
    store.clearActiveMatch();
  });

  it('should return matchmaking store state and actions', () => {
    const { result } = renderHook(() => useMatchmaking());

    expect(result.current).toHaveProperty('activeMatch');
    expect(result.current).toHaveProperty('matchStatus');
    expect(result.current).toHaveProperty('timeoutId');
    expect(result.current).toHaveProperty('setActiveMatch');
    expect(result.current).toHaveProperty('updateMatchStatus');
    expect(result.current).toHaveProperty('clearActiveMatch');
    expect(result.current).toHaveProperty('startMatchTimeout');
    expect(result.current).toHaveProperty('cancelMatchTimeout');
  });

  it('should have null initial state', () => {
    const { result } = renderHook(() => useMatchmaking());

    expect(result.current.activeMatch).toBeNull();
    expect(result.current.matchStatus).toBeNull();
    expect(result.current.timeoutId).toBeNull();
  });

  it('should set active match', () => {
    const { result } = renderHook(() => useMatchmaking());

    const track: Track = {
      id: 'track-1',
      title: 'Test Song',
      artist: 'Test Artist',
      album: 'Test Album',
      artwork: 'https://example.com/artwork.jpg',
      duration: 180,
      isrc: null,
      provider: 'spotify',
    };

    const user1: User = {
      id: 'user-1',
      username: 'testuser1',
      avatar: null,
    };

    const user2: User = {
      id: 'user-2',
      username: 'testuser2',
      avatar: null,
    };

    const match: Match = {
      id: 'match-1',
      trackId: 'track-1',
      track,
      users: [user1, user2],
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30000).toISOString(),
    };

    act(() => {
      result.current.setActiveMatch(match);
    });

    expect(result.current.activeMatch).toEqual(match);
    expect(result.current.matchStatus).toBe('pending');
  });

  it('should update match status', () => {
    const { result } = renderHook(() => useMatchmaking());

    const track: Track = {
      id: 'track-1',
      title: 'Test Song',
      artist: 'Test Artist',
      album: 'Test Album',
      artwork: 'https://example.com/artwork.jpg',
      duration: 180,
      isrc: null,
      provider: 'spotify',
    };

    const user1: User = {
      id: 'user-1',
      username: 'testuser1',
      avatar: null,
    };

    const user2: User = {
      id: 'user-2',
      username: 'testuser2',
      avatar: null,
    };

    const match: Match = {
      id: 'match-1',
      trackId: 'track-1',
      track,
      users: [user1, user2],
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30000).toISOString(),
    };

    act(() => {
      result.current.setActiveMatch(match);
    });

    expect(result.current.matchStatus).toBe('pending');

    act(() => {
      result.current.updateMatchStatus('accepted');
    });

    expect(result.current.matchStatus).toBe('accepted');
    expect(result.current.activeMatch?.status).toBe('accepted');
  });

  it('should clear active match', () => {
    const { result } = renderHook(() => useMatchmaking());

    const track: Track = {
      id: 'track-1',
      title: 'Test Song',
      artist: 'Test Artist',
      album: 'Test Album',
      artwork: 'https://example.com/artwork.jpg',
      duration: 180,
      isrc: null,
      provider: 'spotify',
    };

    const user1: User = {
      id: 'user-1',
      username: 'testuser1',
      avatar: null,
    };

    const user2: User = {
      id: 'user-2',
      username: 'testuser2',
      avatar: null,
    };

    const match: Match = {
      id: 'match-1',
      trackId: 'track-1',
      track,
      users: [user1, user2],
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30000).toISOString(),
    };

    act(() => {
      result.current.setActiveMatch(match);
    });

    expect(result.current.activeMatch).not.toBeNull();

    act(() => {
      result.current.clearActiveMatch();
    });

    expect(result.current.activeMatch).toBeNull();
    expect(result.current.matchStatus).toBeNull();
    expect(result.current.timeoutId).toBeNull();
  });

  it('should start match timeout and execute callback', () => {
    jest.useFakeTimers();

    const { result } = renderHook(() => useMatchmaking());
    const onExpire = jest.fn();

    act(() => {
      result.current.startMatchTimeout(onExpire);
    });

    expect(result.current.timeoutId).not.toBeNull();

    // Fast-forward time by 30 seconds
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    expect(onExpire).toHaveBeenCalled();
    expect(result.current.matchStatus).toBe('expired');

    jest.useRealTimers();
  });

  it('should cancel match timeout', () => {
    jest.useFakeTimers();

    const { result } = renderHook(() => useMatchmaking());
    const onExpire = jest.fn();

    act(() => {
      result.current.startMatchTimeout(onExpire);
    });

    expect(result.current.timeoutId).not.toBeNull();

    act(() => {
      result.current.cancelMatchTimeout();
    });

    expect(result.current.timeoutId).toBeNull();

    // Fast-forward time by 30 seconds
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    // Callback should not be called since timeout was cancelled
    expect(onExpire).not.toHaveBeenCalled();

    jest.useRealTimers();
  });

  it('should clear timeout when clearing active match', () => {
    jest.useFakeTimers();

    const { result } = renderHook(() => useMatchmaking());
    const onExpire = jest.fn();

    act(() => {
      result.current.startMatchTimeout(onExpire);
    });

    expect(result.current.timeoutId).not.toBeNull();

    act(() => {
      result.current.clearActiveMatch();
    });

    expect(result.current.timeoutId).toBeNull();

    // Fast-forward time by 30 seconds
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    // Callback should not be called since timeout was cleared
    expect(onExpire).not.toHaveBeenCalled();

    jest.useRealTimers();
  });

  it('should replace existing timeout when starting new one', () => {
    jest.useFakeTimers();

    const { result } = renderHook(() => useMatchmaking());
    const onExpire1 = jest.fn();
    const onExpire2 = jest.fn();

    act(() => {
      result.current.startMatchTimeout(onExpire1);
    });

    const firstTimeoutId = result.current.timeoutId;

    // Start a new timeout before the first one expires
    act(() => {
      result.current.startMatchTimeout(onExpire2);
    });

    const secondTimeoutId = result.current.timeoutId;

    expect(firstTimeoutId).not.toBe(secondTimeoutId);

    // Fast-forward time by 30 seconds
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    // Only the second callback should be called
    expect(onExpire1).not.toHaveBeenCalled();
    expect(onExpire2).toHaveBeenCalled();

    jest.useRealTimers();
  });
});
