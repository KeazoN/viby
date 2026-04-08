import * as fc from 'fast-check';
import { renderHook, act } from '@testing-library/react';
import { useMatchmakingStore } from './stores/matchmaking-store';
import type { Match, Track, User } from './types';

/**
 * Property-Based Tests for Matchmaking Module
 * 
 * These tests use fast-check to verify properties hold across many generated inputs.
 */

// Arbitraries for generating test data
const userArbitrary = fc.record({
  id: fc.uuid(),
  username: fc.string({ minLength: 3, maxLength: 20 }),
  avatar: fc.oneof(fc.webUrl(), fc.constant(null)),
});

const trackArbitrary = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  artist: fc.string({ minLength: 1, maxLength: 100 }),
  album: fc.string({ minLength: 1, maxLength: 100 }),
  artwork: fc.oneof(fc.webUrl(), fc.constant(null)),
  duration: fc.integer({ min: 30000, max: 600000 }), // 30s to 10min
  isrc: fc.oneof(fc.string({ minLength: 12, maxLength: 12 }), fc.constant(null)),
  provider: fc.constantFrom('spotify' as const, 'deezer' as const),
});

const matchArbitrary = fc.record({
  id: fc.uuid(),
  trackId: fc.uuid(),
  track: trackArbitrary,
  users: fc.array(userArbitrary, { minLength: 2, maxLength: 2 }),
  status: fc.constantFrom('pending' as const, 'accepted' as const, 'declined' as const, 'expired' as const),
  createdAt: fc.date().map(d => d.toISOString()),
  expiresAt: fc.date().map(d => new Date(d.getTime() + 30000).toISOString()),
});

