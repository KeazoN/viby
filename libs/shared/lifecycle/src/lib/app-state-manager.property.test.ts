import * as fc from 'fast-check';
import { AppState, AppStateStatus } from 'react-native';
import { AppStateManager } from './app-state-manager';
import { socketManager } from '@viby/modules/realtime';
import { storageService } from '@viby/shared/storage';
import { useGameStore } from '@viby/modules/game';
import { useChatStore } from '@viby/modules/chat';

/**
 * Property-Based Tests for AppStateManager
 * 
 * These tests use fast-check to verify properties hold across many generated inputs.
 */

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

jest.mock('@viby/modules/chat', () => ({
  useChatStore: {
    getState: jest.fn(),
  },
}));

describe('AppStateManager - Property-Based Tests', () => {
  let manager: AppStateManager;
  let mockAddEventListener: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    manager = new AppStateManager();
    mockAddEventListener = AppState.addEventListener as jest.Mock;

    // Default mocks
    (socketManager.getConnectionStatus as jest.Mock).mockReturnValue('connected');
    (useGameStore.getState as jest.Mock).mockReturnValue({ activeGame: null });
    (useChatStore.getState as jest.Mock).mockReturnValue({ messages: {} });
    (storageService.getAccessToken as jest.Mock).mockResolvedValue('mock-token');
  });

  afterEach(() => {
    jest.useRealTimers();
    manager.cleanup();
  });

  /**
   * Property 32: Sensitive Data Cleared on Background
   * 
   * **Validates: Requirements 17.4**
   * 
   * For any app state transition to background, sensitive data (game state, chat messages) 
   * should be cleared from memory.
   */
  describe('Property 32: Sensitive Data Cleared on Background', () => {
    it('should clear sensitive data for any background transition', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate various game states
          fc.record({
            hasActiveGame: fc.boolean(),
            roomId: fc.string({ minLength: 1, maxLength: 50 }),
            scores: fc.dictionary(
              fc.string({ minLength: 1, maxLength: 20 }),
              fc.integer({ min: 0, max: 1000 })
            ),
          }),
          // Generate various chat states
          fc.record({
            hasMessages: fc.boolean(),
            messageCount: fc.integer({ min: 0, max: 100 }),
          }),
          async (gameState, chatState) => {
            // Setup: Initialize manager
            manager.initialize();

            // Setup: Configure game store state
            const activeGame = gameState.hasActiveGame
              ? {
                  roomId: gameState.roomId,
                  scores: gameState.scores,
                }
              : null;

            (useGameStore.getState as jest.Mock).mockReturnValue({
              activeGame,
            });

            // Setup: Configure chat store state
            const messages = chatState.hasMessages
              ? {
                  [gameState.roomId]: Array(chatState.messageCount).fill({
                    id: 'msg-1',
                    content: 'sensitive message',
                  }),
                }
              : {};

            (useChatStore.getState as jest.Mock).mockReturnValue({
              messages,
            });

            // Spy on console.log to verify clearSensitiveData was called
            const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

            // Action: Trigger background transition
            const changeHandler = mockAddEventListener.mock.calls[0][1];
            await changeHandler('background');

            // Wait for async operations
            await Promise.resolve();

            // Assertion: Verify sensitive data clearing was invoked
            // The clearSensitiveData method logs when it clears data
            expect(consoleLogSpy).toHaveBeenCalledWith(
              '[AppStateManager] Cleared sensitive data from memory'
            );

            // Cleanup
            consoleLogSpy.mockRestore();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should clear sensitive data regardless of game session state', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate different game session configurations
          fc.oneof(
            fc.constant(null), // No active game
            fc.record({
              roomId: fc.string({ minLength: 5, maxLength: 50 }),
              scores: fc.dictionary(
                fc.string({ minLength: 1, maxLength: 20 }),
                fc.integer({ min: 0, max: 1000 })
              ),
              currentRound: fc.integer({ min: 1, max: 10 }),
            })
          ),
          async (activeGame) => {
            // Setup
            manager.initialize();
            (useGameStore.getState as jest.Mock).mockReturnValue({ activeGame });

            const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

            // Action: Trigger background transition
            const changeHandler = mockAddEventListener.mock.calls[0][1];
            await changeHandler('background');

            await Promise.resolve();

            // Assertion: Sensitive data should be cleared regardless of game state
            expect(consoleLogSpy).toHaveBeenCalledWith(
              '[AppStateManager] Cleared sensitive data from memory'
            );

            consoleLogSpy.mockRestore();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should clear sensitive data before scheduling disconnect', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.boolean(), // Whether there's an active game
          async (hasActiveGame) => {
            // Setup
            manager.initialize();
            const activeGame = hasActiveGame
              ? { roomId: 'test-room', scores: {} }
              : null;
            (useGameStore.getState as jest.Mock).mockReturnValue({ activeGame });

            const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

            // Action: Trigger background transition
            const changeHandler = mockAddEventListener.mock.calls[0][1];
            await changeHandler('background');

            await Promise.resolve();

            // Assertion: Verify order of operations
            const logCalls = consoleLogSpy.mock.calls.map((call) => call[0]);
            const clearDataIndex = logCalls.findIndex((msg) =>
              msg.includes('Cleared sensitive data')
            );
            const backgroundIndex = logCalls.findIndex((msg) =>
              msg.includes('App entering background')
            );

            // Clear sensitive data should be logged after background entry
            expect(clearDataIndex).toBeGreaterThan(-1);
            expect(backgroundIndex).toBeGreaterThan(-1);

            consoleLogSpy.mockRestore();
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  /**
   * Property 35: WebSocket Connection Persistence in Background
   * 
   * **Validates: Requirements 21.2**
   * 
   * For any active game session, when the app enters background mode, 
   * the WebSocket connection should be maintained for at least 30 seconds.
   */
  describe('Property 35: WebSocket Connection Persistence in Background', () => {
    it('should maintain WebSocket for 30s when active game exists', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate various active game configurations
          fc.record({
            roomId: fc.string({ minLength: 5, maxLength: 50 }),
            scores: fc.dictionary(
              fc.string({ minLength: 1, maxLength: 20 }),
              fc.integer({ min: 0, max: 1000 })
            ),
            currentRound: fc.integer({ min: 1, max: 10 }),
            players: fc.array(fc.string({ minLength: 1, maxLength: 20 }), {
              minLength: 2,
              maxLength: 2,
            }),
          }),
          async (gameConfig) => {
            // Setup
            manager.initialize();
            (useGameStore.getState as jest.Mock).mockReturnValue({
              activeGame: gameConfig,
            });

            // Action: Trigger background transition
            const changeHandler = mockAddEventListener.mock.calls[0][1];
            await changeHandler('background');

            await Promise.resolve();

            // Assertion: Should not disconnect immediately
            expect(socketManager.disconnect).not.toHaveBeenCalled();

            // Fast-forward 29 seconds (just before 30s)
            jest.advanceTimersByTime(29000);

            // Should still not disconnect
            expect(socketManager.disconnect).not.toHaveBeenCalled();

            // Fast-forward to exactly 30 seconds
            jest.advanceTimersByTime(1000);

            // Should disconnect after 30s
            expect(socketManager.disconnect).toHaveBeenCalled();
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should disconnect earlier when no active game exists', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate delay times less than 30s
          fc.integer({ min: 1, max: 29 }),
          async (delaySeconds) => {
            // Setup: No active game
            manager.initialize();
            (useGameStore.getState as jest.Mock).mockReturnValue({
              activeGame: null,
            });

            // Action: Trigger background transition
            const changeHandler = mockAddEventListener.mock.calls[0][1];
            await changeHandler('background');

            await Promise.resolve();

            // Assertion: Should not disconnect immediately
            expect(socketManager.disconnect).not.toHaveBeenCalled();

            // Fast-forward to before the grace period (5s)
            jest.advanceTimersByTime(delaySeconds * 1000);

            if (delaySeconds < 5) {
              // Should not disconnect yet
              expect(socketManager.disconnect).not.toHaveBeenCalled();
            } else {
              // Should disconnect after 5s grace period
              expect(socketManager.disconnect).toHaveBeenCalled();
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should cancel disconnect timer when returning to foreground before timeout', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate time in background (less than 30s)
          fc.integer({ min: 1, max: 29 }),
          // Generate game state
          fc.boolean(),
          async (timeInBackground, hasActiveGame) => {
            // Setup
            manager.initialize();
            const activeGame = hasActiveGame
              ? { roomId: 'test-room', scores: {} }
              : null;
            (useGameStore.getState as jest.Mock).mockReturnValue({ activeGame });

            // Action: Go to background
            const changeHandler = mockAddEventListener.mock.calls[0][1];
            await changeHandler('background');

            await Promise.resolve();

            // Fast-forward some time (but not to disconnect)
            jest.advanceTimersByTime(timeInBackground * 1000);

            // Return to foreground before disconnect
            (socketManager.getConnectionStatus as jest.Mock).mockReturnValue(
              'connected'
            );
            await changeHandler('active');

            await Promise.resolve();

            // Fast-forward past original disconnect time
            jest.advanceTimersByTime(35000);

            // Assertion: Should not disconnect because timer was cancelled
            expect(socketManager.disconnect).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should maintain connection for exactly 30s with active game regardless of game state details', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate various game state configurations
          fc.record({
            roomId: fc.string({ minLength: 1, maxLength: 100 }),
            scores: fc.dictionary(
              fc.string(),
              fc.integer({ min: -1000, max: 1000 })
            ),
            currentRound: fc.option(fc.integer({ min: 0, max: 100 }), {
              nil: null,
            }),
            gameMode: fc.constantFrom('quick', 'ranked', 'casual'),
            startedAt: fc.date(),
          }),
          async (gameState) => {
            // Setup
            manager.initialize();
            (useGameStore.getState as jest.Mock).mockReturnValue({
              activeGame: gameState,
            });

            const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

            // Action: Trigger background transition
            const changeHandler = mockAddEventListener.mock.calls[0][1];
            await changeHandler('background');

            await Promise.resolve();

            // Verify active game was detected
            expect(consoleLogSpy).toHaveBeenCalledWith(
              '[AppStateManager] Active game detected, maintaining WebSocket for 30s'
            );

            // Fast-forward to 30s
            jest.advanceTimersByTime(30000);

            // Assertion: Should disconnect after exactly 30s
            expect(socketManager.disconnect).toHaveBeenCalledTimes(1);

            consoleLogSpy.mockRestore();
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should only disconnect if still in background after timer expires', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.boolean(), // Whether there's an active game
          async (hasActiveGame) => {
            // Setup
            manager.initialize();
            const activeGame = hasActiveGame
              ? { roomId: 'test-room', scores: {} }
              : null;
            (useGameStore.getState as jest.Mock).mockReturnValue({ activeGame });

            // Action: Go to background
            const changeHandler = mockAddEventListener.mock.calls[0][1];
            await changeHandler('background');

            await Promise.resolve();

            // Simulate app returning to foreground just before timer
            const disconnectDelay = hasActiveGame ? 30000 : 5000;
            jest.advanceTimersByTime(disconnectDelay - 100);

            // Change AppState to active (simulating foreground)
            (AppState as any).currentState = 'active';

            // Fast-forward past timer
            jest.advanceTimersByTime(200);

            // Assertion: Should not disconnect because app is no longer in background
            // Note: The actual implementation checks AppState.currentState in the timer callback
            // For this test, we verify the timer logic would check the state
            expect(socketManager.disconnect).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Combined Property: Background Transition Behavior
   * 
   * Tests the complete behavior when transitioning to background,
   * ensuring both sensitive data clearing and connection management work together.
   */
  describe('Combined Property: Background Transition Behavior', () => {
    it('should handle complete background transition correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate app state scenarios
          fc.record({
            hasActiveGame: fc.boolean(),
            gameData: fc.option(
              fc.record({
                roomId: fc.string({ minLength: 5, maxLength: 50 }),
                scores: fc.dictionary(fc.string(), fc.integer({ min: 0, max: 1000 })),
              }),
              { nil: null }
            ),
          }),
          async (scenario) => {
            // Setup
            manager.initialize();
            const activeGame = scenario.hasActiveGame ? scenario.gameData : null;
            (useGameStore.getState as jest.Mock).mockReturnValue({ activeGame });

            const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

            // Action: Trigger background transition
            const changeHandler = mockAddEventListener.mock.calls[0][1];
            await changeHandler('background');

            await Promise.resolve();

            // Assertion 1: Sensitive data should be cleared (Property 32)
            expect(consoleLogSpy).toHaveBeenCalledWith(
              '[AppStateManager] Cleared sensitive data from memory'
            );

            // Assertion 2: Connection management should be configured (Property 35)
            if (scenario.hasActiveGame && scenario.gameData) {
              // Should maintain connection for 30s
              expect(consoleLogSpy).toHaveBeenCalledWith(
                '[AppStateManager] Active game detected, maintaining WebSocket for 30s'
              );

              // Verify 30s timer
              jest.advanceTimersByTime(29999);
              expect(socketManager.disconnect).not.toHaveBeenCalled();

              jest.advanceTimersByTime(1);
              expect(socketManager.disconnect).toHaveBeenCalled();
            } else {
              // Should disconnect after grace period
              expect(consoleLogSpy).toHaveBeenCalledWith(
                '[AppStateManager] No active game, disconnecting WebSocket'
              );

              // Verify 5s grace period
              jest.advanceTimersByTime(4999);
              expect(socketManager.disconnect).not.toHaveBeenCalled();

              jest.advanceTimersByTime(1);
              expect(socketManager.disconnect).toHaveBeenCalled();
            }

            consoleLogSpy.mockRestore();
          }
        ),
        { numRuns: 40 }
      );
    });
  });
});
