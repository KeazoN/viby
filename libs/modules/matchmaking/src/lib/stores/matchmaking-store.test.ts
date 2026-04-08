import { renderHook, act } from '@testing-library/react';
import { useMatchmakingStore } from './matchmaking-store';
import type { Match } from '../types';

// Mock match data
const mockMatch: Match = {
  id: 'match-1',
  trackId: 'track-1',
  track: {
    id: 'track-1',
    title: 'Test Track',
    artist: 'Test Artist',
    album: 'Test Album',
    artwork: 'https://example.com/artwork.jpg',
    duration: 180000,
    isrc: 'TEST123',
    provider: 'spotify',
  },
  users: [
    {
      id: 'user-1',
      username: 'testuser1',
      avatar: 'https://example.com/avatar1.jpg',
    },
    {
      id: 'user-2',
      username: 'testuser2',
      avatar: 'https://example.com/avatar2.jpg',
    },
  ],
  status: 'pending',
  createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 30000).toISOString(),
};

describe('MatchmakingStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useMatchmakingStore());
    act(() => {
      result.current.clearActiveMatch();
    });
  });

  afterEach(() => {
    // Clean up any pending timeouts
    jest.clearAllTimers();
  });

  describe('setActiveMatch', () => {
    it('should set the active match', () => {
      const { result } = renderHook(() => useMatchmakingStore());

      act(() => {
        result.current.setActiveMatch(mockMatch);
      });

      expect(result.current.activeMatch).toEqual(mockMatch);
      expect(result.current.matchStatus).toBe('pending');
    });

    it('should update match status from the match object', () => {
      const { result } = renderHook(() => useMatchmakingStore());
      const acceptedMatch = { ...mockMatch, status: 'accepted' as const };

      act(() => {
        result.current.setActiveMatch(acceptedMatch);
      });

      expect(result.current.matchStatus).toBe('accepted');
    });
  });

  describe('updateMatchStatus', () => {
    it('should update the match status', () => {
      const { result } = renderHook(() => useMatchmakingStore());

      act(() => {
        result.current.setActiveMatch(mockMatch);
        result.current.updateMatchStatus('accepted');
      });

      expect(result.current.matchStatus).toBe('accepted');
      expect(result.current.activeMatch?.status).toBe('accepted');
    });

    it('should handle status update when no active match', () => {
      const { result } = renderHook(() => useMatchmakingStore());

      act(() => {
        result.current.updateMatchStatus('declined');
      });

      expect(result.current.matchStatus).toBe('declined');
      expect(result.current.activeMatch).toBeNull();
    });
  });

  describe('clearActiveMatch', () => {
    it('should clear the active match and status', () => {
      const { result } = renderHook(() => useMatchmakingStore());

      act(() => {
        result.current.setActiveMatch(mockMatch);
        result.current.clearActiveMatch();
      });

      expect(result.current.activeMatch).toBeNull();
      expect(result.current.matchStatus).toBeNull();
    });

    it('should cancel any pending timeout', () => {
      jest.useFakeTimers();
      const { result } = renderHook(() => useMatchmakingStore());
      const onExpire = jest.fn();

      act(() => {
        result.current.setActiveMatch(mockMatch);
        result.current.startMatchTimeout(onExpire);
        result.current.clearActiveMatch();
      });

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      // Callback should not be called since timeout was cancelled
      expect(onExpire).not.toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe('startMatchTimeout', () => {
    it('should call onExpire callback after 30 seconds', () => {
      jest.useFakeTimers();
      const { result } = renderHook(() => useMatchmakingStore());
      const onExpire = jest.fn();

      act(() => {
        result.current.setActiveMatch(mockMatch);
        result.current.startMatchTimeout(onExpire);
      });

      // Fast-forward time by 30 seconds
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      expect(onExpire).toHaveBeenCalledTimes(1);
      expect(result.current.matchStatus).toBe('expired');
      expect(result.current.activeMatch?.status).toBe('expired');

      jest.useRealTimers();
    });

    it('should not call onExpire if less than 30 seconds have passed', () => {
      jest.useFakeTimers();
      const { result } = renderHook(() => useMatchmakingStore());
      const onExpire = jest.fn();

      act(() => {
        result.current.setActiveMatch(mockMatch);
        result.current.startMatchTimeout(onExpire);
      });

      // Fast-forward time by 29 seconds
      act(() => {
        jest.advanceTimersByTime(29000);
      });

      expect(onExpire).not.toHaveBeenCalled();
      expect(result.current.matchStatus).toBe('pending');

      jest.useRealTimers();
    });

    it('should cancel previous timeout when starting a new one', () => {
      jest.useFakeTimers();
      const { result } = renderHook(() => useMatchmakingStore());
      const onExpire1 = jest.fn();
      const onExpire2 = jest.fn();

      act(() => {
        result.current.setActiveMatch(mockMatch);
        result.current.startMatchTimeout(onExpire1);
      });

      // Start a new timeout before the first one expires
      act(() => {
        jest.advanceTimersByTime(15000);
        result.current.startMatchTimeout(onExpire2);
      });

      // Fast-forward to when the first timeout would have expired
      act(() => {
        jest.advanceTimersByTime(15000);
      });

      // First callback should not be called
      expect(onExpire1).not.toHaveBeenCalled();
      expect(onExpire2).not.toHaveBeenCalled();

      // Fast-forward to when the second timeout expires
      act(() => {
        jest.advanceTimersByTime(15000);
      });

      // Only second callback should be called
      expect(onExpire1).not.toHaveBeenCalled();
      expect(onExpire2).toHaveBeenCalledTimes(1);

      jest.useRealTimers();
    });
  });

  describe('cancelMatchTimeout', () => {
    it('should cancel the timeout', () => {
      jest.useFakeTimers();
      const { result } = renderHook(() => useMatchmakingStore());
      const onExpire = jest.fn();

      act(() => {
        result.current.setActiveMatch(mockMatch);
        result.current.startMatchTimeout(onExpire);
        result.current.cancelMatchTimeout();
      });

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      // Callback should not be called
      expect(onExpire).not.toHaveBeenCalled();
      expect(result.current.matchStatus).toBe('pending');

      jest.useRealTimers();
    });

    it('should handle cancelling when no timeout is active', () => {
      const { result } = renderHook(() => useMatchmakingStore());

      act(() => {
        result.current.cancelMatchTimeout();
      });

      // Should not throw error
      expect(result.current.activeMatch).toBeNull();
    });
  });

  describe('match lifecycle', () => {
    it('should handle complete match acceptance flow', () => {
      jest.useFakeTimers();
      const { result } = renderHook(() => useMatchmakingStore());
      const onExpire = jest.fn();

      // 1. Set active match
      act(() => {
        result.current.setActiveMatch(mockMatch);
        result.current.startMatchTimeout(onExpire);
      });

      expect(result.current.activeMatch).toEqual(mockMatch);
      expect(result.current.matchStatus).toBe('pending');

      // 2. User accepts match before timeout
      act(() => {
        jest.advanceTimersByTime(10000); // 10 seconds
        result.current.cancelMatchTimeout();
        result.current.updateMatchStatus('accepted');
      });

      expect(result.current.matchStatus).toBe('accepted');

      // 3. Fast-forward past timeout
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      // Timeout should not trigger
      expect(onExpire).not.toHaveBeenCalled();

      // 4. Clear match after game starts
      act(() => {
        result.current.clearActiveMatch();
      });

      expect(result.current.activeMatch).toBeNull();
      expect(result.current.matchStatus).toBeNull();

      jest.useRealTimers();
    });

    it('should handle match decline flow', () => {
      jest.useFakeTimers();
      const { result } = renderHook(() => useMatchmakingStore());
      const onExpire = jest.fn();

      // 1. Set active match
      act(() => {
        result.current.setActiveMatch(mockMatch);
        result.current.startMatchTimeout(onExpire);
      });

      // 2. User declines match
      act(() => {
        jest.advanceTimersByTime(5000); // 5 seconds
        result.current.cancelMatchTimeout();
        result.current.updateMatchStatus('declined');
      });

      expect(result.current.matchStatus).toBe('declined');

      // 3. Clear match
      act(() => {
        result.current.clearActiveMatch();
      });

      expect(result.current.activeMatch).toBeNull();

      jest.useRealTimers();
    });

    it('should handle match expiration flow', () => {
      jest.useFakeTimers();
      const { result } = renderHook(() => useMatchmakingStore());
      const onExpire = jest.fn();

      // 1. Set active match
      act(() => {
        result.current.setActiveMatch(mockMatch);
        result.current.startMatchTimeout(onExpire);
      });

      // 2. Wait for timeout
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      expect(onExpire).toHaveBeenCalledTimes(1);
      expect(result.current.matchStatus).toBe('expired');

      // 3. Clear match
      act(() => {
        result.current.clearActiveMatch();
      });

      expect(result.current.activeMatch).toBeNull();

      jest.useRealTimers();
    });
  });
});
