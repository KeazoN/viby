import { renderHook, act } from '@testing-library/react';
import { useGameSession } from './use-game-session';
import { useGameStore } from '../stores/game-store';
import type { GameSession, Track, User } from '../types';

describe('useGameSession', () => {
  beforeEach(() => {
    // Clear store before each test
    const store = useGameStore.getState();
    store.endGame();
  });

  it('should return null when no game is active', () => {
    const { result } = renderHook(() => useGameSession());

    expect(result.current).toBeNull();
  });

  it('should return active game session', () => {
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
      roomId: 'room-1',
      users: [user1, user2],
      track,
      currentRound: 1,
      totalRounds: 5,
      scores: { 'user-1': 0, 'user-2': 0 },
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    const { result } = renderHook(() => useGameSession());

    act(() => {
      useGameStore.getState().startGame(gameSession);
    });

    expect(result.current).toEqual(gameSession);
  });

  it('should update when game session changes', () => {
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

    const gameSession1: GameSession = {
      id: 'game-1',
      roomId: 'room-1',
      users: [user1, user2],
      track,
      currentRound: 1,
      totalRounds: 5,
      scores: { 'user-1': 0, 'user-2': 0 },
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    const { result } = renderHook(() => useGameSession());

    act(() => {
      useGameStore.getState().startGame(gameSession1);
    });

    expect(result.current?.id).toBe('game-1');
    expect(result.current?.currentRound).toBe(1);

    const gameSession2: GameSession = {
      ...gameSession1,
      currentRound: 2,
    };

    act(() => {
      useGameStore.getState().startGame(gameSession2);
    });

    expect(result.current?.currentRound).toBe(2);
  });

  it('should return null after game ends', () => {
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
      roomId: 'room-1',
      users: [user1, user2],
      track,
      currentRound: 1,
      totalRounds: 5,
      scores: { 'user-1': 0, 'user-2': 0 },
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    const { result } = renderHook(() => useGameSession());

    act(() => {
      useGameStore.getState().startGame(gameSession);
    });

    expect(result.current).not.toBeNull();

    act(() => {
      useGameStore.getState().endGame();
    });

    expect(result.current).toBeNull();
  });

  it('should not re-render when other game state changes', () => {
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
      roomId: 'room-1',
      users: [user1, user2],
      track,
      currentRound: 1,
      totalRounds: 5,
      scores: { 'user-1': 0, 'user-2': 0 },
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    let renderCount = 0;
    const { result } = renderHook(() => {
      renderCount++;
      return useGameSession();
    });

    act(() => {
      useGameStore.getState().startGame(gameSession);
    });

    const initialRenderCount = renderCount;

    // Update scores (should not trigger re-render since we're only subscribed to activeGame)
    act(() => {
      useGameStore.getState().updateScores({ 'user-1': 100, 'user-2': 50 });
    });

    // Submit answer (should not trigger re-render)
    act(() => {
      useGameStore.getState().submitAnswer('2022');
    });

    expect(renderCount).toBe(initialRenderCount);
    expect(result.current).toEqual(gameSession);
  });
});
