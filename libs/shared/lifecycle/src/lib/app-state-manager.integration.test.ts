/**
 * Integration tests for AppStateManager
 * 
 * These tests verify the integration between AppStateManager and its dependencies:
 * - SocketManager (realtime module)
 * - StorageService (storage module)
 * - GameStore (game module)
 */

import { AppState } from 'react-native';
import { AppStateManager } from './app-state-manager';
import { socketManager } from '@viby/modules/realtime';
import { storageService } from '@viby/shared/storage';
import { useGameStore } from '@viby/modules/game';

// Mock dependencies
jest.mock('react-native');
jest.mock('@viby/modules/realtime');
jest.mock('@viby/shared/storage');
jest.mock('@viby/modules/game');

describe('AppStateManager Integration Tests', () => {
  let manager: AppStateManager;
  let stateChangeHandler: (state: string) => void;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    manager = new AppStateManager();

    // Capture the state change handler
    (AppState.addEventListener as jest.Mock).mockImplementation((event, handler) => {
      stateChangeHandler = handler;
      return { remove: jest.fn() };
    });

    // Default mocks
    (socketManager.getConnectionStatus as jest.Mock).mockReturnValue('connected');
    (socketManager.getEventBus as jest.Mock).mockReturnValue({
      emit: jest.fn(),
    });
    (useGameStore.getState as jest.Mock).mockReturnValue({ activeGame: null });
    (storageService.getAccessToken as jest.Mock).mockResolvedValue('test-token');
  });

  afterEach(() => {
    jest.useRealTimers();
    manager.cleanup();
  });

  describe('Background/Foreground Cycle with Active Game', () => {
    it('should maintain WebSocket for 30s in background during game, then reconnect on foreground', async () => {
      // Setup: Active game session
      (useGameStore.getState as jest.Mock).mockReturnValue({
        activeGame: { roomId: 'game-room-123' },
      });

      manager.initialize();

      // Step 1: App goes to background
      await stateChangeHandler('background');

      // Verify: WebSocket should NOT disconnect immediately
      expect(socketManager.disconnect).not.toHaveBeenCalled();

      // Step 2: Fast-forward 15 seconds (still within 30s window)
      jest.advanceTimersByTime(15000);

      // Verify: WebSocket should still be connected
      expect(socketManager.disconnect).not.toHaveBeenCalled();

      // Step 3: App returns to foreground before 30s expires
      (socketManager.getConnectionStatus as jest.Mock).mockReturnValue('connected');
      await stateChangeHandler('active');

      // Wait for async operations
      await Promise.resolve();

      // Verify: WebSocket should NOT reconnect (already connected)
      expect(socketManager.connect).not.toHaveBeenCalled();

      // Verify: Game state sync should be requested
      const mockEmit = (socketManager.getEventBus as jest.Mock)().emit;
      expect(mockEmit).toHaveBeenCalledWith('app:foreground:sync-game', {
        roomId: 'game-room-123',
      });

      // Step 4: Fast-forward past original 30s timer
      jest.advanceTimersByTime(20000);

      // Verify: WebSocket should NOT disconnect (timer was cancelled)
      expect(socketManager.disconnect).not.toHaveBeenCalled();
    });

    it('should disconnect WebSocket after 30s if app stays in background during game', async () => {
      // Setup: Active game session
      (useGameStore.getState as jest.Mock).mockReturnValue({
        activeGame: { roomId: 'game-room-123' },
      });

      manager.initialize();

      // Step 1: App goes to background
      await stateChangeHandler('background');

      // Step 2: Fast-forward full 30 seconds
      jest.advanceTimersByTime(30000);

      // Verify: WebSocket should disconnect after 30s
      expect(socketManager.disconnect).toHaveBeenCalledTimes(1);
    });
  });

  describe('Background/Foreground Cycle without Active Game', () => {
    it('should disconnect WebSocket after 5s in background, then reconnect on foreground', async () => {
      // Setup: No active game
      (useGameStore.getState as jest.Mock).mockReturnValue({ activeGame: null });

      manager.initialize();

      // Step 1: App goes to background
      await stateChangeHandler('background');

      // Verify: WebSocket should NOT disconnect immediately
      expect(socketManager.disconnect).not.toHaveBeenCalled();

      // Step 2: Fast-forward 5 seconds
      jest.advanceTimersByTime(5000);

      // Verify: WebSocket should disconnect after 5s
      expect(socketManager.disconnect).toHaveBeenCalledTimes(1);

      // Step 3: App returns to foreground
      (socketManager.getConnectionStatus as jest.Mock).mockReturnValue('disconnected');
      await stateChangeHandler('active');

      // Wait for async operations
      await Promise.resolve();

      // Verify: WebSocket should reconnect
      expect(socketManager.connect).toHaveBeenCalledWith('test-token');

      // Verify: No game state sync (no active game)
      const mockEmit = (socketManager.getEventBus as jest.Mock)().emit;
      expect(mockEmit).not.toHaveBeenCalledWith(
        'app:foreground:sync-game',
        expect.anything()
      );
    });
  });

  describe('Multiple Background/Foreground Transitions', () => {
    it('should handle rapid app switching correctly', async () => {
      manager.initialize();

      // Transition 1: Background
      await stateChangeHandler('background');
      jest.advanceTimersByTime(2000);

      // Transition 2: Foreground (before timer expires)
      await stateChangeHandler('active');
      await Promise.resolve();

      // Transition 3: Background again
      await stateChangeHandler('background');
      jest.advanceTimersByTime(2000);

      // Transition 4: Foreground again
      await stateChangeHandler('active');
      await Promise.resolve();

      // Verify: WebSocket should never have disconnected
      expect(socketManager.disconnect).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle reconnection failure gracefully', async () => {
      manager.initialize();

      // Setup: Disconnected state
      (socketManager.getConnectionStatus as jest.Mock).mockReturnValue('disconnected');
      (socketManager.connect as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // App returns to foreground
      await stateChangeHandler('active');
      await Promise.resolve();

      // Verify: Error should be logged but not thrown
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[AppStateManager] Failed to reconnect WebSocket:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle missing token gracefully', async () => {
      manager.initialize();

      // Setup: Disconnected state, no token
      (socketManager.getConnectionStatus as jest.Mock).mockReturnValue('disconnected');
      (storageService.getAccessToken as jest.Mock).mockResolvedValue(null);

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      // App returns to foreground
      await stateChangeHandler('active');
      await Promise.resolve();

      // Verify: Warning should be logged
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[AppStateManager] No access token available for reconnection'
      );

      // Verify: Should not attempt to connect
      expect(socketManager.connect).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });

  describe('Listener Notifications', () => {
    it('should notify all listeners of state changes', async () => {
      manager.initialize();

      const listener1 = jest.fn();
      const listener2 = jest.fn();
      const listener3 = jest.fn();

      manager.subscribe(listener1);
      manager.subscribe(listener2);
      const unsubscribe3 = manager.subscribe(listener3);

      // Unsubscribe listener3
      unsubscribe3();

      // Trigger state change
      await stateChangeHandler('background');

      // Verify: Only subscribed listeners are called
      expect(listener1).toHaveBeenCalledWith('background');
      expect(listener2).toHaveBeenCalledWith('background');
      expect(listener3).not.toHaveBeenCalled();
    });
  });
});
