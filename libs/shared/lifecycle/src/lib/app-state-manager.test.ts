import { AppState } from 'react-native';
import { AppStateManager } from './app-state-manager';
import { socketManager } from '@viby/modules/realtime';
import { storageService } from '@viby/shared/storage';
import { useGameStore } from '@viby/modules/game';

// Mock dependencies
jest.mock('react-native', () => ({
  AppState: {
    currentState: 'active',
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
}));

jest.mock('@viby/modules/realtime', () => ({
  socketManager: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    getConnectionStatus: jest.fn(),
    getEventBus: jest.fn(() => ({
      emit: jest.fn(),
    })),
  },
}));

jest.mock('@viby/shared/storage', () => ({
  storageService: {
    getAccessToken: jest.fn(),
  },
}));

jest.mock('@viby/modules/game', () => ({
  useGameStore: {
    getState: jest.fn(),
  },
}));

describe('AppStateManager', () => {
  let manager: AppStateManager;
  let mockAddEventListener: jest.Mock;
  let mockRemoveEventListener: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    manager = new AppStateManager();
    mockAddEventListener = AppState.addEventListener as jest.Mock;
    mockRemoveEventListener = AppState.removeEventListener as jest.Mock;

    // Default mocks
    (socketManager.getConnectionStatus as jest.Mock).mockReturnValue('connected');
    (useGameStore.getState as jest.Mock).mockReturnValue({ activeGame: null });
    (storageService.getAccessToken as jest.Mock).mockResolvedValue('mock-token');
  });

  afterEach(() => {
    jest.useRealTimers();
    manager.cleanup();
  });

  describe('initialize', () => {
    it('should set up AppState event listener', () => {
      manager.initialize();

      expect(mockAddEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    });

    it('should not initialize twice', () => {
      manager.initialize();
      manager.initialize();

      expect(mockAddEventListener).toHaveBeenCalledTimes(1);
    });
  });

  describe('cleanup', () => {
    it('should remove AppState event listener', () => {
      manager.initialize();
      manager.cleanup();

      expect(mockRemoveEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    });

    it('should clear all listeners', () => {
      manager.initialize();
      const listener = jest.fn();
      manager.subscribe(listener);

      manager.cleanup();

      // Trigger state change after cleanup
      const changeHandler = mockAddEventListener.mock.calls[0][1];
      changeHandler('background');

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('subscribe', () => {
    it('should add listener and return unsubscribe function', () => {
      manager.initialize();
      const listener = jest.fn();

      const unsubscribe = manager.subscribe(listener);

      // Trigger state change
      const changeHandler = mockAddEventListener.mock.calls[0][1];
      changeHandler('background');

      expect(listener).toHaveBeenCalledWith('background');

      // Unsubscribe
      unsubscribe();

      // Trigger another state change
      changeHandler('active');

      // Listener should not be called again
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should support multiple listeners', () => {
      manager.initialize();
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      manager.subscribe(listener1);
      manager.subscribe(listener2);

      // Trigger state change
      const changeHandler = mockAddEventListener.mock.calls[0][1];
      changeHandler('background');

      expect(listener1).toHaveBeenCalledWith('background');
      expect(listener2).toHaveBeenCalledWith('background');
    });
  });

  describe('getCurrentState', () => {
    it('should return current app state', () => {
      expect(manager.getCurrentState()).toBe('active');
    });
  });

  describe('handleBackground', () => {
    it('should disconnect WebSocket after 5s when no active game', async () => {
      manager.initialize();
      (useGameStore.getState as jest.Mock).mockReturnValue({ activeGame: null });

      // Trigger background transition
      const changeHandler = mockAddEventListener.mock.calls[0][1];
      await changeHandler('background');

      // Should not disconnect immediately
      expect(socketManager.disconnect).not.toHaveBeenCalled();

      // Fast-forward 5 seconds
      jest.advanceTimersByTime(5000);

      // Should disconnect after 5s
      expect(socketManager.disconnect).toHaveBeenCalled();
    });

    it('should maintain WebSocket for 30s when active game exists', async () => {
      manager.initialize();
      (useGameStore.getState as jest.Mock).mockReturnValue({
        activeGame: { roomId: 'room-123' },
      });

      // Trigger background transition
      const changeHandler = mockAddEventListener.mock.calls[0][1];
      await changeHandler('background');

      // Should not disconnect immediately
      expect(socketManager.disconnect).not.toHaveBeenCalled();

      // Fast-forward 5 seconds
      jest.advanceTimersByTime(5000);

      // Should still not disconnect (30s timer)
      expect(socketManager.disconnect).not.toHaveBeenCalled();

      // Fast-forward to 30 seconds
      jest.advanceTimersByTime(25000);

      // Should disconnect after 30s
      expect(socketManager.disconnect).toHaveBeenCalled();
    });

    it('should not disconnect if app returns to foreground before timer', async () => {
      manager.initialize();
      (useGameStore.getState as jest.Mock).mockReturnValue({ activeGame: null });

      // Trigger background transition
      const changeHandler = mockAddEventListener.mock.calls[0][1];
      await changeHandler('background');

      // Fast-forward 3 seconds
      jest.advanceTimersByTime(3000);

      // Return to foreground
      await changeHandler('active');

      // Fast-forward past original timer
      jest.advanceTimersByTime(5000);

      // Should not disconnect
      expect(socketManager.disconnect).not.toHaveBeenCalled();
    });
  });

  describe('handleForeground', () => {
    it('should reconnect WebSocket if disconnected', async () => {
      manager.initialize();
      (socketManager.getConnectionStatus as jest.Mock).mockReturnValue('disconnected');
      (storageService.getAccessToken as jest.Mock).mockResolvedValue('mock-token');

      // Trigger foreground transition
      const changeHandler = mockAddEventListener.mock.calls[0][1];
      await changeHandler('active');

      // Wait for async operations
      await Promise.resolve();

      expect(socketManager.connect).toHaveBeenCalledWith('mock-token');
    });

    it('should not reconnect if already connected', async () => {
      manager.initialize();
      (socketManager.getConnectionStatus as jest.Mock).mockReturnValue('connected');

      // Trigger foreground transition
      const changeHandler = mockAddEventListener.mock.calls[0][1];
      await changeHandler('active');

      // Wait for async operations
      await Promise.resolve();

      expect(socketManager.connect).not.toHaveBeenCalled();
    });

    it('should sync game state if active game exists', async () => {
      manager.initialize();
      const mockEmit = jest.fn();
      (socketManager.getEventBus as jest.Mock).mockReturnValue({
        emit: mockEmit,
      });
      (useGameStore.getState as jest.Mock).mockReturnValue({
        activeGame: { roomId: 'room-123' },
      });

      // Trigger foreground transition
      const changeHandler = mockAddEventListener.mock.calls[0][1];
      await changeHandler('active');

      // Wait for async operations
      await Promise.resolve();

      expect(mockEmit).toHaveBeenCalledWith('app:foreground:sync-game', {
        roomId: 'room-123',
      });
    });

    it('should not sync game state if no active game', async () => {
      manager.initialize();
      const mockEmit = jest.fn();
      (socketManager.getEventBus as jest.Mock).mockReturnValue({
        emit: mockEmit,
      });
      (useGameStore.getState as jest.Mock).mockReturnValue({ activeGame: null });

      // Trigger foreground transition
      const changeHandler = mockAddEventListener.mock.calls[0][1];
      await changeHandler('active');

      // Wait for async operations
      await Promise.resolve();

      expect(mockEmit).not.toHaveBeenCalledWith(
        'app:foreground:sync-game',
        expect.anything()
      );
    });

    it('should handle reconnection failure gracefully', async () => {
      manager.initialize();
      (socketManager.getConnectionStatus as jest.Mock).mockReturnValue('disconnected');
      (storageService.getAccessToken as jest.Mock).mockResolvedValue('mock-token');
      (socketManager.connect as jest.Mock).mockRejectedValue(
        new Error('Connection failed')
      );

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Trigger foreground transition
      const changeHandler = mockAddEventListener.mock.calls[0][1];
      await changeHandler('active');

      // Wait for async operations
      await Promise.resolve();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[AppStateManager] Failed to reconnect WebSocket:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle missing token gracefully', async () => {
      manager.initialize();
      (socketManager.getConnectionStatus as jest.Mock).mockReturnValue('disconnected');
      (storageService.getAccessToken as jest.Mock).mockResolvedValue(null);

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Trigger foreground transition
      const changeHandler = mockAddEventListener.mock.calls[0][1];
      await changeHandler('active');

      // Wait for async operations
      await Promise.resolve();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[AppStateManager] No access token available for reconnection'
      );
      expect(socketManager.connect).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });

  describe('state transitions', () => {
    it('should handle active -> background -> active transition', async () => {
      manager.initialize();
      const listener = jest.fn();
      manager.subscribe(listener);

      const changeHandler = mockAddEventListener.mock.calls[0][1];

      // Go to background
      await changeHandler('background');
      expect(listener).toHaveBeenCalledWith('background');

      // Return to active
      await changeHandler('active');
      expect(listener).toHaveBeenCalledWith('active');

      expect(listener).toHaveBeenCalledTimes(2);
    });

    it('should handle listener errors gracefully', async () => {
      manager.initialize();
      const errorListener = jest.fn(() => {
        throw new Error('Listener error');
      });
      const normalListener = jest.fn();

      manager.subscribe(errorListener);
      manager.subscribe(normalListener);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const changeHandler = mockAddEventListener.mock.calls[0][1];
      await changeHandler('background');

      // Both listeners should be called despite error
      expect(errorListener).toHaveBeenCalled();
      expect(normalListener).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error in app state listener:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
