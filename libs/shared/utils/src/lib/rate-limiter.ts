/**
 * Rate Limiter for client-side action throttling
 * 
 * Implements a sliding window rate limiting algorithm to prevent abuse
 * by limiting the frequency of user actions.
 * 
 * @example
 * ```typescript
 * const rateLimiter = new RateLimiter();
 * 
 * // Allow max 5 match requests per minute
 * if (rateLimiter.isAllowed('match:user123', 5, 60000)) {
 *   await requestMatch();
 * } else {
 *   showError('Too many requests. Please wait.');
 * }
 * ```
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  /**
   * Check if an action is allowed based on rate limits
   * 
   * @param key - Unique identifier for the action (e.g., 'match:userId')
   * @param maxRequests - Maximum number of requests allowed in the time window
   * @param windowMs - Time window in milliseconds
   * @returns true if the action is allowed, false if rate limit exceeded
   */
  isAllowed(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];

    // Remove old timestamps outside the window
    const validTimestamps = timestamps.filter((ts) => now - ts < windowMs);

    if (validTimestamps.length >= maxRequests) {
      return false;
    }

    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);

    return true;
  }

  /**
   * Reset rate limit for a specific key
   * 
   * @param key - The key to reset
   */
  reset(key: string): void {
    this.requests.delete(key);
  }

  /**
   * Clear all rate limit data
   */
  clear(): void {
    this.requests.clear();
  }

  /**
   * Get the number of requests made in the current window
   * 
   * @param key - The key to check
   * @param windowMs - Time window in milliseconds
   * @returns Number of requests in the current window
   */
  getRequestCount(key: string, windowMs: number): number {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    return timestamps.filter((ts) => now - ts < windowMs).length;
  }

  /**
   * Get time until next request is allowed
   * 
   * @param key - The key to check
   * @param maxRequests - Maximum number of requests allowed
   * @param windowMs - Time window in milliseconds
   * @returns Milliseconds until next request is allowed, or 0 if allowed now
   */
  getTimeUntilAllowed(key: string, maxRequests: number, windowMs: number): number {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    const validTimestamps = timestamps.filter((ts) => now - ts < windowMs);

    if (validTimestamps.length < maxRequests) {
      return 0;
    }

    // Find the oldest timestamp in the window
    const oldestTimestamp = Math.min(...validTimestamps);
    const timeUntilExpiry = windowMs - (now - oldestTimestamp);

    return Math.max(0, timeUntilExpiry);
  }
}

/**
 * Singleton instance for global rate limiting
 */
export const rateLimiter = new RateLimiter();
