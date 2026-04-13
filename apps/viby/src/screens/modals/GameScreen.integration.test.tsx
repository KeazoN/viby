/**
 * GameScreen Integration Tests
 * 
 * Tests for GameScreen integration with:
 * - Game store state management
 * - WebSocket event handling
 * - Timer functionality
 * - Answer submission flow
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { GameScreen } from './GameScreen';
import { useGameStore } from '@viby/modules/game';
import { gameService } from '@viby/modules/game';
import type { UseGameWebSocketOptions } from '@viby/modules/game';

// Mock dependencies
jest.mock('@viby/modules/game');

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Add mock for realtime store
jest.mock('@viby/modules/realtime', () => ({
  useRealtimeStore: jest.fn((selector) => {
    const state = {
      connectionStatus: 'connected',
      latency: 50,
      messageQueue: [],
    };
    return selector ? selector(state) : state;
  }),
}));

jest.mock('@viby/modules/auth', () => ({
  useAuthStore: {
    getState: jest.fn(() => ({
      user: { id: 'user-1', username: 'TestUser', avatar: null },
    })),
  },
}));

jest.mock('@viby/modules/matchmaking', () => ({
  matchmakingService: {
    requestMatch: jest.fn(),
  },
}));

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

const mockRoute = {
  params: {
    roomId: 'test-room-123',
  },
};

describe('GameScreen Integration', () => {
  let mockGameWebSocketCallbacks: UseGameWebSocketOptions;
  let mockStoreState: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Setup initial store state
    mockStoreState = {
      activeGame: {
        id: 'game-1',
        roomId: 'test-room-123',
        users: [
          { id: 'user-1', username: 'Player1', avatar: null },
          { id: 'user-2', username: 'Player2', avatar: null },
        ],
        track: {
          id: 'track-1',
          title: 'Test Song',
          artist: 'Test Artist',
          album: 'Test Album',
          artwork: null,
          duration: 180,
          isrc: null,
          provider: 'spotify' as const,
        },
        currentRound: 1,
        totalRounds: 5,
        scores: {
          'user-1': 100,
          'user-2': 80,
        },
        status: 'active' as const,
        createdAt: new Date().toISOString(),
      },
      currentRound: {
        id: 'round-1',
        roundNumber: 1,
        question: 'Which artist released "Test Song" in 2020?',
        options: ['Artist A', 'Artist B', 'Artist C', 'Artist D'],
        correctAnswer: null,
        timeLimit: 30,
        startedAt: new Date().toISOString(),
      },
      scores: {
        'user-1': 100,
        'user-2': 80,
      },
      myAnswer: null,
      opponentAnswered: false,
    };

    (useGameStore as jest.Mock).mockReturnValue(mockStoreState);

    // Capture WebSocket callbacks
    const { useGameWebSocket } = require('@viby/modules/game');
    (useGameWebSocket as jest.Mock).mockImplementation((options: UseGameWebSocketOptions) => {
      mockGameWebSocketCallbacks = options;
    });

    (gameService.submitAnswer as jest.Mock).mockResolvedValue({});
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should update timer when round starts', async () => {
    render(
      <GameScreen
        navigation={mockNavigation as any}
        route={mockRoute as any}
      />
    );

    // Simulate round started event
    act(() => {
      mockGameWebSocketCallbacks.onRoundStarted?.({
        roomId: 'test-room-123',
        round: {
          id: 'round-2',
          roundNumber: 2,
          question: 'New question?',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: null,
          timeLimit: 45,
          startedAt: new Date().toISOString(),
        },
        timestamp: new Date(),
      });
    });

    // Timer should be reset to new time limit
    await waitFor(() => {
      // Timer text should show 0:45
      expect(screen.getByText(/0:45/)).toBeTruthy();
    });
  });

  it('should countdown timer every second', async () => {
    render(
      <GameScreen
        navigation={mockNavigation as any}
        route={mockRoute as any}
      />
    );

    // Initial timer should be 0:30
    expect(screen.getByText(/0:30/)).toBeTruthy();

    // Advance timer by 1 second
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(screen.getByText(/0:29/)).toBeTruthy();
    });

    // Advance timer by 5 more seconds
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(screen.getByText(/0:24/)).toBeTruthy();
    });
  });

  it('should stop timer when round ends', async () => {
    render(
      <GameScreen
        navigation={mockNavigation as any}
        route={mockRoute as any}
      />
    );

    // Advance timer by 5 seconds
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(screen.getByText(/0:25/)).toBeTruthy();
    });

    // Simulate round ended event
    act(() => {
      mockGameWebSocketCallbacks.onRoundEnded?.({
        roomId: 'test-room-123',
        roundId: 'round-1',
        correctAnswer: 'Artist A',
        scores: {
          'user-1': 150,
          'user-2': 80,
        },
        timestamp: new Date(),
      });
    });

    // Timer should stop
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // Timer should still show 0:00 (stopped)
    await waitFor(() => {
      expect(screen.getByText(/0:00/)).toBeTruthy();
    });
  });

  it('should navigate back when game ends', async () => {
    jest.useRealTimers(); // Use real timers for setTimeout

    render(
      <GameScreen
        navigation={mockNavigation as any}
        route={mockRoute as any}
      />
    );

    // Simulate game ended event
    act(() => {
      mockGameWebSocketCallbacks.onGameEnded?.({
        roomId: 'test-room-123',
        finalScores: {
          'user-1': 250,
          'user-2': 200,
        },
        winner: 'user-1',
        timestamp: new Date(),
      });
    });

    // Should navigate back after 2 seconds
    await waitFor(
      () => {
        expect(mockNavigation.goBack).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );
  });

  it('should reset selected answer when new round starts', async () => {
    (gameService.submitAnswer as jest.Mock).mockResolvedValue({});

    render(
      <GameScreen
        navigation={mockNavigation as any}
        route={mockRoute as any}
      />
    );

    // Select an answer
    const optionButton = screen.getByLabelText('Option A: Artist A');
    fireEvent.press(optionButton);

    await waitFor(() => {
      expect(gameService.submitAnswer).toHaveBeenCalled();
    });

    // Simulate new round started
    act(() => {
      mockGameWebSocketCallbacks.onRoundStarted?.({
        roomId: 'test-room-123',
        round: {
          id: 'round-2',
          roundNumber: 2,
          question: 'New question?',
          options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
          correctAnswer: null,
          timeLimit: 30,
          startedAt: new Date().toISOString(),
        },
        timestamp: new Date(),
      });
    });

    // Update store to reflect new round
    (useGameStore as jest.Mock).mockReturnValue({
      ...mockStoreState,
      currentRound: {
        id: 'round-2',
        roundNumber: 2,
        question: 'New question?',
        options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
        correctAnswer: null,
        timeLimit: 30,
        startedAt: new Date().toISOString(),
      },
      myAnswer: null,
    });

    // Should be able to select new answer
    const newOptionButton = screen.getByLabelText('Option A: Option 1');
    expect(newOptionButton).toBeTruthy();
  });

  it('should handle multiple answer submissions correctly', async () => {
    (gameService.submitAnswer as jest.Mock).mockResolvedValue({});

    render(
      <GameScreen
        navigation={mockNavigation as any}
        route={mockRoute as any}
      />
    );

    // Try to select first answer
    const option1 = screen.getByLabelText('Option A: Artist A');
    fireEvent.press(option1);

    await waitFor(() => {
      expect(gameService.submitAnswer).toHaveBeenCalledTimes(1);
    });

    // Update store to show answer was submitted
    (useGameStore as jest.Mock).mockReturnValue({
      ...mockStoreState,
      myAnswer: 'Artist A',
    });

    // Try to select another answer (should be prevented)
    const option2 = screen.getByLabelText('Option B: Artist B');
    fireEvent.press(option2);

    // Should not submit again
    expect(gameService.submitAnswer).toHaveBeenCalledTimes(1);
  });

  it('should display updated scores when round ends', async () => {
    render(
      <GameScreen
        navigation={mockNavigation as any}
        route={mockRoute as any}
      />
    );

    // Initial scores
    expect(screen.getByText('100')).toBeTruthy();
    expect(screen.getByText('80')).toBeTruthy();

    // Simulate round ended with updated scores
    act(() => {
      mockGameWebSocketCallbacks.onRoundEnded?.({
        roomId: 'test-room-123',
        roundId: 'round-1',
        correctAnswer: 'Artist A',
        scores: {
          'user-1': 200,
          'user-2': 150,
        },
        timestamp: new Date(),
      });
    });

    // Update store with new scores
    (useGameStore as jest.Mock).mockReturnValue({
      ...mockStoreState,
      scores: {
        'user-1': 200,
        'user-2': 150,
      },
    });

    // Should display updated scores
    await waitFor(() => {
      expect(screen.getByText('200')).toBeTruthy();
      expect(screen.getByText('150')).toBeTruthy();
    });
  });

  describe('Reconnection Handling Integration', () => {
    beforeEach(() => {
      jest.useRealTimers();
    });

    afterEach(() => {
      jest.useFakeTimers();
    });

    it('should recover game state after reconnection', async () => {
      const { useRealtimeStore } = require('@viby/modules/realtime');
      
      // Mock getGameState to return updated game state
      const updatedGameState = {
        game: {
          ...mockStoreState.activeGame,
          currentRound: 3,
          scores: {
            'user-1': 250,
            'user-2': 200,
          },
        },
        currentRound: {
          id: 'round-3',
          roundNumber: 3,
          question: 'Recovered question?',
          options: ['Opt 1', 'Opt 2', 'Opt 3', 'Opt 4'],
          correctAnswer: null,
          timeLimit: 25,
          startedAt: new Date().toISOString(),
        },
      };

      (gameService.getGameState as jest.Mock).mockResolvedValue(updatedGameState);

      // Start with disconnected state
      let connectionStatus = 'disconnected';
      (useRealtimeStore as jest.Mock).mockImplementation((selector) => {
        const state = {
          connectionStatus,
          latency: 0,
          messageQueue: [],
        };
        return selector ? selector(state) : state;
      });

      const { rerender } = render(
        <GameScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      // Verify disconnected indicator is shown
      expect(screen.getByText('Connection lost')).toBeTruthy();

      // Simulate reconnection
      connectionStatus = 'connected';
      (useRealtimeStore as jest.Mock).mockImplementation((selector) => {
        const state = {
          connectionStatus: 'connected',
          latency: 50,
          messageQueue: [],
        };
        return selector ? selector(state) : state;
      });

      rerender(
        <GameScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      // Should request game state
      await waitFor(() => {
        expect(gameService.getGameState).toHaveBeenCalledWith('test-room-123');
      });

      // Should show syncing message
      expect(screen.getByText('Syncing game state...')).toBeTruthy();
    });

    it('should update timer with recovered round time', async () => {
      const { useRealtimeStore } = require('@viby/modules/realtime');
      
      const recoveredGameState = {
        game: mockStoreState.activeGame,
        currentRound: {
          ...mockStoreState.currentRound,
          timeLimit: 15, // Different time limit
        },
      };

      (gameService.getGameState as jest.Mock).mockResolvedValue(recoveredGameState);

      let connectionStatus = 'disconnected';
      (useRealtimeStore as jest.Mock).mockImplementation((selector) => {
        const state = {
          connectionStatus,
          latency: 0,
          messageQueue: [],
        };
        return selector ? selector(state) : state;
      });

      const { rerender } = render(
        <GameScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      // Reconnect
      connectionStatus = 'connected';
      (useRealtimeStore as jest.Mock).mockImplementation((selector) => {
        const state = {
          connectionStatus: 'connected',
          latency: 50,
          messageQueue: [],
        };
        return selector ? selector(state) : state;
      });

      rerender(
        <GameScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      await waitFor(() => {
        expect(gameService.getGameState).toHaveBeenCalled();
      });

      // Timer should be updated with recovered time
      await waitFor(() => {
        expect(screen.getByText(/0:15/)).toBeTruthy();
      });
    });

    it('should handle reconnection during active round', async () => {
      const { useRealtimeStore } = require('@viby/modules/realtime');
      
      (gameService.submitAnswer as jest.Mock).mockResolvedValue({});
      (gameService.getGameState as jest.Mock).mockResolvedValue({
        game: mockStoreState.activeGame,
        currentRound: mockStoreState.currentRound,
      });

      let connectionStatus = 'connected';
      (useRealtimeStore as jest.Mock).mockImplementation((selector) => {
        const state = {
          connectionStatus,
          latency: 50,
          messageQueue: [],
        };
        return selector ? selector(state) : state;
      });

      const { rerender } = render(
        <GameScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      // Submit an answer
      const optionButton = screen.getByLabelText('Option A: Artist A');
      fireEvent.press(optionButton);

      await waitFor(() => {
        expect(gameService.submitAnswer).toHaveBeenCalled();
      });

      // Simulate disconnection
      connectionStatus = 'disconnected';
      (useRealtimeStore as jest.Mock).mockImplementation((selector) => {
        const state = {
          connectionStatus: 'disconnected',
          latency: 0,
          messageQueue: [],
        };
        return selector ? selector(state) : state;
      });

      rerender(
        <GameScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      // Should show disconnection indicator
      expect(screen.getByText('Connection lost')).toBeTruthy();

      // Reconnect
      connectionStatus = 'connected';
      (useRealtimeStore as jest.Mock).mockImplementation((selector) => {
        const state = {
          connectionStatus: 'connected',
          latency: 50,
          messageQueue: [],
        };
        return selector ? selector(state) : state;
      });

      rerender(
        <GameScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      // Should recover game state
      await waitFor(() => {
        expect(gameService.getGameState).toHaveBeenCalledWith('test-room-123');
      });
    });

    it('should not recover state when transitioning from reconnecting to disconnected', async () => {
      const { useRealtimeStore } = require('@viby/modules/realtime');
      
      (gameService.getGameState as jest.Mock).mockResolvedValue({
        game: mockStoreState.activeGame,
        currentRound: mockStoreState.currentRound,
      });

      let connectionStatus = 'reconnecting';
      (useRealtimeStore as jest.Mock).mockImplementation((selector) => {
        const state = {
          connectionStatus,
          latency: 0,
          messageQueue: [],
        };
        return selector ? selector(state) : state;
      });

      const { rerender } = render(
        <GameScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      // Transition to disconnected (not connected)
      connectionStatus = 'disconnected';
      (useRealtimeStore as jest.Mock).mockImplementation((selector) => {
        const state = {
          connectionStatus: 'disconnected',
          latency: 0,
          messageQueue: [],
        };
        return selector ? selector(state) : state;
      });

      rerender(
        <GameScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      // Should not request game state
      await waitFor(() => {
        expect(gameService.getGameState).not.toHaveBeenCalled();
      });
    });

    it('should handle multiple reconnection attempts', async () => {
      const { useRealtimeStore } = require('@viby/modules/realtime');
      
      (gameService.getGameState as jest.Mock).mockResolvedValue({
        game: mockStoreState.activeGame,
        currentRound: mockStoreState.currentRound,
      });

      let connectionStatus = 'connected';
      (useRealtimeStore as jest.Mock).mockImplementation((selector) => {
        const state = {
          connectionStatus,
          latency: 50,
          messageQueue: [],
        };
        return selector ? selector(state) : state;
      });

      const { rerender } = render(
        <GameScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      // First disconnection
      connectionStatus = 'disconnected';
      (useRealtimeStore as jest.Mock).mockImplementation((selector) => {
        const state = {
          connectionStatus: 'disconnected',
          latency: 0,
          messageQueue: [],
        };
        return selector ? selector(state) : state;
      });

      rerender(
        <GameScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      // First reconnection
      connectionStatus = 'connected';
      (useRealtimeStore as jest.Mock).mockImplementation((selector) => {
        const state = {
          connectionStatus: 'connected',
          latency: 50,
          messageQueue: [],
        };
        return selector ? selector(state) : state;
      });

      rerender(
        <GameScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      await waitFor(() => {
        expect(gameService.getGameState).toHaveBeenCalledTimes(1);
      });

      // Second disconnection
      connectionStatus = 'disconnected';
      (useRealtimeStore as jest.Mock).mockImplementation((selector) => {
        const state = {
          connectionStatus: 'disconnected',
          latency: 0,
          messageQueue: [],
        };
        return selector ? selector(state) : state;
      });

      rerender(
        <GameScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      // Second reconnection
      connectionStatus = 'connected';
      (useRealtimeStore as jest.Mock).mockImplementation((selector) => {
        const state = {
          connectionStatus: 'connected',
          latency: 50,
          messageQueue: [],
        };
        return selector ? selector(state) : state;
      });

      rerender(
        <GameScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      // Should request game state again
      await waitFor(() => {
        expect(gameService.getGameState).toHaveBeenCalledTimes(2);
      });
    });
  });
});
