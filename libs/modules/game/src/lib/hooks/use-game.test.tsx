import { renderHook, act } from '@testing-library/react';
import { useGame } from './use-game';
import { useGameStore } from '../stores/game-store';
import type { GameSession, Round, Track, User } from '../types';

describe('useGame', () => {
  beforeEach(() => {
    // Clear store before each test
    const store = useGameStore.getState();
    store.endGame();
  });

  it('should return game store state and actions', () => {
    const { result } = renderHook(() => useGame());

    expect(result.current).toHaveProperty('activeGame');
    expect(result.current).toHaveProperty('currentRound');
    expect(result.current).toHaveProperty('scores');
    expect(result.current).toHaveProperty('myAnswer');
    expect(result.current).toHaveProperty('opponentAnswered');
    expect(result.current).toHaveProperty('startGame');
    expect(result.current).toHaveProperty('updateRound');
    expect(result.current).toHaveProperty('submitAnswer');
    expect(result.current).toHaveProperty('setOpponentAnswered');
    expect(result.current).toHaveProperty('updateScores');
    expect(result.current).toHaveProperty('endGame');
  });

  it('should have null initial state', () => {
    const { result } = renderHook(() => useGame());

    expect(result.current.activeGame).toBeNull();
    expect(result.current.currentRound).toBeNull();
    expect(result.current.scores).toEqual({});
    expect(result.current.myAnswer).toBeNull();
    expect(result.current.opponentAnswered).toBe(false);
  });

  it('should start a game session', () => {
    const { result } = renderHook(() => useGame());

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

    act(() => {
      result.current.startGame(gameSession);
    });

    expect(result.current.activeGame).toEqual(gameSession);
    expect(result.current.scores).toEqual({ 'user-1': 0, 'user-2': 0 });
    expect(result.current.currentRound).toBeNull();
    expect(result.current.myAnswer).toBeNull();
    expect(result.current.opponentAnswered).toBe(false);
  });

  it('should update current round', () => {
    const { result } = renderHook(() => useGame());

    const round: Round = {
      id: 'round-1',
      roundNumber: 1,
      question: 'What year was this song released?',
      options: ['2020', '2021', '2022', '2023'],
      correctAnswer: null,
      timeLimit: 30,
      startedAt: new Date().toISOString(),
    };

    act(() => {
      result.current.updateRound(round);
    });

    expect(result.current.currentRound).toEqual(round);
    expect(result.current.myAnswer).toBeNull();
    expect(result.current.opponentAnswered).toBe(false);
  });

  it('should submit an answer', () => {
    const { result } = renderHook(() => useGame());

    act(() => {
      result.current.submitAnswer('2022');
    });

    expect(result.current.myAnswer).toBe('2022');
  });

  it('should mark opponent as answered', () => {
    const { result } = renderHook(() => useGame());

    expect(result.current.opponentAnswered).toBe(false);

    act(() => {
      result.current.setOpponentAnswered();
    });

    expect(result.current.opponentAnswered).toBe(true);
  });

  it('should update scores', () => {
    const { result } = renderHook(() => useGame());

    const newScores = { 'user-1': 100, 'user-2': 50 };

    act(() => {
      result.current.updateScores(newScores);
    });

    expect(result.current.scores).toEqual(newScores);
  });

  it('should end game and clear state', () => {
    const { result } = renderHook(() => useGame());

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
      scores: { 'user-1': 100, 'user-2': 50 },
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    act(() => {
      result.current.startGame(gameSession);
      result.current.submitAnswer('2022');
      result.current.setOpponentAnswered();
    });

    expect(result.current.activeGame).not.toBeNull();
    expect(result.current.myAnswer).not.toBeNull();
    expect(result.current.opponentAnswered).toBe(true);

    act(() => {
      result.current.endGame();
    });

    expect(result.current.activeGame).toBeNull();
    expect(result.current.currentRound).toBeNull();
    expect(result.current.scores).toEqual({});
    expect(result.current.myAnswer).toBeNull();
    expect(result.current.opponentAnswered).toBe(false);
  });

  it('should reset answer state when updating round', () => {
    const { result } = renderHook(() => useGame());

    const round1: Round = {
      id: 'round-1',
      roundNumber: 1,
      question: 'What year was this song released?',
      options: ['2020', '2021', '2022', '2023'],
      correctAnswer: null,
      timeLimit: 30,
      startedAt: new Date().toISOString(),
    };

    act(() => {
      result.current.updateRound(round1);
      result.current.submitAnswer('2022');
      result.current.setOpponentAnswered();
    });

    expect(result.current.myAnswer).toBe('2022');
    expect(result.current.opponentAnswered).toBe(true);

    const round2: Round = {
      id: 'round-2',
      roundNumber: 2,
      question: 'Who is the artist?',
      options: ['Artist A', 'Artist B', 'Artist C', 'Artist D'],
      correctAnswer: null,
      timeLimit: 30,
      startedAt: new Date().toISOString(),
    };

    act(() => {
      result.current.updateRound(round2);
    });

    expect(result.current.currentRound).toEqual(round2);
    expect(result.current.myAnswer).toBeNull();
    expect(result.current.opponentAnswered).toBe(false);
  });
});
