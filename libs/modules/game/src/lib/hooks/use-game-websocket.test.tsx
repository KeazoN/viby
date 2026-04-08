import { renderHook, act, waitFor } from '@testing-library/react';
import { useGameWebSocket } from './use-game-websocket';
import { useGameStore } from '../stores/game-store';
import { socketManager } from '@viby/modules/realtime';
import { gameService } from '../services/game-service';
import type {
  GameSession,
  Round,
  Track,
  User,
  GameStartedPayload,
  RoundStartedPayload,
  AnswerSubmittedPayload,
  RoundEndedPayload,
  GameEndedPayload,
} from '../types';

// Mock dependencies
jest.mock('@viby/modules/realtime', () => ({
  socketManager: {
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
  },
}));

jest.mock('../services/game-service', () => ({
  gameService: {
    subscribeToGameEvents: jest.fn(),
    unsubscribeFromGameEvents: jest.fn(),
  },
}));

describe('useGameWebSocket', () => {
  const roomId = 'room-1';
  let mockSubscribe: jest.Mock;
  let mockUnsubscribe: jest.Mock;
  let mockServiceSubscribe: jest.Mock;
  let mockServiceUnsubscribe: jest.Mock;

  beforeEach(() => {
    // Clear store before each test
    const store = useGameStore.getState();
    store.endGame();

    // Reset mocks
    mockSubscribe = socketManager.subscribe as jest.Mock;
    mockUnsubscribe = socketManager.unsubscribe as jest.Mock;
    mockServiceSubscribe = gameService.subscribeToGameEvents as jest.Mock;
    mockServiceUnsubscribe = gameService.unsubscribeFromGameEvents as jest.Mock;

    mockSubscribe.mockClear();
    mockUnsubscribe.mockClear();
    mockServiceSubscribe.mockClear();
    mockServiceUnsubscribe.mockClear();
  });

  it('should subscribe to game events on mount', () => {
    renderHook(() => useGameWebSocket({ roomId }));

    expect(mockSubscribe).toHaveBeenCalledWith('game:started', expect.any(Function));
    expect(mockSubscribe).toHaveBeenCalledWith('round:started', expect.any(Function));
    expect(mockSubscribe).toHaveBeenCalledWith('answer:submitted', expect.any(Function));
    expect(mockSubscribe).toHaveBeenCalledWith('round:ended', expect.any(Function));
    expect(mockSubscribe).toHaveBeenCalledWith('game:ended', expect.any(Function));
    expect(mockServiceSubscribe).toHaveBeenCalledWith(roomId);
  });

  it('should unsubscribe from game events on unmount', () => {
    const { unmount } = renderHook(() => useGameWebSocket({ roomId }));

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledWith('game:started', expect.any(Function));
    expect(mockUnsubscribe).toHaveBeenCalledWith('round:started', expect.any(Function));
    expect(mockUnsubscribe).toHaveBeenCalledWith('answer:submitted', expect.any(Function));
    expect(mockUnsubscribe).toHaveBeenCalledWith('round:ended', expect.any(Function));
    expect(mockUnsubscribe).toHaveBeenCalledWith('game:ended', expect.any(Function));
    expect(mockServiceUnsubscribe).toHaveBeenCalledWith(roomId);
  });

  it('should not subscribe when enabled is false', () => {
    renderHook(() => useGameWebSocket({ roomId, enabled: false }));

    expect(mockSubscribe).not.toHaveBeenCalled();
    expect(mockServiceSubscribe).not.toHaveBeenCalled();
  });

  it('should handle game:started event', () => {
    const onGameStarted = jest.fn();
    renderHook(() => useGameWebSocket({ roomId, onGameStarted }));

    const track: Track = {
      id: 'track-1',
      title: 'Test Song',
      artist: 'Test Artist',
      album: 'Test Album',
      artwork: 'https://example.com/artwork.jpg',
      duration: 180,
      isrc: null,
      provider: 'spotify',
    };

    const user1: User = {
      id: 'user-1',
      username: 'testuser1',
      avatar: null,
    };

    const user2: User = {
      id: 'user-2',
      username: 'testuser2',
      avatar: null,
    };

    const gameSession: GameSession = {
      id: 'game-1',
      roomId,
      users: [user1, user2],
      track,
      currentRound: 1,
      totalRounds: 5,
      scores: { 'user-1': 0, 'user-2': 0 },
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    const payload: GameStartedPayload = {
      game: gameSession,
      timestamp: new Date(),
    };

    // Get the handler that was registered
    const gameStartedHandler = mockSubscribe.mock.calls.find(
      (call) => call[0] === 'game:started'
    )?.[1];

    act(() => {
      gameStartedHandler(payload);
    });

    expect(useGameStore.getState().activeGame).toEqual(gameSession);
    expect(onGameStarted).toHaveBeenCalledWith(payload);
  });

  it('should handle round:started event', () => {
    const onRoundStarted = jest.fn();
    renderHook(() => useGameWebSocket({ roomId, onRoundStarted }));

    const round: Round = {
      id: 'round-1',
      roundNumber: 1,
      question: 'What year was this song released?',
      options: ['2020', '2021', '2022', '2023'],
      correctAnswer: null,
      timeLimit: 30,
      startedAt: new Date().toISOString(),
    };

    const payload: RoundStartedPayload = {
      roomId,
      round,
      timestamp: new Date(),
    };

    // Get the handler that was registered
    const roundStartedHandler = mockSubscribe.mock.calls.find(
      (call) => call[0] === 'round:started'
    )?.[1];

    act(() => {
      roundStartedHandler(payload);
    });

    expect(useGameStore.getState().currentRound).toEqual(round);
    expect(onRoundStarted).toHaveBeenCalledWith(payload);
  });

  it('should ignore round:started event for different room', () => {
    const onRoundStarted = jest.fn();
    renderHook(() => useGameWebSocket({ roomId, onRoundStarted }));

    const round: Round = {
      id: 'round-1',
      roundNumber: 1,
      question: 'What year was this song released?',
      options: ['2020', '2021', '2022', '2023'],
      correctAnswer: null,
      timeLimit: 30,
      startedAt: new Date().toISOString(),
    };

    const payload: RoundStartedPayload = {
      roomId: 'different-room',
      round,
      timestamp: new Date(),
    };

    // Get the handler that was registered
    const roundStartedHandler = mockSubscribe.mock.calls.find(
      (call) => call[0] === 'round:started'
    )?.[1];

    act(() => {
      roundStartedHandler(payload);
    });

    expect(useGameStore.getState().currentRound).toBeNull();
    expect(onRoundStarted).not.toHaveBeenCalled();
  });

  it('should handle answer:submitted event', () => {
    const onAnswerSubmitted = jest.fn();
    renderHook(() => useGameWebSocket({ roomId, onAnswerSubmitted }));

    const payload: AnswerSubmittedPayload = {
      roomId,
      userId: 'user-2',
      roundId: 'round-1',
      timestamp: new Date(),
    };

    // Get the handler that was registered
    const answerSubmittedHandler = mockSubscribe.mock.calls.find(
      (call) => call[0] === 'answer:submitted'
    )?.[1];

    act(() => {
      answerSubmittedHandler(payload);
    });

    expect(useGameStore.getState().opponentAnswered).toBe(true);
    expect(onAnswerSubmitted).toHaveBeenCalledWith(payload);
  });

  it('should handle round:ended event', () => {
    const onRoundEnded = jest.fn();
    renderHook(() => useGameWebSocket({ roomId, onRoundEnded }));

    const payload: RoundEndedPayload = {
      roomId,
      roundId: 'round-1',
      correctAnswer: '2022',
      scores: { 'user-1': 100, 'user-2': 50 },
      timestamp: new Date(),
    };

    // Get the handler that was registered
    const roundEndedHandler = mockSubscribe.mock.calls.find(
      (call) => call[0] === 'round:ended'
    )?.[1];

    act(() => {
      roundEndedHandler(payload);
    });

    expect(useGameStore.getState().scores).toEqual({ 'user-1': 100, 'user-2': 50 });
    expect(onRoundEnded).toHaveBeenCalledWith(payload);
  });

  it('should handle game:ended event and end game after delay', async () => {
    jest.useFakeTimers();

    const onGameEnded = jest.fn();
    renderHook(() => useGameWebSocket({ roomId, onGameEnded }));

    // Start a game first
    const track: Track = {
      id: 'track-1',
      title: 'Test Song',
      artist: 'Test Artist',
      album: 'Test Album',
      artwork: 'https://example.com/artwork.jpg',
      duration: 180,
      isrc: null,
      provider: 'spotify',
    };

    const user1: User = {
      id: 'user-1',
      username: 'testuser1',
      avatar: null,
    };

    const user2: User = {
      id: 'user-2',
      username: 'testuser2',
      avatar: null,
    };

    const gameSession: GameSession = {
      id: 'game-1',
      roomId,
      users: [user1, user2],
      track,
      currentRound: 5,
      totalRounds: 5,
      scores: { 'user-1': 400, 'user-2': 300 },
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    act(() => {
      useGameStore.getState().startGame(gameSession);
    });

    const payload: GameEndedPayload = {
      roomId,
      finalScores: { 'user-1': 500, 'user-2': 400 },
      winner: 'user-1',
      timestamp: new Date(),
    };

    // Get the handler that was registered
    const gameEndedHandler = mockSubscribe.mock.calls.find(
      (call) => call[0] === 'game:ended'
    )?.[1];

    act(() => {
      gameEndedHandler(payload);
    });

    expect(useGameStore.getState().scores).toEqual({ 'user-1': 500, 'user-2': 400 });
    expect(onGameEnded).toHaveBeenCalledWith(payload);
    expect(useGameStore.getState().activeGame).not.toBeNull();

    // Fast-forward time by 500ms
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(useGameStore.getState().activeGame).toBeNull();

    jest.useRealTimers();
  });

  it('should resubscribe when roomId changes', () => {
    const { rerender } = renderHook(
      ({ roomId }) => useGameWebSocket({ roomId }),
      { initialProps: { roomId: 'room-1' } }
    );

    expect(mockServiceSubscribe).toHaveBeenCalledWith('room-1');

    // Change roomId
    rerender({ roomId: 'room-2' });

    expect(mockServiceUnsubscribe).toHaveBeenCalledWith('room-1');
    expect(mockServiceSubscribe).toHaveBeenCalledWith('room-2');
  });
});
