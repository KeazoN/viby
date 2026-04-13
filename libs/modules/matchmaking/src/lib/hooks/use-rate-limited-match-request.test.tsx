import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react-native';
import { useRateLimitedMatchRequest } from './use-rate-limited-match-request';
import { rateLimiter } from '@viby/shared/utils';
import { matchmakingService } from '../services/matchmaking-service';
import { useAuthStore } from '@viby/modules/auth';

// Mock dependencies
vi.mock('../services/matchmaking-service', () => ({
  matchmakingService: {
    requestMatch: vi.fn(),
  },
}));

vi.mock('@viby/modules/auth', () => ({
  useAuthStore: vi.fn(),
}));

describe('useRateLimitedMatchRequest', () => {
  const mockUser = { id: 'user123', username: 'testuser' };
  const mockMatch = {
    id: 'match123',
    trackId: 'track123',
    users: [mockUser, { id: 'user456', username: 'opponent' }],
    status: 'pending',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30000).toISOString(),
  };

  beforeEach(() => {
    vi.useFakeTimers();
    rateLimiter.clear();
    vi.mocked(useAuthStore).mockReturnValue(mockUser);
    vi.mocked(matchmakingService.requestMatch).mockResolvedValue(mockMatch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('requestMatch', () => {
    it('should allow match requests within the limit', async () => {
      const { result } = renderHook(() => useRateLimitedMatchRequest());

      // Should allow first 5 requests
      for (let i = 0; i < 5; i++) {
        await act(async () => {
          const match = await result.current.requestMatch('track123');
          expect(match).toEqual(mockMatch);
        });
      }

      expect(matchmakingService.requestMatch).toHaveBeenCalledTimes(5);
    });

    it('should block requests exceeding the limit', async () => {
      const { result } = renderHook(() => useRateLimitedMatchRequest());

      // Use up the limit
      for (let i = 0; i < 5; i++) {
        await act(async () => {
          await result.current.requestMatch('track123');
        });
      }

      // 6th request should be blocked
      await act(async () => {
        await expect(result.current.requestMatch('track123')).rejects.toThrow(
          /Too many match requests/
        );
      });

      expect(matchmakingService.requestMatch).toHaveBeenCalledTimes(5);
    });

    it('should include wait time in error message', async () => {
      const { result } = renderHook(() => useRateLimitedMatchRequest());

      // Use up the limit
      for (let i = 0; i < 5; i++) {
        await act(async () => {
          await result.current.requestMatch('track123');
        });
      }

      // Try to make another request
      await act(async () => {
        try {
          await result.current.requestMatch('track123');
        } catch (error) {
          expect((error as Error).message).toMatch(/Please wait \d+ seconds/);
        }
      });
    });

    it('should allow requests after time window expires', async () => {
      const { result } = renderHook(() => useRateLimitedMatchRequest());

      // Use up the limit
      for (let i = 0; i < 5; i++) {
        await act(async () => {
          await result.current.requestMatch('track123');
        });
      }

      // Advance time past the window
      act(() => {
        vi.advanceTimersByTime(61000); // 61 seconds
      });

      // Should allow new requests
      await act(async () => {
        const match = await result.current.requestMatch('track123');
        expect(match).toEqual(mockMatch);
      });

      expect(matchmakingService.requestMatch).toHaveBeenCalledTimes(6);
    });

    it('should throw error if user is not authenticated', async () => {
      vi.mocked(useAuthStore).mockReturnValue(null);
      const { result } = renderHook(() => useRateLimitedMatchRequest());

      await act(async () => {
        await expect(result.current.requestMatch('track123')).rejects.toThrow(
          'User not authenticated'
        );
      });
    });

    it('should propagate service errors', async () => {
      const serviceError = new Error('Network error');
      vi.mocked(matchmakingService.requestMatch).mockRejectedValue(serviceError);

      const { result } = renderHook(() => useRateLimitedMatchRequest());

      await act(async () => {
        await expect(result.current.requestMatch('track123')).rejects.toThrow('Network error');
      });
    });
  });

  describe('getRemainingRequests', () => {
    it('should return max requests initially', () => {
      const { result } = renderHook(() => useRateLimitedMatchRequest());

      expect(result.current.getRemainingRequests()).toBe(5);
    });

    it('should decrease as requests are made', async () => {
      const { result } = renderHook(() => useRateLimitedMatchRequest());

      expect(result.current.getRemainingRequests()).toBe(5);

      await act(async () => {
        await result.current.requestMatch('track123');
      });
      expect(result.current.getRemainingRequests()).toBe(4);

      await act(async () => {
        await result.current.requestMatch('track123');
      });
      expect(result.current.getRemainingRequests()).toBe(3);
    });

    it('should return 0 when limit is reached', async () => {
      const { result } = renderHook(() => useRateLimitedMatchRequest());

      // Use up the limit
      for (let i = 0; i < 5; i++) {
        await act(async () => {
          await result.current.requestMatch('track123');
        });
      }

      expect(result.current.getRemainingRequests()).toBe(0);
    });

    it('should return 0 if user is not authenticated', () => {
      vi.mocked(useAuthStore).mockReturnValue(null);
      const { result } = renderHook(() => useRateLimitedMatchRequest());

      expect(result.current.getRemainingRequests()).toBe(0);
    });
  });

  describe('getTimeUntilAllowed', () => {
    it('should return 0 when requests are allowed', () => {
      const { result } = renderHook(() => useRateLimitedMatchRequest());

      expect(result.current.getTimeUntilAllowed()).toBe(0);
    });

    it('should return time until next request is allowed', async () => {
      const { result } = renderHook(() => useRateLimitedMatchRequest());

      // Use up the limit
      for (let i = 0; i < 5; i++) {
        await act(async () => {
          await result.current.requestMatch('track123');
        });
      }

      const timeUntil = result.current.getTimeUntilAllowed();
      expect(timeUntil).toBeGreaterThan(0);
      expect(timeUntil).toBeLessThanOrEqual(60000);
    });

    it('should decrease as time passes', async () => {
      const { result } = renderHook(() => useRateLimitedMatchRequest());

      // Use up the limit
      for (let i = 0; i < 5; i++) {
        await act(async () => {
          await result.current.requestMatch('track123');
        });
      }

      const initialTime = result.current.getTimeUntilAllowed();

      act(() => {
        vi.advanceTimersByTime(30000); // 30 seconds
      });

      const laterTime = result.current.getTimeUntilAllowed();
      expect(laterTime).toBeLessThan(initialTime);
    });

    it('should return 0 if user is not authenticated', () => {
      vi.mocked(useAuthStore).mockReturnValue(null);
      const { result } = renderHook(() => useRateLimitedMatchRequest());

      expect(result.current.getTimeUntilAllowed()).toBe(0);
    });
  });

  describe('isRequestAllowed', () => {
    it('should return true when requests are allowed', () => {
      const { result } = renderHook(() => useRateLimitedMatchRequest());

      expect(result.current.isRequestAllowed()).toBe(true);
    });

    it('should return false when limit is reached', async () => {
      const { result } = renderHook(() => useRateLimitedMatchRequest());

      // Use up the limit
      for (let i = 0; i < 5; i++) {
        await act(async () => {
          await result.current.requestMatch('track123');
        });
      }

      expect(result.current.isRequestAllowed()).toBe(false);
    });

    it('should return true after time window expires', async () => {
      const { result } = renderHook(() => useRateLimitedMatchRequest());

      // Use up the limit
      for (let i = 0; i < 5; i++) {
        await act(async () => {
          await result.current.requestMatch('track123');
        });
      }

      expect(result.current.isRequestAllowed()).toBe(false);

      // Advance time past the window
      act(() => {
        vi.advanceTimersByTime(61000);
      });

      expect(result.current.isRequestAllowed()).toBe(true);
    });

    it('should return false if user is not authenticated', () => {
      vi.mocked(useAuthStore).mockReturnValue(null);
      const { result } = renderHook(() => useRateLimitedMatchRequest());

      expect(result.current.isRequestAllowed()).toBe(false);
    });
  });

  describe('rate limit per user', () => {
    it('should track rate limits independently per user', async () => {
      const user1 = { id: 'user1', username: 'user1' };
      const user2 = { id: 'user2', username: 'user2' };

      // User 1 uses up their limit
      vi.mocked(useAuthStore).mockReturnValue(user1);
      const { result: result1 } = renderHook(() => useRateLimitedMatchRequest());

      for (let i = 0; i < 5; i++) {
        await act(async () => {
          await result1.current.requestMatch('track123');
        });
      }

      expect(result1.current.isRequestAllowed()).toBe(false);

      // User 2 should still be allowed
      vi.mocked(useAuthStore).mockReturnValue(user2);
      const { result: result2 } = renderHook(() => useRateLimitedMatchRequest());

      expect(result2.current.isRequestAllowed()).toBe(true);
      expect(result2.current.getRemainingRequests()).toBe(5);
    });
  });
});