describe('Matchmaking Module - Property-Based Tests', () => {
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

  /**
   * Property 10: Match Auto-Decline on Timeout
   * 
   * For any pending match that receives no response, after 30 seconds the match status 
   * should automatically change to "declined".
   */
  describe('Property 10: Match Auto-Decline on Timeout', () => {
    it('should auto-decline any pending match after exactly 30 seconds', async () => {
      jest.useFakeTimers();

      await fc.assert(
        fc.asyncProperty(
          matchArbitrary,
          async (generatedMatch) => {
            // Ensure match starts as pending
            const match: Match = {
              ...generatedMatch,
              status: 'pending',
            };

            const { result } = renderHook(() => useMatchmakingStore());
            const onExpire = jest.fn();

            // Act: Set active match and start timeout
            act(() => {
              result.current.setActiveMatch(match);
              result.current.startMatchTimeout(onExpire);
            });

            // Assert: Initially pending
            expect(result.current.matchStatus).toBe('pending');
            expect(result.current.activeMatch?.status).toBe('pending');

            // Act: Advance time by exactly 30 seconds
            act(() => {
              jest.advanceTimersByTime(30000);
            });

            // Assert: Status should be expired (auto-declined)
            expect(result.current.matchStatus).toBe('expired');
            expect(result.current.activeMatch?.status).toBe('expired');
            expect(onExpire).toHaveBeenCalledTimes(1);
          }
        ),
        { numRuns: 50 }
      );

      jest.useRealTimers();
    });

    it('should not auto-decline before 30 seconds have elapsed', async () => {
      jest.useFakeTimers();

      await fc.assert(
        fc.asyncProperty(
          matchArbitrary,
          fc.integer({ min: 1000, max: 29999 }), // Time less than 30 seconds
          async (generatedMatch, timeElapsed) => {
            const match: Match = {
              ...generatedMatch,
              status: 'pending',
            };

            const { result } = renderHook(() => useMatchmakingStore());
            const onExpire = jest.fn();

            // Act: Set active match and start timeout
            act(() => {
              result.current.setActiveMatch(match);
              result.current.startMatchTimeout(onExpire);
            });

            // Act: Advance time by less than 30 seconds
            act(() => {
              jest.advanceTimersByTime(timeElapsed);
            });

            // Assert: Status should still be pending
            expect(result.current.matchStatus).toBe('pending');
            expect(result.current.activeMatch?.status).toBe('pending');
            expect(onExpire).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 50 }
      );

      jest.useRealTimers();
    });

    it('should auto-decline after 30 seconds regardless of match properties', async () => {
      jest.useFakeTimers();

      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // matchId
          fc.uuid(), // trackId
          trackArbitrary,
          fc.array(userArbitrary, { minLength: 2, maxLength: 2 }),
          fc.date(), // createdAt
          async (matchId, trackId, track, users, createdAt) => {
            const match: Match = {
              id: matchId,
              trackId: trackId,
              track: track,
              users: users,
              status: 'pending',
              createdAt: createdAt.toISOString(),
              expiresAt: new Date(createdAt.getTime() + 30000).toISOString(),
            };

            const { result } = renderHook(() => useMatchmakingStore());
            const onExpire = jest.fn();

            // Act: Set active match and start timeout
            act(() => {
              result.current.setActiveMatch(match);
              result.current.startMatchTimeout(onExpire);
            });

            // Act: Advance time by 30 seconds
            act(() => {
              jest.advanceTimersByTime(30000);
            });

            // Assert: Should be expired regardless of match properties
            expect(result.current.matchStatus).toBe('expired');
            expect(onExpire).toHaveBeenCalledTimes(1);
          }
        ),
        { numRuns: 50 }
      );

      jest.useRealTimers();
    });

    it('should not auto-decline if user accepts before timeout', async () => {
      jest.useFakeTimers();

      await fc.assert(
        fc.asyncProperty(
          matchArbitrary,
          fc.integer({ min: 1000, max: 29999 }), // Time before timeout
          async (generatedMatch, acceptTime) => {
            const match: Match = {
              ...generatedMatch,
              status: 'pending',
            };

            const { result } = renderHook(() => useMatchmakingStore());
            const onExpire = jest.fn();

            // Act: Set active match and start timeout
            act(() => {
              result.current.setActiveMatch(match);
              result.current.startMatchTimeout(onExpire);
            });

            // Act: User accepts before timeout
            act(() => {
              jest.advanceTimersByTime(acceptTime);
              result.current.cancelMatchTimeout();
              result.current.updateMatchStatus('accepted');
            });

            // Assert: Status should be accepted
            expect(result.current.matchStatus).toBe('accepted');

            // Act: Advance past the original timeout
            act(() => {
              jest.advanceTimersByTime(30000);
            });

            // Assert: Should not expire after cancellation
            expect(result.current.matchStatus).toBe('accepted');
            expect(onExpire).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 50 }
      );

      jest.useRealTimers();
    });

    it('should not auto-decline if user declines before timeout', async () => {
      jest.useFakeTimers();

      await fc.assert(
        fc.asyncProperty(
          matchArbitrary,
          fc.integer({ min: 1000, max: 29999 }), // Time before timeout
          async (generatedMatch, declineTime) => {
            const match: Match = {
              ...generatedMatch,
              status: 'pending',
            };

            const { result } = renderHook(() => useMatchmakingStore());
            const onExpire = jest.fn();

            // Act: Set active match and start timeout
            act(() => {
              result.current.setActiveMatch(match);
              result.current.startMatchTimeout(onExpire);
            });

            // Act: User declines before timeout
            act(() => {
              jest.advanceTimersByTime(declineTime);
              result.current.cancelMatchTimeout();
              result.current.updateMatchStatus('declined');
            });

            // Assert: Status should be declined
            expect(result.current.matchStatus).toBe('declined');

            // Act: Advance past the original timeout
            act(() => {
              jest.advanceTimersByTime(30000);
            });

            // Assert: Should not expire after cancellation
            expect(result.current.matchStatus).toBe('declined');
            expect(onExpire).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 50 }
      );

      jest.useRealTimers();
    });

    it('should call onExpire callback exactly once when timeout occurs', async () => {
      jest.useFakeTimers();

      await fc.assert(
        fc.asyncProperty(
          matchArbitrary,
          async (generatedMatch) => {
            const match: Match = {
              ...generatedMatch,
              status: 'pending',
            };

            const { result } = renderHook(() => useMatchmakingStore());
            const onExpire = jest.fn();

            // Act: Set active match and start timeout
            act(() => {
              result.current.setActiveMatch(match);
              result.current.startMatchTimeout(onExpire);
            });

            // Act: Advance time by 30 seconds
            act(() => {
              jest.advanceTimersByTime(30000);
            });

            // Assert: Callback called exactly once
            expect(onExpire).toHaveBeenCalledTimes(1);

            // Act: Advance time further
            act(() => {
              jest.advanceTimersByTime(30000);
            });

            // Assert: Callback still called only once
            expect(onExpire).toHaveBeenCalledTimes(1);
          }
        ),
        { numRuns: 50 }
      );

      jest.useRealTimers();
    });

    it('should handle multiple sequential matches with independent timeouts', async () => {
      jest.useFakeTimers();

      await fc.assert(
        fc.asyncProperty(
          fc.array(matchArbitrary, { minLength: 2, maxLength: 5 }),
          async (matches) => {
            const { result } = renderHook(() => useMatchmakingStore());
            const callbacks = matches.map(() => jest.fn());

            for (let i = 0; i < matches.length; i++) {
              const match: Match = {
                ...matches[i],
                status: 'pending',
              };

              // Act: Set match and start timeout
              act(() => {
                result.current.setActiveMatch(match);
                result.current.startMatchTimeout(callbacks[i]);
              });

              // Act: Wait for timeout
              act(() => {
                jest.advanceTimersByTime(30000);
              });

              // Assert: Current match expired
              expect(result.current.matchStatus).toBe('expired');
              expect(callbacks[i]).toHaveBeenCalledTimes(1);

              // Act: Clear match for next iteration
              act(() => {
                result.current.clearActiveMatch();
              });
            }

            // Assert: Each callback was called exactly once
            callbacks.forEach((callback) => {
              expect(callback).toHaveBeenCalledTimes(1);
            });
          }
        ),
        { numRuns: 20 }
      );

      jest.useRealTimers();
    });

    it('should replace previous timeout when new match is set', async () => {
      jest.useFakeTimers();

      await fc.assert(
        fc.asyncProperty(
          matchArbitrary,
          matchArbitrary,
          fc.integer({ min: 5000, max: 25000 }), // Time before second match
          async (match1, match2, timeBeforeSecond) => {
            const { result } = renderHook(() => useMatchmakingStore());
            const onExpire1 = jest.fn();
            const onExpire2 = jest.fn();

            // Act: Set first match
            act(() => {
              result.current.setActiveMatch({ ...match1, status: 'pending' });
              result.current.startMatchTimeout(onExpire1);
            });

            // Act: Advance time and set second match
            act(() => {
              jest.advanceTimersByTime(timeBeforeSecond);
              result.current.setActiveMatch({ ...match2, status: 'pending' });
              result.current.startMatchTimeout(onExpire2);
            });

            // Act: Advance to when first timeout would have expired
            act(() => {
              jest.advanceTimersByTime(30000 - timeBeforeSecond + 1000);
            });

            // Assert: First callback should not be called
            expect(onExpire1).not.toHaveBeenCalled();

            // Act: Advance to when second timeout expires
            act(() => {
              jest.advanceTimersByTime(timeBeforeSecond);
            });

            // Assert: Only second callback should be called
            expect(onExpire1).not.toHaveBeenCalled();
            expect(onExpire2).toHaveBeenCalledTimes(1);
          }
        ),
        { numRuns: 30 }
      );

      jest.useRealTimers();
    });

    it('should maintain match data integrity when auto-declining', async () => {
      jest.useFakeTimers();

      await fc.assert(
        fc.asyncProperty(
          matchArbitrary,
          async (generatedMatch) => {
            const match: Match = {
              ...generatedMatch,
              status: 'pending',
            };

            const { result } = renderHook(() => useMatchmakingStore());
            const onExpire = jest.fn();

            // Act: Set active match and start timeout
            act(() => {
              result.current.setActiveMatch(match);
              result.current.startMatchTimeout(onExpire);
            });

            // Store original match data (except status)
            const originalMatchData = {
              id: match.id,
              trackId: match.trackId,
              track: match.track,
              users: match.users,
              createdAt: match.createdAt,
              expiresAt: match.expiresAt,
            };

            // Act: Advance time by 30 seconds
            act(() => {
              jest.advanceTimersByTime(30000);
            });

            // Assert: Match data should be preserved (except status)
            expect(result.current.activeMatch).toMatchObject(originalMatchData);
            expect(result.current.activeMatch?.status).toBe('expired');
          }
        ),
        { numRuns: 50 }
      );

      jest.useRealTimers();
    });
  });
});
