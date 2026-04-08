/**
 * ReconnectionStrategy manages WebSocket reconnection attempts with exponential backoff.
 * 
 * Implements requirements 8.3 and 8.4:
 * - 8.3: Attempt reconnection with exponential backoff when connection drops
 * - 8.4: Retry up to 10 times with delays: 1s, 2s, 4s, 8s, 16s, 32s, 60s, 60s, 60s, 60s
 */
export class ReconnectionStrategy {
  private attempts: number = 0;
  private readonly delays: number[] = [
    1000,   // 1s
    2000,   // 2s
    4000,   // 4s
    8000,   // 8s
    16000,  // 16s
    32000,  // 32s
    60000,  // 60s
    60000,  // 60s
    60000,  // 60s
    60000,  // 60s
  ];
  private readonly maxAttempts: number = 10;

  /**
   * Get the delay for the next reconnection attempt and increment the attempt counter.
   * Returns the appropriate delay based on the current attempt number.
   * 
   * @returns Delay in milliseconds before the next reconnection attempt
   */
  getNextDelay(): number {
    const delay = this.delays[Math.min(this.attempts, this.delays.length - 1)];
    this.attempts++;
    return delay;
  }

  /**
   * Reset the reconnection strategy to its initial state.
   * Should be called when a successful connection is established.
   */
  reset(): void {
    this.attempts = 0;
  }

  /**
   * Check if another reconnection attempt should be made.
   * 
   * @returns true if attempts < maxAttempts, false otherwise
   */
  shouldRetry(): boolean {
    return this.attempts < this.maxAttempts;
  }

  /**
   * Get the current number of reconnection attempts.
   * 
   * @returns Current attempt count
   */
  getAttempts(): number {
    return this.attempts;
  }
}
