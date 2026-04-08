import { renderHook, act } from '@testing-library/react';
import { useGameStore } from './game-store';
import type { GameSession, Round } from '../types';

describe('GameStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useGameStore());
    act(() => {
      result.current.endGame();
    });
  });

  describe('startGame', () => {
    it('should initialize game state with session data', () => {
      const { result } = renderHook(() => useGameStore());

      const mockGame: GameSession = {
        id: 'game-1',
        roomId: 'room-1',
        users: [
          { id: 'user-1', username: 'Alice', avatar: null },
          { id: 'user-2', username: 'Bob', avatar: null },
        ],
        track: {
          id: 'track-1',
          title: 'Test Song',
          artist: 'Test Artist',
          album: 'Test Album',
          artwork: null,
          duration: 180,
          isrc: null,
          provider: 'spotify',
        },
        currentRound: 0,
        totalRounds: 5,
        scores: { 'user-1': 0, 'user-2': 0 },
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      act(() => {
        result.current.startGame(mockGame);
      });

      expect(result.current.activeGame).toEqual(mockGame);
      expect(result.current.scores).toEqual({ 'user-1': 0, 'user-2': 0 });
      expect(result.current.currentRound).toBeNull();
      expect(result.current.myAnswer).toBeNull();
      expect(result.current.opponentAnswered).toBe(false);
    });

    it('should reset answer state when starting new game', () => {
      const { result } = renderHook(() => useGameStore());

      // Set some answer state
      act(() => {
        result.current.submitAnswer('answer-1');
        result.current.setOpponentAnswered();
      });

      const mockGame: GameSession = {
        id: 'game-1',
        roomId: 'room-1',
        users: [],
        track: {
          id: 'track-1',
          title: 'Test Song',
          artist: 'Test Artist',
          album: 'Test Album',
          artwork: null,
          duration: 180,
          isrc: null,
          provider: 'spotify',
        },
        currentRound: 0,
        totalRounds: 5,
        scores: {},
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      act(() => {
        result.current.startGame(mockGame);
      });

      expect(result.current.myAnswer).toBeNull();
      expect(result.current.opponentAnswered).toBe(false);
    });
  });

  describe('updateRound', () => {
    it('should update current round and reset answer state', () => {
      const { result } = renderHook(() => useGameStore());

      const mockRound: Round = {
        id: 'round-1',
        roundNumber: 1,
        question: 'What is the artist of this song?',
        options: ['Artist A', 'Artist B', 'Artist C', 'Artist D'],
        correctAnswer: null,
        timeLimit: 30,
        startedAt: new Date().toISOString(),
      };

      act(() => {
        result.current.updateRound(mockRound);
      });

      expect(result.current.currentRound).toEqual(mockRound);
      expect(result.current.myAnswer).toBeNull();
      expect(result.current.opponentAnswered).toBe(false);
    });

    it('should reset previous answer when new round starts', () => {
      const { result } = renderHook(() => useGameStore());

      // Submit answer for first round
      act(() => {
        result.current.submitAnswer('answer-1');
        result.current.setOpponentAnswered();
      });

      const mockRound: Round = {
        id: 'round-2',
        roundNumber: 2,
        question: 'What is the album of this song?',
        options: ['Album A', 'Album B', 'Album C', 'Album D'],
        correctAnswer: null,
        timeLimit: 30,
        startedAt: new Date().toISOString(),
      };

      act(() => {
        result.current.updateRound(mockRound);
      });

      expect(result.current.myAnswer).toBeNull();
      expect(result.current.opponentAnswered).toBe(false);
    });
  });

  describe('submitAnswer - optimistic update', () => {
    it('should store answer locally before server confirmation', () => {
      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.submitAnswer('Artist B');
      });

      expect(result.current.myAnswer).toBe('Artist B');
    });

    it('should allow updating answer before round ends', () => {
      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.submitAnswer('Artist A');
      });

      expect(result.current.myAnswer).toBe('Artist A');

      act(() => {
        result.current.submitAnswer('Artist B');
      });

      expect(result.current.myAnswer).toBe('Artist B');
    });
  });

  describe('setOpponentAnswered', () => {
    it('should mark opponent as having answered', () => {
      const { result } = renderHook(() => useGameStore());

      expect(result.current.opponentAnswered).toBe(false);

      act(() => {
        result.current.setOpponentAnswered();
      });

      expect(result.current.opponentAnswered).toBe(true);
    });
  });

  describe('updateScores', () => {
    it('should update player scores', () => {
      const { result } = renderHook(() => useGameStore());

      const newScores = { 'user-1': 100, 'user-2': 50 };

      act(() => {
        result.current.updateScores(newScores);
      });

      expect(result.current.scores).toEqual(newScores);
    });

    it('should replace previous scores completely', () => {
      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.updateScores({ 'user-1': 50, 'user-2': 30 });
      });

      const newScores = { 'user-1': 100, 'user-2': 80 };

      act(() => {
        result.current.updateScores(newScores);
      });

      expect(result.current.scores).toEqual(newScores);
    });
  });

  describe('endGame', () => {
    it('should clear all game state', () => {
      const { result } = renderHook(() => useGameStore());

      // Set up game state
      const mockGame: GameSession = {
        id: 'game-1',
        roomId: 'room-1',
        users: [],
        track: {
          id: 'track-1',
          title: 'Test Song',
          artist: 'Test Artist',
          album: 'Test Album',
          artwork: null,
          duration: 180,
          isrc: null,
          provider: 'spotify',
        },
        currentRound: 2,
        totalRounds: 5,
        scores: { 'user-1': 100, 'user-2': 80 },
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      const mockRound: Round = {
        id: 'round-2',
        roundNumber: 2,
        question: 'Test question?',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: null,
        timeLimit: 30,
        startedAt: new Date().toISOString(),
      };

      act(() => {
        result.current.startGame(mockGame);
        result.current.updateRound(mockRound);
        result.current.submitAnswer('A');
        result.current.setOpponentAnswered();
      });

      // End game
      act(() => {
        result.current.endGame();
      });

      expect(result.current.activeGame).toBeNull();
      expect(result.current.currentRound).toBeNull();
      expect(result.current.scores).toEqual({});
      expect(result.current.myAnswer).toBeNull();
      expect(result.current.opponentAnswered).toBe(false);
    });
  });

  describe('game flow integration', () => {
    it('should handle complete game flow', () => {
      const { result } = renderHook(() => useGameStore());

      // Start game
      const mockGame: GameSession = {
        id: 'game-1',
        roomId: 'room-1',
        users: [
          { id: 'user-1', username: 'Alice', avatar: null },
          { id: 'user-2', username: 'Bob', avatar: null },
        ],
        track: {
          id: 'track-1',
          title: 'Test Song',
          artist: 'Test Artist',
          album: 'Test Album',
          artwork: null,
          duration: 180,
          isrc: null,
          provider: 'spotify',
        },
        currentRound: 0,
        totalRounds: 3,
        scores: { 'user-1': 0, 'user-2': 0 },
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      act(() => {
        result.current.startGame(mockGame);
      });

      // Round 1
      const round1: Round = {
        id: 'round-1',
        roundNumber: 1,
        question: 'Question 1?',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: null,
        timeLimit: 30,
        startedAt: new Date().toISOString(),
      };

      act(() => {
        result.current.updateRound(round1);
        result.current.submitAnswer('A');
        result.current.setOpponentAnswered();
        result.current.updateScores({ 'user-1': 100, 'user-2': 0 });
      });

      expect(result.current.currentRound).toEqual(round1);
      expect(result.current.myAnswer).toBe('A');
      expect(result.current.scores).toEqual({ 'user-1': 100, 'user-2': 0 });

      // Round 2
      const round2: Round = {
        id: 'round-2',
        roundNumber: 2,
        question: 'Question 2?',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: null,
        timeLimit: 30,
        startedAt: new Date().toISOString(),
      };

      act(() => {
        result.current.updateRound(round2);
      });

      expect(result.current.myAnswer).toBeNull();
      expect(result.current.opponentAnswered).toBe(false);

      act(() => {
        result.current.submitAnswer('B');
        result.current.updateScores({ 'user-1': 100, 'user-2': 100 });
      });

      // End game
      act(() => {
        result.current.endGame();
      });

      expect(result.current.activeGame).toBeNull();
      expect(result.current.currentRound).toBeNull();
    });
  });
});
