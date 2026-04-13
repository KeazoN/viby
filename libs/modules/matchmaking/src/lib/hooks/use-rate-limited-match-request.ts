import { useCallback } from 'react';
import { rateLimiter } from '@viby/shared/utils';
import { matchmakingService } from '../services/matchmaking-service';
import { useAuthStore } from '@viby/modules/auth';
import type { Match } from '../types';

/**
 * Rate limiting configuration for match requests
 * Max 5 match requests per minute per user
 */
const MAX_MATCH_REQUESTS = 5;
const MATCH_REQUEST_WINDOW_MS = 60000; // 1 minute

/**
 * useRateLimitedMatchRequest Hook
 * 
 * Provides a rate-limited match request function that prevents abuse
 * by limiting the frequency of match requests.
 * 
 * @returns Object with requestMatch function and rate limit info
 * 
 * @example
 * ```tsx
 * function TrackClusterCard({ trackId }: { trackId: string }) {
 *   const { requestMatch, getRemainingRequests, getTimeUntilAllowed } = useRateLimitedMatchRequest();
 *   
 *   const handleMatchRequest = async () => {
 *     try {
 *       const match = await requestMatch(trackId);
 *       console.log('Match created:', match);
 *     } catch (error) {
 *       if (error.message.includes('Too many')) {
 *         const timeUntil = getTimeUntilAllowed();
 *         showToast(`Please wait ${Math.ceil(timeUntil / 1000)} seconds`);
 *       }
 *     }
 *   };
 *   
 *   return (
 *     <Button onPress={handleMatchRequest}>
 *       Quick Match ({getRemainingRequests()} left)
 *     </Button>
 *   );
 * }
 * ```
 */
export function useRateLimitedMatchRequest() {
  const user = useAuthStore((state) => state.user);

  /**
   * Request a match with rate limiting
   * @param trackId - The track ID to match on
   * @returns Promise resolving to the created match
   * @throws Error if rate limit is exceeded
   */
  const requestMatch = useCallback(
    async (trackId: string): Promise<Match> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const rateLimitKey = `match:${user.id}`;

      // Check rate limit
      if (!rateLimiter.isAllowed(rateLimitKey, MAX_MATCH_REQUESTS, MATCH_REQUEST_WINDOW_MS)) {
        const timeUntil = rateLimiter.getTimeUntilAllowed(
          rateLimitKey,
          MAX_MATCH_REQUESTS,
          MATCH_REQUEST_WINDOW_MS
        );
        throw new Error(
          `Too many match requests. Please wait ${Math.ceil(timeUntil / 1000)} seconds.`
        );
      }

      // Make the request
      return await matchmakingService.requestMatch(trackId);
    },
    [user?.id]
  );

  /**
   * Get the number of remaining match requests in the current window
   * @returns Number of remaining requests
   */
  const getRemainingRequests = useCallback((): number => {
    if (!user?.id) return 0;

    const rateLimitKey = `match:${user.id}`;
    const currentCount = rateLimiter.getRequestCount(rateLimitKey, MATCH_REQUEST_WINDOW_MS);
    return Math.max(0, MAX_MATCH_REQUESTS - currentCount);
  }, [user?.id]);

  /**
   * Get time in milliseconds until next request is allowed
   * @returns Milliseconds until next request is allowed, or 0 if allowed now
   */
  const getTimeUntilAllowed = useCallback((): number => {
    if (!user?.id) return 0;

    const rateLimitKey = `match:${user.id}`;
    return rateLimiter.getTimeUntilAllowed(
      rateLimitKey,
      MAX_MATCH_REQUESTS,
      MATCH_REQUEST_WINDOW_MS
    );
  }, [user?.id]);

  /**
   * Check if a match request is currently allowed
   * @returns true if request is allowed, false otherwise
   */
  const isRequestAllowed = useCallback((): boolean => {
    if (!user?.id) return false;

    const rateLimitKey = `match:${user.id}`;
    const currentCount = rateLimiter.getRequestCount(rateLimitKey, MATCH_REQUEST_WINDOW_MS);
    return currentCount < MAX_MATCH_REQUESTS;
  }, [user?.id]);

  return {
    requestMatch,
    getRemainingRequests,
    getTimeUntilAllowed,
    isRequestAllowed,
  };
}
