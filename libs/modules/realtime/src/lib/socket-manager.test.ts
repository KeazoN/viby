import { SocketManager } from './socket-manager';
import { useRealtimeStore } from './stores/realtime-store';
import { io } from 'socket.io-client';

// Mock socket.io-client
jest.mock('socket.io-client');

// Mock the realtime store
jest.mock('./stores/realtime-store', () => ({
  useRealtimeStore: {
    getState: jest.fn(),
  },
}));

describe('SocketManager', () => {
  let socketManager: SocketManager;
  let mockSocket: any;
  let mockStoreState: any;

  beforeEach(() => {
    // Reset mocks
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

    // Create new instance for each test
    socketManager = new SocketManager('http://test-server:3000');
  });

  describe('connect', () => {
    it('should establish connection with JWT token', async () => {
      const token = 'test-jwt-token';

      // Simulate successful connection
      setTimeout(() => {
        mockSocket.connected = true;
        const connectHandler = mockSocket.once.mock.calls.find(
          (call) => call[0] === 'connect'
        )?.[1];
        connectHandler?.();
      }, 10);

      await socketManager.connect(token);

      expect(io).toHaveBeenCalledWith('http://test-server:3000', {
        auth: { token },
        transports: ['websocket'],
        reconnection: false,
        timeout: 10000,
      });

      expect(mockStoreState.setConnectionStatus).toHaveBeenCalledWith('connected');
    });

    it('should reject on connection error', async () => {
      const token = 'test-jwt-token';
      const error = new Error('Connection failed');

      // Simulate connection error
      setTimeout(() => {
        const errorHandler = mockSocket.once.mock.calls.find(
          (call) => call[0] === 'connect_error'
        )?.[1];
        errorHandler?.(error);
      }, 10);

      await expect(socketManager.connect(token)).rejects.toThrow('Connection failed');
      expect(mockStoreState.setConnectionStatus).toHaveBeenCalledWith('disconnected');
    });

    it('should not reconnect if already connected', async () => {
      mockSocket.connected = true;
      const token = 'test-jwt-token';

      await socketManager.connect(token);

      expect(io).not.toHaveBeenCalled();
    });
  });

  describe('disconnect', () => {
    it('should disconnect from server', () => {
      socketManager.disconnect();

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(mockStoreState.setConnectionStatus).toHaveBeenCalledWith('disconnected');
    });
  });

  describe('subscribe/unsubscribe', () => {
    it('should subscribe to events', () => {
      mockSocket.connected = true;
      const handler = jest.fn();

      socketManager.subscribe('test:event', handler);

      expect(mockSocket.on).toHaveBeenCalledWith('test:event', handler);
    });

    it('should unsubscribe from events', () => {
      const handler = jest.fn();

      socketManager.subscribe('test:event', handler);
      socketManager.unsubscribe('test:event', handler);

      expect(mockSocket.off).toHaveBeenCalledWith('test:event', handler);
    });

    it('should store subscriptions for reconnection', () => {
      const handler = jest.fn();

      socketManager.subscribe('test:event', handler);

      // Verify subscription is stored (will be resubscribed on reconnect)
      expect(mockSocket.on).not.toHaveBeenCalled(); // Not connected yet
    });
  });

  describe('emit', () => {
    it('should emit events when connected', () => {
      mockSocket.connected = true;
      const data = { message: 'test' };

      socketManager.emit('test:event', data);

      expect(mockSocket.emit).toHaveBeenCalledWith('test:event', data);
    });

    it('should queue messages when disconnected', () => {
      mockSocket.connected = false;
      const data = { message: 'test' };

      socketManager.emit('test:event', data);

      expect(mockSocket.emit).not.toHaveBeenCalled();
      expect(mockStoreState.queueMessage).toHaveBeenCalledWith({
        event: 'test:event',
        data,
        timestamp: expect.any(Number),
      });
    });
  });

  describe('getConnectionStatus', () => {
    it('should return current connection status', () => {
      mockStoreState.connectionStatus = 'connected';

      const status = socketManager.getConnectionStatus();

      expect(status).toBe('connected');
    });
  });

  describe('reconnect', () => {
    it('should attempt reconnection with exponential backoff', async () => {
      jest.useFakeTimers();

      const reconnectPromise = socketManager.reconnect();

      // Should set status to reconnecting
      expect(mockStoreState.setConnectionStatus).toHaveBeenCalledWith('reconnecting');

      // Provide token for reconnection
      const eventBus = socketManager.getEventBus();
      eventBus.emit('reconnection:token', { token: 'new-token' });

      // Fast-forward time for backoff delay
      jest.advanceTimersByTime(1000);

      // Simulate successful connection
      setTimeout(() => {
        mockSocket.connected = true;
        const connectHandler = mockSocket.once.mock.calls.find(
          (call) => call[0] === 'connect'
        )?.[1];
        connectHandler?.();
      }, 10);

      jest.advanceTimersByTime(100);

      await reconnectPromise;

      expect(io).toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('should fail after max reconnection attempts', async () => {
      // Mock shouldRetry to return false
      const reconnectionStrategy = (socketManager as any).reconnectionStrategy;
      reconnectionStrategy.shouldRetry = jest.fn().mockReturnValue(false);

      await expect(socketManager.reconnect()).rejects.toThrow(
        'Max reconnection attempts reached'
      );
    });
  });

  describe('heartbeat', () => {
    it('should measure latency with heartbeat', async () => {
      jest.useFakeTimers();

      const token = 'test-jwt-token';

      // Simulate successful connection
      setTimeout(() => {
        mockSocket.connected = true;
        const connectHandler = mockSocket.once.mock.calls.find(
          (call) => call[0] === 'connect'
        )?.[1];
        connectHandler?.();
      }, 10);

      await socketManager.connect(token);

      // Fast-forward to trigger heartbeat
      jest.advanceTimersByTime(5000);

      expect(mockSocket.emit).toHaveBeenCalledWith('ping');

      // Simulate pong response
      const pongHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'pong'
      )?.[1];

      jest.advanceTimersByTime(50); // 50ms latency
      pongHandler?.();

      expect(mockStoreState.setLatency).toHaveBeenCalledWith(expect.any(Number));

      jest.useRealTimers();
    });
  });

  describe('subscription restoration', () => {
    it('should restore subscriptions after reconnection', async () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      // Subscribe before connection
      socketManager.subscribe('event1', handler1);
      socketManager.subscribe('event2', handler2);

      // Connect
      setTimeout(() => {
        mockSocket.connected = true;
        const connectHandler = mockSocket.once.mock.calls.find(
          (call) => call[0] === 'connect'
        )?.[1];
        connectHandler?.();
      }, 10);

      await socketManager.connect('test-token');

      // Verify subscriptions were restored
      expect(mockSocket.on).toHaveBeenCalledWith('event1', handler1);
      expect(mockSocket.on).toHaveBeenCalledWith('event2', handler2);
    });
  });

  describe('message queue processing', () => {
    it('should process queued messages after reconnection', async () => {
      mockStoreState.messageQueue = [
        { event: 'event1', data: { msg: 'test1' }, timestamp: Date.now() },
        { event: 'event2', data: { msg: 'test2' }, timestamp: Date.now() },
      ];

      // Connect
      setTimeout(() => {
        mockSocket.connected = true;
        const connectHandler = mockSocket.once.mock.calls.find(
          (call) => call[0] === 'connect'
        )?.[1];
        connectHandler?.();
      }, 10);

      await socketManager.connect('test-token');

      // Verify queued messages were sent
      expect(mockSocket.emit).toHaveBeenCalledWith('event1', { msg: 'test1' });
      expect(mockSocket.emit).toHaveBeenCalledWith('event2', { msg: 'test2' });
      expect(mockStoreState.clearQueue).toHaveBeenCalled();
    });
  });
});
