import { renderHook, act } from '@testing-library/react';
import { useCurrentRound } from './use-current-round';
import { useGameStore } from '../stores/game-store';
import type { Round } from '../types';

describe('useCurrentRound', () => {
  beforeEach(() => {
    // Clear store before each test
    const store = useGameStore.getState();
    store.endGame();
  });

  it('should return null when no round is active', () => {
    const { result } = renderHook(() => useCurrentRound());

    expect(result.current).toBeNull();
  });

  it('should return current round', () => {
    const round: Round = {
      id: 'round-1',
      roundNumber: 1,
      question: 'What year was this song released?',
      options: ['2020', '2021', '2022', '2023'],
      correctAnswer: null,
      timeLimit: 30,
      startedAt: new Date().toISOString(),
    };

    const { result } = renderHook(() => useCurrentRound());

    act(() => {
      useGameStore.getState().updateRound(round);
    });

    expect(result.current).toEqual(round);
  });

  it('should update when round changes', () => {
    const round1: Round = {
      id: 'round-1',
      roundNumber: 1,
      question: 'What year was this song released?',
      options: ['2020', '2021', '2022', '2023'],
      correctAnswer: null,
      timeLimit: 30,
      startedAt: new Date().toISOString(),
    };

    const { result } = renderHook(() => useCurrentRound());

    act(() => {
      useGameStore.getState().updateRound(round1);
    });

    expect(result.current?.id).toBe('round-1');
    expect(result.current?.roundNumber).toBe(1);

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
      useGameStore.getState().updateRound(round2);
    });

    expect(result.current?.id).toBe('round-2');
    expect(result.current?.roundNumber).toBe(2);
  });

  it('should return null after game ends', () => {
    const round: Round = {
      id: 'round-1',
      roundNumber: 1,
      question: 'What year was this song released?',
      options: ['2020', '2021', '2022', '2023'],
      correctAnswer: null,
      timeLimit: 30,
      startedAt: new Date().toISOString(),
    };

    const { result } = renderHook(() => useCurrentRound());

    act(() => {
      useGameStore.getState().updateRound(round);
    });

    expect(result.current).not.toBeNull();

    act(() => {
      useGameStore.getState().endGame();
    });

    expect(result.current).toBeNull();
  });

  it('should not re-render when other game state changes', () => {
    const round: Round = {
      id: 'round-1',
      roundNumber: 1,
      question: 'What year was this song released?',
      options: ['2020', '2021', '2022', '2023'],
      correctAnswer: null,
      timeLimit: 30,
      startedAt: new Date().toISOString(),
    };

    let renderCount = 0;
    const { result } = renderHook(() => {
      renderCount++;
      return useCurrentRound();
    });

    act(() => {
      useGameStore.getState().updateRound(round);
    });

    const initialRenderCount = renderCount;

    // Update scores (should not trigger re-render since we're only subscribed to currentRound)
    act(() => {
      useGameStore.getState().updateScores({ 'user-1': 100, 'user-2': 50 });
    });

    // Submit answer (should not trigger re-render)
    act(() => {
      useGameStore.getState().submitAnswer('2022');
    });

    // Set opponent answered (should not trigger re-render)
    act(() => {
      useGameStore.getState().setOpponentAnswered();
    });

    expect(renderCount).toBe(initialRenderCount);
    expect(result.current).toEqual(round);
  });

  it('should handle round with correct answer revealed', () => {
    const round: Round = {
      id: 'round-1',
      roundNumber: 1,
      question: 'What year was this song released?',
      options: ['2020', '2021', '2022', '2023'],
      correctAnswer: '2022',
      timeLimit: 30,
      startedAt: new Date().toISOString(),
    };

    const { result } = renderHook(() => useCurrentRound());

    act(() => {
      useGameStore.getState().updateRound(round);
    });

    expect(result.current?.correctAnswer).toBe('2022');
  });
});
