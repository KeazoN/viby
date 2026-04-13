import * as fc from 'fast-check';
import { SocketManager } from './socket-manager';
import { useRealtimeStore } from './stores/realtime-store';
import { io } from 'socket.io-client';

/**
 * Property-Based Tests for WebSocket Message Processing Latency
 * 
 * **Validates: Requirements 15.3**
 */

// Mock socket.io-client
jest.mock('socket.io-client');

// Mock the realtime store
jest.mock('./stores/realtime-store', () => ({
  useRealtimeStore: {
    getState: jest.fn(),
  },
}));

describe('WebSocket Message Processing Latency - Property-Based Tests', () => {
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
   * Property 28: WebSocket Message Processing Latency
   * 
   * For any WebSocket message, the time between message receipt and state update 
   * should be under 100ms (excluding network delay).
   */
  describe('Property 28: WebSocket Message Processing Latency', () => {
    it('should process any WebSocket event and update state within 100ms', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate event names
          fc.string({ minLength: 5, maxLength: 30 })
            .filter(s => s.trim().length > 0)
            .map(s => `event:${s.replace(/\s+/g, '_')}`),
          // Generate event payloads
          fc.record({
            id: fc.uuid(),
            data: fc.string({ minLength: 10, maxLength: 200 }),
            timestamp: fc.date().map(d => d.toISOString()),
          }),
          // Generate JWT token
          fc.string({ minLength: 20, maxLength: 200 }).filter(s => s.trim().length > 0),
          async (eventName, payload, token) => {
            const socketManager = new SocketManager('http://test-server:3000');
            
            // Track state update timing
            let stateUpdateTime: number | null = null;
            let messageReceiptTime: number | null = null;

            // Create a handler that measures state update time
            const handler = jest.fn((data: any) => {
              stateUpdateTime = performance.now();
            });

            // Subscribe to the event
            socketManager.subscribe(eventName, handler);

            // Connect to WebSocket
            const connectPromise = socketManager.connect(token);
            
            // Trigger connect event
            mockSocket.connected = true;
            const connectHandler = mockSocket.once.mock.calls.find(
              (call: any) => call[0] === 'connect'
            )?.[1];
            
            if (connectHandler) {
              setImmediate(() => connectHandler());
            }

            await connectPromise;

            // Get the registered event handler from socket.on
            const registeredHandler = mockSocket.on.mock.calls.find(
              (call: any) => call[0] === eventName
            )?.[1];

            expect(registeredHandler).toBeDefined();

            // Simulate message receipt
            messageReceiptTime = performance.now();
            registeredHandler?.(payload);

            // Verify: Handler was called
            expect(handler).toHaveBeenCalledWith(payload);
            expect(stateUpdateTime).not.toBeNull();

            // Calculate processing latency
            const processingLatency = stateUpdateTime! - messageReceiptTime!;

            // Verify: Processing latency should be under 100ms
            expect(processingLatency).toBeLessThan(100);
          }
        ),
        { numRuns: 50 }
      );
    }, 15000);

    it('should process multiple concurrent messages within 100ms each', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate array of events (2-5 concurrent events)
          fc.array(
            fc.record({
              eventName: fc.string({ minLength: 5, maxLength: 20 })
                .filter(s => s.trim().length > 0)
                .map(s => `event:${s.replace(/\s+/g, '_')}`),
              payload: fc.record({
                id: fc.uuid(),
                data: fc.string({ minLength: 10, maxLength: 100 }),
              }),
            }),
            { minLength: 2, maxLength: 5 }
          ),
          // Generate JWT token
          fc.string({ minLength: 20, maxLength: 200 }).filter(s => s.trim().length > 0),
          async (events, token) => {
            const socketManager = new SocketManager('http://test-server:3000');
            
            // Track timing for each event
            const timings: Array<{
              eventName: string;
              receiptTime: number;
              updateTime: number;
              latency: number;
            }> = [];

            // Subscribe to all events with timing handlers
            const handlers = new Map<string, jest.Mock>();
            events.forEach(({ eventName }) => {
              const handler = jest.fn((data: any) => {
                const updateTime = performance.now();
                const timing = timings.find(t => t.eventName === eventName && !t.updateTime);
                if (timing) {
                  timing.updateTime = updateTime;
                  timing.latency = updateTime - timing.receiptTime;
                }
              });
              handlers.set(eventName, handler);
              socketManager.subscribe(eventName, handler);
            });

            // Connect to WebSocket
            const connectPromise = socketManager.connect(token);
            
            // Trigger connect event
            mockSocket.connected = true;
            const connectHandler = mockSocket.once.mock.calls.find(
              (call: any) => call[0] === 'connect'
            )?.[1];
            
            if (connectHandler) {
              setImmediate(() => connectHandler());
            }

            await connectPromise;

            // Simulate concurrent message receipts
            events.forEach(({ eventName, payload }) => {
              const registeredHandler = mockSocket.on.mock.calls.find(
                (call: any) => call[0] === eventName
              )?.[1];

              const receiptTime = performance.now();
              timings.push({
                eventName,
                receiptTime,
                updateTime: 0,
                latency: 0,
              });

              // Trigger the event
              registeredHandler?.(payload);
            });

            // Verify: All handlers were called
            handlers.forEach((handler) => {
              expect(handler).toHaveBeenCalled();
            });

            // Verify: All processing latencies should be under 100ms
            timings.forEach(({ eventName, latency }) => {
              expect(latency).toBeLessThan(100);
            });
          }
        ),
        { numRuns: 30 }
      );
    }, 15000);

    it('should maintain low latency for messages with varying payload sizes', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate event name
          fc.string({ minLength: 5, maxLength: 20 })
            .filter(s => s.trim().length > 0)
            .map(s => `event:${s.replace(/\s+/g, '_')}`),
          // Generate payloads of varying sizes (small to large)
          fc.array(
            fc.record({
              id: fc.uuid(),
              data: fc.string({ minLength: 1, maxLength: 5000 }),
              metadata: fc.record({
                timestamp: fc.date().map(d => d.toISOString()),
                userId: fc.uuid(),
                type: fc.constantFrom('message', 'update', 'notification'),
              }),
            }),
            { minLength: 3, maxLength: 10 }
          ),
          // Generate JWT token
          fc.string({ minLength: 20, maxLength: 200 }).filter(s => s.trim().length > 0),
          async (eventName, payloads, token) => {
            const socketManager = new SocketManager('http://test-server:3000');
            
            // Track latencies for each payload
            const latencies: number[] = [];
            let currentPayloadIndex = 0;

            // Create handler that measures processing time
            const handler = jest.fn((data: any) => {
              const updateTime = performance.now();
              const receiptTime = (handler as any).lastReceiptTime;
              if (receiptTime) {
                latencies.push(updateTime - receiptTime);
              }
            });

            socketManager.subscribe(eventName, handler);

            // Connect to WebSocket
            const connectPromise = socketManager.connect(token);
            
            // Trigger connect event
            mockSocket.connected = true;
            const connectHandler = mockSocket.once.mock.calls.find(
              (call: any) => call[0] === 'connect'
            )?.[1];
            
            if (connectHandler) {
              setImmediate(() => connectHandler());
            }

            await connectPromise;

            // Get the registered event handler
            const registeredHandler = mockSocket.on.mock.calls.find(
              (call: any) => call[0] === eventName
            )?.[1];

            expect(registeredHandler).toBeDefined();

            // Process each payload and measure latency
            for (const payload of payloads) {
              (handler as any).lastReceiptTime = performance.now();
              registeredHandler?.(payload);
              
              // Small delay between messages to simulate realistic timing
              await new Promise(resolve => setImmediate(resolve));
            }

            // Verify: All messages were processed
            expect(handler).toHaveBeenCalledTimes(payloads.length);

            // Verify: All latencies should be under 100ms regardless of payload size
            latencies.forEach((latency, index) => {
              expect(latency).toBeLessThan(100);
            });

            // Verify: Average latency should be well under 100ms
            const avgLatency = latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
            expect(avgLatency).toBeLessThan(50);
          }
        ),
        { numRuns: 20 }
      );
    }, 20000);

    it('should process messages with complex nested data structures within 100ms', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate event name
          fc.string({ minLength: 5, maxLength: 20 })
            .filter(s => s.trim().length > 0)
            .map(s => `event:${s.replace(/\s+/g, '_')}`),
          // Generate complex nested payload
          fc.record({
            id: fc.uuid(),
            user: fc.record({
              id: fc.uuid(),
              username: fc.string({ minLength: 3, maxLength: 20 }),
              profile: fc.record({
                avatar: fc.webUrl(),
                bio: fc.string({ minLength: 10, maxLength: 200 }),
              }),
            }),
            track: fc.record({
              id: fc.uuid(),
              title: fc.string({ minLength: 3, maxLength: 50 }),
              artist: fc.string({ minLength: 3, maxLength: 50 }),
              album: fc.string({ minLength: 3, maxLength: 50 }),
              metadata: fc.record({
                duration: fc.integer({ min: 30000, max: 600000 }),
                genre: fc.constantFrom('rock', 'pop', 'jazz', 'electronic', 'classical'),
                releaseYear: fc.integer({ min: 1950, max: 2024 }),
              }),
            }),
            listeners: fc.array(
              fc.record({
                userId: fc.uuid(),
                username: fc.string({ minLength: 3, maxLength: 20 }),
              }),
              { minLength: 1, maxLength: 20 }
            ),
            timestamp: fc.date().map(d => d.toISOString()),
          }),
          // Generate JWT token
          fc.string({ minLength: 20, maxLength: 200 }).filter(s => s.trim().length > 0),
          async (eventName, payload, token) => {
            const socketManager = new SocketManager('http://test-server:3000');
            
            let receiptTime: number | null = null;
            let updateTime: number | null = null;

            // Create handler that processes complex data
            const handler = jest.fn((data: any) => {
              updateTime = performance.now();
              
              // Simulate some processing of the complex data structure
              const userCount = data.listeners?.length || 0;
              const trackDuration = data.track?.metadata?.duration || 0;
              
              // Ensure data is accessible (this adds minimal processing overhead)
              expect(userCount).toBeGreaterThanOrEqual(0);
              expect(trackDuration).toBeGreaterThanOrEqual(0);
            });

            socketManager.subscribe(eventName, handler);

            // Connect to WebSocket
            const connectPromise = socketManager.connect(token);
            
            // Trigger connect event
            mockSocket.connected = true;
            const connectHandler = mockSocket.once.mock.calls.find(
              (call: any) => call[0] === 'connect'
            )?.[1];
            
            if (connectHandler) {
              setImmediate(() => connectHandler());
            }

            await connectPromise;

            // Get the registered event handler
            const registeredHandler = mockSocket.on.mock.calls.find(
              (call: any) => call[0] === eventName
            )?.[1];

            expect(registeredHandler).toBeDefined();

            // Simulate message receipt with complex payload
            receiptTime = performance.now();
            registeredHandler?.(payload);

            // Verify: Handler was called
            expect(handler).toHaveBeenCalledWith(payload);
            expect(updateTime).not.toBeNull();

            // Calculate processing latency
            const processingLatency = updateTime! - receiptTime!;

            // Verify: Processing latency should be under 100ms even for complex data
            expect(processingLatency).toBeLessThan(100);
          }
        ),
        { numRuns: 30 }
      );
    }, 15000);

    it('should maintain consistent latency across repeated message processing', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate event name
          fc.string({ minLength: 5, maxLength: 20 })
            .filter(s => s.trim().length > 0)
            .map(s => `event:${s.replace(/\s+/g, '_')}`),
          // Generate number of messages to process (10-50)
          fc.integer({ min: 10, max: 50 }),
          // Generate JWT token
          fc.string({ minLength: 20, maxLength: 200 }).filter(s => s.trim().length > 0),
          async (eventName, messageCount, token) => {
            const socketManager = new SocketManager('http://test-server:3000');
            
            const latencies: number[] = [];
            const receiptTimes: number[] = [];

            // Create handler that tracks timing
            const handler = jest.fn((data: any) => {
              const updateTime = performance.now();
              const receiptTime = receiptTimes.shift();
              if (receiptTime !== undefined) {
                latencies.push(updateTime - receiptTime);
              }
            });

            socketManager.subscribe(eventName, handler);

            // Connect to WebSocket
            const connectPromise = socketManager.connect(token);
            
            // Trigger connect event
            mockSocket.connected = true;
            const connectHandler = mockSocket.once.mock.calls.find(
              (call: any) => call[0] === 'connect'
            )?.[1];
            
            if (connectHandler) {
              setImmediate(() => connectHandler());
            }

            await connectPromise;

            // Get the registered event handler
            const registeredHandler = mockSocket.on.mock.calls.find(
              (call: any) => call[0] === eventName
            )?.[1];

            expect(registeredHandler).toBeDefined();

            // Process multiple messages
            for (let i = 0; i < messageCount; i++) {
              const payload = {
                id: `msg-${i}`,
                data: `Message ${i}`,
                timestamp: new Date().toISOString(),
              };

              receiptTimes.push(performance.now());
              registeredHandler?.(payload);
              
              // Small delay to simulate realistic message flow
              await new Promise(resolve => setImmediate(resolve));
            }

            // Verify: All messages were processed
            expect(handler).toHaveBeenCalledTimes(messageCount);
            expect(latencies.length).toBe(messageCount);

            // Verify: All latencies should be under 100ms
            latencies.forEach((latency, index) => {
              expect(latency).toBeLessThan(100);
            });

            // Verify: Latency should be consistent (standard deviation should be low)
            const avgLatency = latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
            const variance = latencies.reduce((sum, l) => sum + Math.pow(l - avgLatency, 2), 0) / latencies.length;
            const stdDev = Math.sqrt(variance);

            // Standard deviation should be less than 30ms (indicating consistent performance)
            expect(stdDev).toBeLessThan(30);
          }
        ),
        { numRuns: 20 }
      );
    }, 20000);
  });
});
