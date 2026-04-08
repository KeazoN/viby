import { ReconnectionStrategy } from './reconnection-strategy';

describe('ReconnectionStrategy', () => {
  let strategy: ReconnectionStrategy;

  beforeEach(() => {
    strategy = new ReconnectionStrategy();
  });

  describe('getNextDelay', () => {
    it('should return delays in exponential backoff sequence', () => {
      const expectedDelays = [1000, 2000, 4000, 8000, 16000, 32000, 60000, 60000, 60000, 60000];

      expectedDelays.forEach((expectedDelay) => {
        expect(strategy.getNextDelay()).toBe(expectedDelay);
      });
    });

    it('should cap at 60 seconds after 6th attempt', () => {
      // Consume first 6 attempts
      for (let i = 0; i < 6; i++) {
        strategy.getNextDelay();
      }

      // Next 4 attempts should all return 60000ms
      expect(strategy.getNextDelay()).toBe(60000);
      expect(strategy.getNextDelay()).toBe(60000);
      expect(strategy.getNextDelay()).toBe(60000);
      expect(strategy.getNextDelay()).toBe(60000);
    });

    it('should continue returning 60 seconds even after max attempts', () => {
      // Consume all 10 attempts
      for (let i = 0; i < 10; i++) {
        strategy.getNextDelay();
      }

      // Should still return 60000ms for any additional calls
      expect(strategy.getNextDelay()).toBe(60000);
      expect(strategy.getNextDelay()).toBe(60000);
    });

    it('should increment attempt counter on each call', () => {
      expect(strategy.getAttempts()).toBe(0);
      
      strategy.getNextDelay();
      expect(strategy.getAttempts()).toBe(1);
      
      strategy.getNextDelay();
      expect(strategy.getAttempts()).toBe(2);
      
      strategy.getNextDelay();
      expect(strategy.getAttempts()).toBe(3);
    });
  });

  describe('reset', () => {
    it('should reset attempt counter to 0', () => {
      // Make some attempts
      strategy.getNextDelay();
      strategy.getNextDelay();
      strategy.getNextDelay();
      expect(strategy.getAttempts()).toBe(3);

      // Reset
      strategy.reset();
      expect(strategy.getAttempts()).toBe(0);
    });

    it('should restart delay sequence after reset', () => {
      // Make some attempts
      strategy.getNextDelay(); // 1000
      strategy.getNextDelay(); // 2000
      strategy.getNextDelay(); // 4000

      // Reset
      strategy.reset();

      // Should start from beginning
      expect(strategy.getNextDelay()).toBe(1000);
      expect(strategy.getNextDelay()).toBe(2000);
    });

    it('should allow retry after reset even if max attempts reached', () => {
      // Exhaust all attempts
      for (let i = 0; i < 10; i++) {
        strategy.getNextDelay();
      }
      expect(strategy.shouldRetry()).toBe(false);

      // Reset
      strategy.reset();

      // Should allow retry again
      expect(strategy.shouldRetry()).toBe(true);
      expect(strategy.getAttempts()).toBe(0);
    });
  });

  describe('shouldRetry', () => {
    it('should return true when attempts < maxAttempts', () => {
      expect(strategy.shouldRetry()).toBe(true);
      
      strategy.getNextDelay();
      expect(strategy.shouldRetry()).toBe(true);
      
      // Make 8 more attempts (total 9)
      for (let i = 0; i < 8; i++) {
        strategy.getNextDelay();
      }
      expect(strategy.shouldRetry()).toBe(true);
    });

    it('should return false when attempts >= maxAttempts', () => {
      // Make 10 attempts
      for (let i = 0; i < 10; i++) {
        strategy.getNextDelay();
      }
      
      expect(strategy.getAttempts()).toBe(10);
      expect(strategy.shouldRetry()).toBe(false);
    });

    it('should return false for any attempts beyond maxAttempts', () => {
      // Make 12 attempts (beyond max)
      for (let i = 0; i < 12; i++) {
        strategy.getNextDelay();
      }
      
      expect(strategy.shouldRetry()).toBe(false);
    });
  });

  describe('getAttempts', () => {
    it('should return 0 initially', () => {
      expect(strategy.getAttempts()).toBe(0);
    });

    it('should return current attempt count', () => {
      strategy.getNextDelay();
      expect(strategy.getAttempts()).toBe(1);
      
      strategy.getNextDelay();
      strategy.getNextDelay();
      expect(strategy.getAttempts()).toBe(3);
    });

    it('should return 0 after reset', () => {
      strategy.getNextDelay();
      strategy.getNextDelay();
      strategy.reset();
      
      expect(strategy.getAttempts()).toBe(0);
    });
  });

  describe('integration scenarios', () => {
    it('should handle typical reconnection flow', () => {
      // First connection attempt fails
      expect(strategy.shouldRetry()).toBe(true);
      const delay1 = strategy.getNextDelay();
      expect(delay1).toBe(1000);

      // Second attempt fails
      expect(strategy.shouldRetry()).toBe(true);
      const delay2 = strategy.getNextDelay();
      expect(delay2).toBe(2000);

      // Third attempt succeeds - reset
      strategy.reset();
      expect(strategy.getAttempts()).toBe(0);

      // Later, connection drops again - should start from beginning
      expect(strategy.shouldRetry()).toBe(true);
      expect(strategy.getNextDelay()).toBe(1000);
    });

    it('should handle max attempts scenario', () => {
      // Simulate 10 failed reconnection attempts
      for (let i = 0; i < 10; i++) {
        expect(strategy.shouldRetry()).toBe(true);
        strategy.getNextDelay();
      }

      // After 10 attempts, should not retry
      expect(strategy.shouldRetry()).toBe(false);
      expect(strategy.getAttempts()).toBe(10);
    });

    it('should handle multiple reset cycles', () => {
      // First cycle
      strategy.getNextDelay();
      strategy.getNextDelay();
      strategy.reset();

      // Second cycle
      strategy.getNextDelay();
      strategy.getNextDelay();
      strategy.getNextDelay();
      strategy.reset();

      // Third cycle
      expect(strategy.getAttempts()).toBe(0);
      expect(strategy.getNextDelay()).toBe(1000);
    });
  });
});
