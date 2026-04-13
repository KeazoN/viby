import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RateLimiter, rateLimiter } from './rate-limiter';

describe('RateLimiter', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    vi.useFakeTimers();
    limiter = new RateLimiter();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isAllowed', () => {
    it('should allow requests within the limit', () => {
      const key = 'test:user1';
      const maxRequests = 5;
      const windowMs = 60000; // 1 minute

      // Should allow first 5 requests
      for (let i = 0; i < maxRequests; i++) {
        expect(limiter.isAllowed(key, maxRequests, windowMs)).toBe(true);
      }
    });

    it('should block requests exceeding the limit', () => {
      const key = 'test:user1';
      const maxRequests = 3;
      const windowMs = 60000;

      // Allow first 3 requests
      for (let i = 0; i < maxRequests; i++) {
        expect(limiter.isAllowed(key, maxRequests, windowMs)).toBe(true);
      }

      // Block 4th request
      expect(limiter.isAllowed(key, maxRequests, windowMs)).toBe(false);
      expect(limiter.isAllowed(key, maxRequests, windowMs)).toBe(false);
    });

    it('should allow requests after time window expires', () => {
      const key = 'test:user1';
      const maxRequests = 2;
      const windowMs = 1000; // 1 second

      // Use up the limit
      expect(limiter.isAllowed(key, maxRequests, windowMs)).toBe(true);
      expect(limiter.isAllowed(key, maxRequests, windowMs)).toBe(true);
      expect(limiter.isAllowed(key, maxRequests, windowMs)).toBe(false);

      // Advance time past the window
      vi.advanceTimersByTime(1001);

      // Should allow new requests
      expect(limiter.isAllowed(key, maxRequests, windowMs)).toBe(true);
    });

    it('should use sliding window algorithm', () => {
      const key = 'test:user1';
      const maxRequests = 3;
      const windowMs = 1000;

      // Make 3 requests at t=0
      expect(limiter.isAllowed(key, maxRequests, windowMs)).toBe(true);
      expect(limiter.isAllowed(key, maxRequests, windowMs)).toBe(true);
      expect(limiter.isAllowed(key, maxRequests, windowMs)).toBe(true);

      // Blocked at t=0
      expect(limiter.isAllowed(key, maxRequests, windowMs)).toBe(false);

      // Advance time by 500ms (first request still in window)
      vi.advanceTimersByTime(500);
      expect(limiter.isAllowed(key, maxRequests, windowMs)).toBe(false);

      // Advance time by another 501ms (first request expired)
      vi.advanceTimersByTime(501);
      expect(limiter.isAllowed(key, maxRequests, windowMs)).toBe(true);
    });

    it('should handle different keys independently', () => {
      const maxRequests = 2;
      const windowMs = 60000;

      // User 1 uses up their limit
      expect(limiter.isAllowed('user1', maxRequests, windowMs)).toBe(true);
      expect(limiter.isAllowed('user1', maxRequests, windowMs)).toBe(true);
      expect(limiter.isAllowed('user1', maxRequests, windowMs)).toBe(false);

      // User 2 should still be allowed
      expect(limiter.isAllowed('user2', maxRequests, windowMs)).toBe(true);
      expect(limiter.isAllowed('user2', maxRequests, windowMs)).toBe(true);
      expect(limiter.isAllowed('user2', maxRequests, windowMs)).toBe(false);
    });

    it('should handle zero max requests', () => {
      const key = 'test:user1';
      expect(limiter.isAllowed(key, 0, 60000)).toBe(false);
    });

    it('should handle single request limit', () => {
      const key = 'test:user1';
      expect(limiter.isAllowed(key, 1, 60000)).toBe(true);
      expect(limiter.isAllowed(key, 1, 60000)).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset rate limit for a specific key', () => {
      const key = 'test:user1';
      const maxRequests = 2;
      const windowMs = 60000;

      // Use up the limit
      expect(limiter.isAllowed(key, maxRequests, windowMs)).toBe(true);
      expect(limiter.isAllowed(key, maxRequests, windowMs)).toBe(true);
      expect(limiter.isAllowed(key, maxRequests, windowMs)).toBe(false);

      // Reset
      limiter.reset(key);

      // Should allow requests again
      expect(limiter.isAllowed(key, maxRequests, windowMs)).toBe(true);
      expect(limiter.isAllowed(key, maxRequests, windowMs)).toBe(true);
    });

    it('should not affect other keys when resetting', () => {
      const maxRequests = 2;
      const windowMs = 60000;

      // Use up limits for both keys
      limiter.isAllowed('user1', maxRequests, windowMs);
      limiter.isAllowed('user1', maxRequests, windowMs);
      limiter.isAllowed('user2', maxRequests, windowMs);
      limiter.isAllowed('user2', maxRequests, windowMs);

      // Reset user1
      limiter.reset('user1');

      // User1 should be allowed, user2 should still be blocked
      expect(limiter.isAllowed('user1', maxRequests, windowMs)).toBe(true);
      expect(limiter.isAllowed('user2', maxRequests, windowMs)).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all rate limit data', () => {
      const maxRequests = 2;
      const windowMs = 60000;

      // Use up limits for multiple keys
      limiter.isAllowed('user1', maxRequests, windowMs);
      limiter.isAllowed('user1', maxRequests, windowMs);
      limiter.isAllowed('user2', maxRequests, windowMs);
      limiter.isAllowed('user2', maxRequests, windowMs);

      // Clear all
      limiter.clear();

      // All keys should be allowed again
      expect(limiter.isAllowed('user1', maxRequests, windowMs)).toBe(true);
      expect(limiter.isAllowed('user2', maxRequests, windowMs)).toBe(true);
    });
  });

  describe('getRequestCount', () => {
    it('should return the number of requests in the current window', () => {
      const key = 'test:user1';
      const windowMs = 1000;

      expect(limiter.getRequestCount(key, windowMs)).toBe(0);

      limiter.isAllowed(key, 5, windowMs);
      expect(limiter.getRequestCount(key, windowMs)).toBe(1);

      limiter.isAllowed(key, 5, windowMs);
      expect(limiter.getRequestCount(key, windowMs)).toBe(2);

      limiter.isAllowed(key, 5, windowMs);
      expect(limiter.getRequestCount(key, windowMs)).toBe(3);
    });

    it('should exclude expired requests from count', () => {
      const key = 'test:user1';
      const windowMs = 1000;

      limiter.isAllowed(key, 5, windowMs);
      limiter.isAllowed(key, 5, windowMs);
      expect(limiter.getRequestCount(key, windowMs)).toBe(2);

      // Advance time past window
      vi.advanceTimersByTime(1001);
      expect(limiter.getRequestCount(key, windowMs)).toBe(0);
    });
  });

  describe('getTimeUntilAllowed', () => {
    it('should return 0 when requests are allowed', () => {
      const key = 'test:user1';
      const maxRequests = 3;
      const windowMs = 1000;

      expect(limiter.getTimeUntilAllowed(key, maxRequests, windowMs)).toBe(0);

      limiter.isAllowed(key, maxRequests, windowMs);
      expect(limiter.getTimeUntilAllowed(key, maxRequests, windowMs)).toBe(0);
    });

    it('should return time until next request is allowed', () => {
      const key = 'test:user1';
      const maxRequests = 2;
      const windowMs = 1000;

      // Use up the limit
      limiter.isAllowed(key, maxRequests, windowMs);
      limiter.isAllowed(key, maxRequests, windowMs);

      // Should return approximately windowMs
      const timeUntilAllowed = limiter.getTimeUntilAllowed(key, maxRequests, windowMs);
      expect(timeUntilAllowed).toBeGreaterThan(0);
      expect(timeUntilAllowed).toBeLessThanOrEqual(windowMs);
    });

    it('should decrease as time passes', () => {
      const key = 'test:user1';
      const maxRequests = 2;
      const windowMs = 1000;

      limiter.isAllowed(key, maxRequests, windowMs);
      limiter.isAllowed(key, maxRequests, windowMs);

      const initialTime = limiter.getTimeUntilAllowed(key, maxRequests, windowMs);

      vi.advanceTimersByTime(500);

      const laterTime = limiter.getTimeUntilAllowed(key, maxRequests, windowMs);
      expect(laterTime).toBeLessThan(initialTime);
    });

    it('should return 0 after window expires', () => {
      const key = 'test:user1';
      const maxRequests = 2;
      const windowMs = 1000;

      limiter.isAllowed(key, maxRequests, windowMs);
      limiter.isAllowed(key, maxRequests, windowMs);

      vi.advanceTimersByTime(1001);

      expect(limiter.getTimeUntilAllowed(key, maxRequests, windowMs)).toBe(0);
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', () => {
      expect(rateLimiter).toBeInstanceOf(RateLimiter);
    });

    it('should maintain state across imports', () => {
      const key = 'test:singleton';
      const maxRequests = 2;
      const windowMs = 60000;

      rateLimiter.isAllowed(key, maxRequests, windowMs);
      rateLimiter.isAllowed(key, maxRequests, windowMs);

      expect(rateLimiter.isAllowed(key, maxRequests, windowMs)).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle very small time windows', () => {
      const key = 'test:user1';
      const maxRequests = 2;
      const windowMs = 1; // 1ms

      expect(limiter.isAllowed(key, maxRequests, windowMs)).toBe(true);
      expect(limiter.isAllowed(key, maxRequests, windowMs)).toBe(true);
      expect(limiter.isAllowed(key, maxRequests, windowMs)).toBe(false);

      vi.advanceTimersByTime(2);
      expect(limiter.isAllowed(key, maxRequests, windowMs)).toBe(true);
    });

    it('should handle very large time windows', () => {
      const key = 'test:user1';
      const maxRequests = 2;
      const windowMs = 86400000; // 24 hours

      expect(limiter.isAllowed(key, maxRequests, windowMs)).toBe(true);
      expect(limiter.isAllowed(key, maxRequests, windowMs)).toBe(true);
      expect(limiter.isAllowed(key, maxRequests, windowMs)).toBe(false);

      // Even after 1 hour, should still be blocked
      vi.advanceTimersByTime(3600000);
      expect(limiter.isAllowed(key, maxRequests, windowMs)).toBe(false);
    });

    it('should handle high request volumes', () => {
      const key = 'test:user1';
      const maxRequests = 100;
      const windowMs = 60000;

      // Make 100 requests
      for (let i = 0; i < maxRequests; i++) {
        expect(limiter.isAllowed(key, maxRequests, windowMs)).toBe(true);
      }

      // 101st should be blocked
      expect(limiter.isAllowed(key, maxRequests, windowMs)).toBe(false);
    });
  });
});
