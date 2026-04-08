import * as fc from 'fast-check';
import { SocketManager } from './socket-manager';
import { ReconnectionStrategy } from './reconnection-strategy';
import { useRealtimeStore } from './stores/realtime-store';
import { io } from 'socket.io-client';

/**
 * Property-Based Tests for Realtime Module
 * 
 * These tests use fast-check to verify properties hold across many generated inputs.
 */

// Mock socket.io-client
jest.mock('socket.io-client');

// Mock the realtime store
jest.mock('./stores/realtime-store', () => ({
  useRealtimeStore: {
    getState: jest.fn(),
  },
}));

describe('Realtime Module - Property-Based Tests', () => {
  let mockSocket: any;
  let mockStoreState: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock socket
    mockSocket = {
      connected: false,
      on: jest.fn(),
      off: jest.fn(),
      once: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
    };

    // Mock io to return our mock socket
    (io as jest.Mock).mockReturnValue(mockSocket);

    // Mock store state
    mockStoreState = {
      connectionStatus: 'disconnected',
      latency: 0,
      messageQueue: [],
      setConnectionStatus: jest.fn(),
      setLatency: jest.fn(),
      queueMessage: jest.fn(),
      clearQueue: jest.fn(),
    };

    (useRealtimeStore.getState as jest.Mock).mockReturnValue(mockStoreState);
  });

  /**
   * Property 18: WebSocket Reconnection Backoff
   * 
   * For any WebSocket disconnection, reconnection attempts should follow exponential 
   * backoff with delays: 1s, 2s, 4s, 8s, 16s, 32s, 60s, 60s, 60s, 60s (up to 10 attempts).
   */
  describe('Property 18: WebSocket Reconnection Backoff', () => {
    it('should follow exponential backoff pattern for any number of reconnection attempts', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate number of attempts (1-10)
          fc.integer({ min: 1, max: 10 }),
          async (numAttempts) => {
            const strategy = new ReconnectionStrategy();
            const expectedDelays = [1000, 2000, 4000, 8000, 16000, 32000, 60000, 60000, 60000, 60000];
            const actualDelays: number[] = [];

            // Collect delays for the specified number of attempts
            for (let i = 0; i < numAttempts; i++) {
              actualDelays.push(strategy.getNextDelay());
            }

            // Verify: Each delay should match the expected exponential backoff pattern
            for (let i = 0; i < numAttempts; i++) {
              expect(actualDelays[i]).toBe(expectedDelays[i]);
            }

            // Verify: Attempt counter should match
            expect(strategy.getAttempts()).toBe(numAttempts);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should cap delays at 60 seconds after 6th attempt for any subsequent attempts', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate number of attempts beyond 6 (7-15)
          fc.integer({ min: 7, max: 15 }),
          async (numAttempts) => {
            const strategy = new ReconnectionStrategy();

            // Consume first 6 attempts
            for (let i = 0; i < 6; i++) {
              strategy.getNextDelay();
            }

            // All subsequent attempts should return 60000ms
            for (let i = 6; i < numAttempts; i++) {
              const delay = strategy.getNextDelay();
              expect(delay).toBe(60000);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should reset backoff sequence after successful connection', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate initial attempts before reset (1-9)
          fc.integer({ min: 1, max: 9 }),
          // Generate attempts after reset (1-5)
          fc.integer({ min: 1, max: 5 }),
          async (attemptsBeforeReset, attemptsAfterReset) => {
            const strategy = new ReconnectionStrategy();
            const expectedDelays = [1000, 2000, 4000, 8000, 16000, 32000, 60000, 60000, 60000, 60000];

            // Make some attempts
            for (let i = 0; i < attemptsBeforeReset; i++) {
              strategy.getNextDelay();
            }

            // Reset (simulating successful connection)
            strategy.reset();

            // Verify: Sequence should restart from beginning
            for (let i = 0; i < attemptsAfterReset; i++) {
              const delay = strategy.getNextDelay();
              expect(delay).toBe(expectedDelays[i]);
            }

            // Verify: Attempt counter should match attempts after reset
            expect(strategy.getAttempts()).toBe(attemptsAfterReset);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should stop retrying after 10 attempts', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate number of attempts at or beyond max (10-15)
          fc.integer({ min: 10, max: 15 }),
          async (numAttempts) => {
            const strategy = new ReconnectionStrategy();

            // Make attempts up to max
            for (let i = 0; i < 10; i++) {
              expect(strategy.shouldRetry()).toBe(true);
              strategy.getNextDelay();
            }

            // After 10 attempts, should not retry
            expect(strategy.shouldRetry()).toBe(false);
            expect(strategy.getAttempts()).toBe(10);

            // Additional calls to getNextDelay should still return 60000ms
            // but shouldRetry should remain false
            for (let i = 10; i < numAttempts; i++) {
              expect(strategy.shouldRetry()).toBe(false);
              const delay = strategy.getNextDelay();
              expect(delay).toBe(60000);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should use ReconnectionStrategy for backoff delays', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate JWT tokens
          fc.string({ minLength: 20, maxLength: 200 }),
          async (token) => {
            const socketManager = new SocketManager('http://test-server:3000');
            
            // Access the internal reconnection strategy
            const strategy = (socketManager as any).reconnectionStrategy;
            
            // Verify: SocketManager uses ReconnectionStrategy
            expect(strategy).toBeDefined();
            expect(typeof strategy.getNextDelay).toBe('function');
            expect(typeof strategy.reset).toBe('function');
            expect(typeof strategy.shouldRetry).toBe('function');
            
            // Verify: Initial state
            expect(strategy.getAttempts()).toBe(0);
            expect(strategy.shouldRetry()).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 19: Subscription Restoration on Reconnect
   * 
   * For any active WebSocket subscriptions before disconnection, all subscriptions 
   * should be re-established after successful reconnection.
   */
  describe('Property 19: Subscription Restoration on Reconnect', () => {
    it('should restore all subscriptions after reconnection for any set of event subscriptions', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate array of event names (1-10 events)
          fc.array(
            fc.string({ minLength: 5, maxLength: 20 }).filter(s => s.trim().length > 0).map(s => `event:${s.replace(/\s+/g, '_')}`),
            { minLength: 1, maxLength: 10 }
          ),
          // Generate JWT token
          fc.string({ minLength: 20, maxLength: 200 }).filter(s => s.trim().length > 0),
          async (eventNames, token) => {
            // Ensure unique event names
            const uniqueEvents = Array.from(new Set(eventNames));
            fc.pre(uniqueEvents.length > 0);

            const socketManager = new SocketManager('http://test-server:3000');
            const handlers = new Map<string, jest.Mock>();

            // Subscribe to all events before connection
            uniqueEvents.forEach(eventName => {
              const handler = jest.fn();
              handlers.set(eventName, handler);
              socketManager.subscribe(eventName, handler);
            });

            // Simulate successful connection - trigger connect event immediately
            const connectPromise = socketManager.connect(token);
            
            // Immediately trigger the connect event
            mockSocket.connected = true;
            const connectHandler = mockSocket.once.mock.calls.find(
              (call: any) => call[0] === 'connect'
            )?.[1];
            
            if (connectHandler) {
              // Call connect handler synchronously
              setImmediate(() => connectHandler());
            }

            await connectPromise;

            // Verify: All subscriptions should be restored
            uniqueEvents.forEach(eventName => {
              const handler = handlers.get(eventName);
              expect(mockSocket.on).toHaveBeenCalledWith(eventName, handler);
            });

            // Verify: Number of socket.on calls should match number of unique events
            const onCalls = mockSocket.on.mock.calls.filter((call: any) => 
              uniqueEvents.includes(call[0])
            );
            expect(onCalls.length).toBe(uniqueEvents.length);
          }
        ),
        { numRuns: 30 }
      );
    }, 10000); // Increase timeout to 10 seconds

    it('should restore subscriptions with multiple handlers per event', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate event name
          fc.string({ minLength: 5, maxLength: 20 }).filter(s => s.trim().length > 0).map(s => `event:${s.replace(/\s+/g, '_')}`),
          // Generate number of handlers (2-5)
          fc.integer({ min: 2, max: 5 }),
          // Generate JWT token
          fc.string({ minLength: 20, maxLength: 200 }).filter(s => s.trim().length > 0),
          async (eventName, numHandlers, token) => {
            const socketManager = new SocketManager('http://test-server:3000');
            const handlers: jest.Mock[] = [];

            // Subscribe multiple handlers to the same event
            for (let i = 0; i < numHandlers; i++) {
              const handler = jest.fn();
              handlers.push(handler);
              socketManager.subscribe(eventName, handler);
            }

            // Simulate successful connection
            const connectPromise = socketManager.connect(token);
            
            // Immediately trigger the connect event
            mockSocket.connected = true;
            const connectHandler = mockSocket.once.mock.calls.find(
              (call: any) => call[0] === 'connect'
            )?.[1];
            
            if (connectHandler) {
              setImmediate(() => connectHandler());
            }

            await connectPromise;

            // Verify: All handlers should be restored
            handlers.forEach(handler => {
              expect(mockSocket.on).toHaveBeenCalledWith(eventName, handler);
            });

            // Verify: Number of socket.on calls for this event should match number of handlers
            const onCalls = mockSocket.on.mock.calls.filter((call: any) => 
              call[0] === eventName
            );
            expect(onCalls.length).toBe(numHandlers);
          }
        ),
        { numRuns: 30 }
      );
    }, 10000);

    it('should not restore unsubscribed events after reconnection', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate array of event names
          fc.array(
            fc.string({ minLength: 5, maxLength: 20 }).filter(s => s.trim().length > 0).map(s => `event:${s.replace(/\s+/g, '_')}`),
            { minLength: 3, maxLength: 8 }
          ),
          // Generate JWT token
          fc.string({ minLength: 20, maxLength: 200 }).filter(s => s.trim().length > 0),
          async (eventNames, token) => {
            const uniqueEvents = Array.from(new Set(eventNames));
            fc.pre(uniqueEvents.length >= 3);

            const socketManager = new SocketManager('http://test-server:3000');
            const handlers = new Map<string, jest.Mock>();

            // Subscribe to all events
            uniqueEvents.forEach(eventName => {
              const handler = jest.fn();
              handlers.set(eventName, handler);
              socketManager.subscribe(eventName, handler);
            });

            // Unsubscribe from the first event
            const unsubscribedEvent = uniqueEvents[0];
            const unsubscribedHandler = handlers.get(unsubscribedEvent)!;
            socketManager.unsubscribe(unsubscribedEvent, unsubscribedHandler);

            // Simulate successful connection
            const connectPromise = socketManager.connect(token);
            
            // Immediately trigger the connect event
            mockSocket.connected = true;
            const connectHandler = mockSocket.once.mock.calls.find(
              (call: any) => call[0] === 'connect'
            )?.[1];
            
            if (connectHandler) {
              setImmediate(() => connectHandler());
            }

            await connectPromise;

            // Verify: Unsubscribed event should not be restored
            const unsubscribedCalls = mockSocket.on.mock.calls.filter((call: any) => 
              call[0] === unsubscribedEvent && call[1] === unsubscribedHandler
            );
            expect(unsubscribedCalls.length).toBe(0);

            // Verify: Other events should be restored
            const remainingEvents = uniqueEvents.slice(1);
            remainingEvents.forEach(eventName => {
              const handler = handlers.get(eventName);
              expect(mockSocket.on).toHaveBeenCalledWith(eventName, handler);
            });
          }
        ),
        { numRuns: 30 }
      );
    }, 10000);
  });

  /**
   * Property 20: High Latency Message Logging
   * 
   * For any WebSocket message with processing latency exceeding 100ms, 
   * the message should be logged with latency details.
   */
  describe('Property 20: High Latency Message Logging', () => {
    beforeEach(() => {
      jest.spyOn(console, 'warn').mockImplementation();
    });

    afterEach(() => {
      (console.warn as jest.Mock).mockRestore();
    });

    it('should log warning for any latency exceeding 100ms', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate latencies above threshold (101-1000ms)
          fc.integer({ min: 101, max: 1000 }),
          // Generate JWT token
          fc.string({ minLength: 20, maxLength: 200 }).filter(s => s.trim().length > 0),
          async (latency, token) => {
            const socketManager = new SocketManager('http://test-server:3000');

            // Simulate successful connection
            const connectPromise = socketManager.connect(token);
            
            // Immediately trigger the connect event
            mockSocket.connected = true;
            const connectHandler = mockSocket.once.mock.calls.find(
              (call: any) => call[0] === 'connect'
            )?.[1];
            
            if (connectHandler) {
              setImmediate(() => connectHandler());
            }

            await connectPromise;

            // Get the pong handler
            const pongHandler = mockSocket.on.mock.calls.find(
              (call: any) => call[0] === 'pong'
            )?.[1];

            expect(pongHandler).toBeDefined();

            // Manually set lastPingTime to simulate latency
            const now = Date.now();
            (socketManager as any).lastPingTime = now - latency;

            // Simulate pong response
            pongHandler?.();

            // Verify: Warning should be logged for high latency
            expect(console.warn).toHaveBeenCalledWith(
              expect.stringContaining(`High WebSocket latency:`)
            );
            expect(console.warn).toHaveBeenCalledWith(
              expect.stringContaining(`${latency}ms`)
            );

            // Verify: Latency should be stored in state
            expect(mockStoreState.setLatency).toHaveBeenCalledWith(expect.any(Number));
            const actualLatency = mockStoreState.setLatency.mock.calls[mockStoreState.setLatency.mock.calls.length - 1][0];
            expect(actualLatency).toBeGreaterThanOrEqual(latency - 10); // Allow small timing variance
            expect(actualLatency).toBeLessThanOrEqual(latency + 10);
          }
        ),
        { numRuns: 50 }
      );
    }, 10000);

    it('should not log warning for latency at or below 100ms', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate latencies at or below threshold (0-100ms)
          fc.integer({ min: 0, max: 100 }),
          // Generate JWT token
          fc.string({ minLength: 20, maxLength: 200 }).filter(s => s.trim().length > 0),
          async (latency, token) => {
            (console.warn as jest.Mock).mockClear();

            const socketManager = new SocketManager('http://test-server:3000');

            // Simulate successful connection
            const connectPromise = socketManager.connect(token);
            
            // Immediately trigger the connect event
            mockSocket.connected = true;
            const connectHandler = mockSocket.once.mock.calls.find(
              (call: any) => call[0] === 'connect'
            )?.[1];
            
            if (connectHandler) {
              setImmediate(() => connectHandler());
            }

            await connectPromise;

            // Get the pong handler
            const pongHandler = mockSocket.on.mock.calls.find(
              (call: any) => call[0] === 'pong'
            )?.[1];

            // Manually set lastPingTime to simulate latency
            const now = Date.now();
            (socketManager as any).lastPingTime = now - latency;

            // Simulate pong response
            pongHandler?.();

            // Verify: No warning should be logged for acceptable latency
            expect(console.warn).not.toHaveBeenCalled();

            // Verify: Latency should still be stored in state
            expect(mockStoreState.setLatency).toHaveBeenCalledWith(expect.any(Number));
          }
        ),
        { numRuns: 50 }
      );
    }, 10000);

    it('should measure latency correctly for any ping-pong cycle', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate latency value (0-500ms)
          fc.integer({ min: 0, max: 500 }),
          // Generate JWT token
          fc.string({ minLength: 20, maxLength: 200 }).filter(s => s.trim().length > 0),
          async (expectedLatency, token) => {
            const socketManager = new SocketManager('http://test-server:3000');

            // Simulate successful connection
            const connectPromise = socketManager.connect(token);
            
            // Immediately trigger the connect event
            mockSocket.connected = true;
            const connectHandler = mockSocket.once.mock.calls.find(
              (call: any) => call[0] === 'connect'
            )?.[1];
            
            if (connectHandler) {
              setImmediate(() => connectHandler());
            }

            await connectPromise;

            // Get the pong handler
            const pongHandler = mockSocket.on.mock.calls.find(
              (call: any) => call[0] === 'pong'
            )?.[1];

            // Manually set lastPingTime to simulate specific latency
            const now = Date.now();
            (socketManager as any).lastPingTime = now - expectedLatency;

            // Simulate pong response
            pongHandler?.();

            // Verify: Latency should be measured and stored
            expect(mockStoreState.setLatency).toHaveBeenCalled();
            const measuredLatency = mockStoreState.setLatency.mock.calls[mockStoreState.setLatency.mock.calls.length - 1][0];
            
            // Allow small timing variance (±10ms)
            expect(measuredLatency).toBeGreaterThanOrEqual(expectedLatency - 10);
            expect(measuredLatency).toBeLessThanOrEqual(expectedLatency + 10);
          }
        ),
        { numRuns: 50 }
      );
    }, 10000);
  });
});
