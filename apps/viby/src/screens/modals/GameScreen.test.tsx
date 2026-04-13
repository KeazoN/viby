/**
 * GameScreen Unit Tests
 * 
 * Tests for the GameScreen modal component including:
 * - Rendering with game state
 * - Answer selection
 * - Timer countdown
 * - Navigation interactions
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { GameScreen } from './GameScreen';
import { useGameStore } from '@viby/modules/game';
import { gameService } from '@viby/modules/game';

// Mock dependencies
jest.mock('@viby/modules/game', () => ({
  useGameStore: jest.fn(),
  useGameWebSocket: jest.fn(),
  gameService: {
    submitAnswer: jest.fn(),
    getGameState: jest.fn(),
  },
}));

jest.mock('@viby/modules/matchmaking', () => ({
  matchmakingService: {
    requestMatch: jest.fn(),
  },
}));

jest.mock('@viby/modules/auth', () => ({
  useAuthStore: {
    getState: jest.fn(() => ({
      user: { id: 'user-1', username: 'TestUser', avatar: null },
    })),
  },
}));

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

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

const mockRoute = {
  params: {
    roomId: 'test-room-123',
  },
};

const mockGameState = {
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

describe('GameScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useGameStore as jest.Mock).mockReturnValue(mockGameState);
  });

  it('should render game screen with round number', () => {
    render(
      <GameScreen
        navigation={mockNavigation as any}
        route={mockRoute as any}
      />
    );

    expect(screen.getByText('Round 1/5')).toBeTruthy();
  });

  it('should display scores for both players', () => {
    render(
      <GameScreen
        navigation={mockNavigation as any}
        route={mockRoute as any}
      />
    );

    expect(screen.getByText('You')).toBeTruthy();
    expect(screen.getByText('100')).toBeTruthy();
    expect(screen.getByText('Opponent')).toBeTruthy();
    expect(screen.getByText('80')).toBeTruthy();
  });

  it('should display the question', () => {
    render(
      <GameScreen
        navigation={mockNavigation as any}
        route={mockRoute as any}
      />
    );

    expect(screen.getByText('Which artist released "Test Song" in 2020?')).toBeTruthy();
  });

  it('should display all answer options', () => {
    render(
      <GameScreen
        navigation={mockNavigation as any}
        route={mockRoute as any}
      />
    );

    expect(screen.getByText('Artist A')).toBeTruthy();
    expect(screen.getByText('Artist B')).toBeTruthy();
    expect(screen.getByText('Artist C')).toBeTruthy();
    expect(screen.getByText('Artist D')).toBeTruthy();
  });

  it('should display countdown timer', () => {
    render(
      <GameScreen
        navigation={mockNavigation as any}
        route={mockRoute as any}
      />
    );

    // Timer should be visible (format: M:SS)
    expect(screen.getByText('⏱️')).toBeTruthy();
  });

  it('should display close button', () => {
    render(
      <GameScreen
        navigation={mockNavigation as any}
        route={mockRoute as any}
      />
    );

    const closeButton = screen.getByLabelText('Close game');
    expect(closeButton).toBeTruthy();
  });

  it('should display chat toggle button', () => {
    render(
      <GameScreen
        navigation={mockNavigation as any}
        route={mockRoute as any}
      />
    );

    const chatButton = screen.getByLabelText('Open chat');
    expect(chatButton).toBeTruthy();
  });

  it('should call navigation.goBack when close button is pressed', () => {
    render(
      <GameScreen
        navigation={mockNavigation as any}
        route={mockRoute as any}
      />
    );

    const closeButton = screen.getByLabelText('Close game');
    fireEvent.press(closeButton);

    expect(mockNavigation.goBack).toHaveBeenCalled();
  });

  it('should navigate to chat when chat button is pressed', () => {
    render(
      <GameScreen
        navigation={mockNavigation as any}
        route={mockRoute as any}
      />
    );

    const chatButton = screen.getByLabelText('Open chat');
    fireEvent.press(chatButton);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Chat', {
      roomId: 'test-room-123',
    });
  });

  it('should submit answer when option is selected', async () => {
    (gameService.submitAnswer as jest.Mock).mockResolvedValue({});

    render(
      <GameScreen
        navigation={mockNavigation as any}
        route={mockRoute as any}
      />
    );

    const optionButton = screen.getByLabelText('Option A: Artist A');
    fireEvent.press(optionButton);

    await waitFor(() => {
      expect(gameService.submitAnswer).toHaveBeenCalledWith(
        'test-room-123',
        'round-1',
        'Artist A'
      );
    });
  });

  it('should not allow selecting answer when already answered', () => {
    (useGameStore as jest.Mock).mockReturnValue({
      ...mockGameState,
      myAnswer: 'Artist A',
    });

    render(
      <GameScreen
        navigation={mockNavigation as any}
        route={mockRoute as any}
      />
    );

    const optionButton = screen.getByLabelText('Option B: Artist B');
    fireEvent.press(optionButton);

    expect(gameService.submitAnswer).not.toHaveBeenCalled();
  });

  it('should display loading state when no game is active', () => {
    (useGameStore as jest.Mock).mockReturnValue({
      activeGame: null,
      currentRound: null,
      scores: {},
      myAnswer: null,
      opponentAnswered: false,
    });

    render(
      <GameScreen
        navigation={mockNavigation as any}
        route={mockRoute as any}
      />
    );

    expect(screen.getByText('Loading game...')).toBeTruthy();
  });

  it('should handle answer submission error gracefully', async () => {
    (gameService.submitAnswer as jest.Mock).mockRejectedValue(
      new Error('Network error')
    );

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    render(
      <GameScreen
        navigation={mockNavigation as any}
        route={mockRoute as any}
      />
    );

    const optionButton = screen.getByLabelText('Option A: Artist A');
    fireEvent.press(optionButton);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to submit answer:',
        expect.any(Error)
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it('should render option labels A, B, C, D', () => {
    render(
      <GameScreen
        navigation={mockNavigation as any}
        route={mockRoute as any}
      />
    );

    expect(screen.getByText('A')).toBeTruthy();
    expect(screen.getByText('B')).toBeTruthy();
    expect(screen.getByText('C')).toBeTruthy();
    expect(screen.getByText('D')).toBeTruthy();
  });

  it('should have accessible labels for all interactive elements', () => {
    render(
      <GameScreen
        navigation={mockNavigation as any}
        route={mockRoute as any}
      />
    );

    expect(screen.getByLabelText('Close game')).toBeTruthy();
    expect(screen.getByLabelText('Open chat')).toBeTruthy();
    expect(screen.getByLabelText('Option A: Artist A')).toBeTruthy();
    expect(screen.getByLabelText('Option B: Artist B')).toBeTruthy();
    expect(screen.getByLabelText('Option C: Artist C')).toBeTruthy();
    expect(screen.getByLabelText('Option D: Artist D')).toBeTruthy();
  });

  describe('Reconnection Handling', () => {
    it('should display reconnection indicator when disconnected', () => {
      const { useRealtimeStore } = require('@viby/modules/realtime');
      (useRealtimeStore as jest.Mock).mockImplementation((selector) => {
        const state = {
          connectionStatus: 'disconnected',
          latency: 0,
          messageQueue: [],
        };
        return selector ? selector(state) : state;
      });

      render(
        <GameScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      expect(screen.getByText('Connection lost')).toBeTruthy();
      expect(screen.getByText('⚠️')).toBeTruthy();
    });

    it('should display reconnecting indicator when reconnecting', () => {
      const { useRealtimeStore } = require('@viby/modules/realtime');
      (useRealtimeStore as jest.Mock).mockImplementation((selector) => {
        const state = {
          connectionStatus: 'reconnecting',
          latency: 0,
          messageQueue: [],
        };
        return selector ? selector(state) : state;
      });

      render(
        <GameScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      expect(screen.getByText('Reconnecting...')).toBeTruthy();
      expect(screen.getByText('🔄')).toBeTruthy();
    });

    it('should not display reconnection indicator when connected', () => {
      const { useRealtimeStore } = require('@viby/modules/realtime');
      (useRealtimeStore as jest.Mock).mockImplementation((selector) => {
        const state = {
          connectionStatus: 'connected',
          latency: 50,
          messageQueue: [],
        };
        return selector ? selector(state) : state;
      });

      render(
        <GameScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      expect(screen.queryByText('Connection lost')).toBeNull();
      expect(screen.queryByText('Reconnecting...')).toBeNull();
    });

    it('should request game state when reconnecting to connected', async () => {
      const mockGetGameState = jest.fn().mockResolvedValue({
        game: mockGameState.activeGame,
        currentRound: mockGameState.currentRound,
      });
      (gameService.getGameState as jest.Mock) = mockGetGameState;

      const { useRealtimeStore } = require('@viby/modules/realtime');
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

      // Change connection status to connected
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
        expect(mockGetGameState).toHaveBeenCalledWith('test-room-123');
      });
    });

    it('should display syncing message while recovering game state', async () => {
      const mockGetGameState = jest.fn().mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              game: mockGameState.activeGame,
              currentRound: mockGameState.currentRound,
            });
          }, 100);
        });
      });
      (gameService.getGameState as jest.Mock) = mockGetGameState;

      const { useRealtimeStore } = require('@viby/modules/realtime');
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

      // Change connection status to connected
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

      // Should show syncing message
      await waitFor(() => {
        expect(screen.getByText('Syncing game state...')).toBeTruthy();
      });
    });

    it('should handle game state recovery error gracefully', async () => {
      const mockGetGameState = jest.fn().mockRejectedValue(new Error('Network error'));
      (gameService.getGameState as jest.Mock) = mockGetGameState;

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const { useRealtimeStore } = require('@viby/modules/realtime');
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

      // Change connection status to connected
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
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to recover game state:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it('should not request game state if game has ended', async () => {
      const mockGetGameState = jest.fn();
      (gameService.getGameState as jest.Mock) = mockGetGameState;

      const { useRealtimeStore } = require('@viby/modules/realtime');
      const mockUseGameWebSocket = require('@viby/modules/game').useGameWebSocket as jest.Mock;
      
      let connectionStatus = 'disconnected';

      (useRealtimeStore as jest.Mock).mockImplementation((selector) => {
        const state = {
          connectionStatus,
          latency: 0,
          messageQueue: [],
        };
        return selector ? selector(state) : state;
      });

      // Simulate game ended
      mockUseGameWebSocket.mockImplementation(({ onGameEnded }: any) => {
        setTimeout(() => {
          onGameEnded({
            roomId: 'test-room-123',
            finalScores: { 'user-1': 150, 'user-2': 100 },
            winner: 'user-1',
            timestamp: new Date(),
          });
        }, 0);
      });

      const { rerender } = render(
        <GameScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Game Over')).toBeTruthy();
      });

      // Change connection status to connected after game ended
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

      // Should not request game state since game has ended
      await waitFor(() => {
        expect(mockGetGameState).not.toHaveBeenCalled();
      });
    });
  });

  describe('Game End Handling', () => {
    it('should display game over screen when game ends', () => {
      // Mock useGameWebSocket to trigger onGameEnded
      const mockUseGameWebSocket = require('@viby/modules/game').useGameWebSocket as jest.Mock;
      mockUseGameWebSocket.mockImplementation(({ onGameEnded }: any) => {
        // Simulate game ended event
        setTimeout(() => {
          onGameEnded({
            roomId: 'test-room-123',
            finalScores: { 'user-1': 150, 'user-2': 100 },
            winner: 'user-1',
            timestamp: new Date(),
          });
        }, 0);
      });

      render(
        <GameScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      // Wait for game end screen to appear
      waitFor(() => {
        expect(screen.getByText('Game Over')).toBeTruthy();
      });
    });

    it('should display winner announcement when user wins', async () => {
      const mockUseGameWebSocket = require('@viby/modules/game').useGameWebSocket as jest.Mock;
      mockUseGameWebSocket.mockImplementation(({ onGameEnded }: any) => {
        setTimeout(() => {
          onGameEnded({
            roomId: 'test-room-123',
            finalScores: { 'user-1': 150, 'user-2': 100 },
            winner: 'user-1',
            timestamp: new Date(),
          });
        }, 0);
      });

      render(
        <GameScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('You Win!')).toBeTruthy();
        expect(screen.getByText('Great job!')).toBeTruthy();
      });
    });

    it('should display loser message when user loses', async () => {
      const mockUseGameWebSocket = require('@viby/modules/game').useGameWebSocket as jest.Mock;
      mockUseGameWebSocket.mockImplementation(({ onGameEnded }: any) => {
        setTimeout(() => {
          onGameEnded({
            roomId: 'test-room-123',
            finalScores: { 'user-1': 100, 'user-2': 150 },
            winner: 'user-2',
            timestamp: new Date(),
          });
        }, 0);
      });

      render(
        <GameScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('You Lose')).toBeTruthy();
        expect(screen.getByText('Better luck next time!')).toBeTruthy();
      });
    });

    it('should display tie message when scores are equal', async () => {
      const mockUseGameWebSocket = require('@viby/modules/game').useGameWebSocket as jest.Mock;
      mockUseGameWebSocket.mockImplementation(({ onGameEnded }: any) => {
        setTimeout(() => {
          onGameEnded({
            roomId: 'test-room-123',
            finalScores: { 'user-1': 100, 'user-2': 100 },
            winner: null,
            timestamp: new Date(),
          });
        }, 0);
      });

      render(
        <GameScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("It's a Tie!")).toBeTruthy();
      });
    });

    it('should display final scores on game end', async () => {
      const mockUseGameWebSocket = require('@viby/modules/game').useGameWebSocket as jest.Mock;
      mockUseGameWebSocket.mockImplementation(({ onGameEnded }: any) => {
        setTimeout(() => {
          onGameEnded({
            roomId: 'test-room-123',
            finalScores: { 'user-1': 150, 'user-2': 100 },
            winner: 'user-1',
            timestamp: new Date(),
          });
        }, 0);
      });

      render(
        <GameScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Final Scores')).toBeTruthy();
        expect(screen.getByText('150')).toBeTruthy();
        expect(screen.getByText('100')).toBeTruthy();
      });
    });

    it('should display rematch button on game end', async () => {
      const mockUseGameWebSocket = require('@viby/modules/game').useGameWebSocket as jest.Mock;
      mockUseGameWebSocket.mockImplementation(({ onGameEnded }: any) => {
        setTimeout(() => {
          onGameEnded({
            roomId: 'test-room-123',
            finalScores: { 'user-1': 150, 'user-2': 100 },
            winner: 'user-1',
            timestamp: new Date(),
          });
        }, 0);
      });

      render(
        <GameScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText('Request rematch')).toBeTruthy();
      });
    });

    it('should display return to discovery button on game end', async () => {
      const mockUseGameWebSocket = require('@viby/modules/game').useGameWebSocket as jest.Mock;
      mockUseGameWebSocket.mockImplementation(({ onGameEnded }: any) => {
        setTimeout(() => {
          onGameEnded({
            roomId: 'test-room-123',
            finalScores: { 'user-1': 150, 'user-2': 100 },
            winner: 'user-1',
            timestamp: new Date(),
          });
        }, 0);
      });

      render(
        <GameScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText('Return to discovery')).toBeTruthy();
      });
    });

    it('should navigate to discovery when return button is pressed', async () => {
      const mockUseGameWebSocket = require('@viby/modules/game').useGameWebSocket as jest.Mock;
      mockUseGameWebSocket.mockImplementation(({ onGameEnded }: any) => {
        setTimeout(() => {
          onGameEnded({
            roomId: 'test-room-123',
            finalScores: { 'user-1': 150, 'user-2': 100 },
            winner: 'user-1',
            timestamp: new Date(),
          });
        }, 0);
      });

      render(
        <GameScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      await waitFor(() => {
        const returnButton = screen.getByLabelText('Return to discovery');
        fireEvent.press(returnButton);
      });

      expect(mockNavigation.navigate).toHaveBeenCalledWith('Discovery');
    });
  });
});
