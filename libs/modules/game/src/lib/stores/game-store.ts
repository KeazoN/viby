import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { GameSession, Round } from '../types';

/**
 * Game Store State
 * 
 * Manages game session state on the client side including:
 * - Active game session
 * - Current round information
 * - Player scores
 * - Answer submissions (optimistic updates)
 * 
 */
interface GameState {
  activeGame: GameSession | null;
  currentRound: Round | null;
  scores: Record<string, number>;
  myAnswer: string | null;
  opponentAnswered: boolean;
}

/**
 * Game Store Actions
 */
interface GameActions {
  /**
   * Start a new game session
   * Initializes game state with session data
   * 
   * @param game - Game session to start
   * 
   */
  startGame: (game: GameSession) => void;

  /**
   * Update the current round
   * Resets answer state for new round
   * 
   * @param round - Round data to update
   * 
   */
  updateRound: (round: Round) => void;

  /**
   * Submit an answer for the current round
   * Implements optimistic update - stores answer locally before server confirmation
   * 
   * @param answer - The selected answer
   * 
   */
  submitAnswer: (answer: string) => void;

  /**
   * Mark that opponent has submitted their answer
   * Used to show visual feedback that opponent answered
   * 
   */
  setOpponentAnswered: () => void;

  /**
   * Update player scores
   * Called when round ends and scores are received from server
   * 
   * @param scores - Updated score map (userId -> score)
   * 
   */
  updateScores: (scores: Record<string, number>) => void;

  /**
   * End the current game session
   * Clears all game state
   * 
   */
  endGame: () => void;
}

type GameStore = GameState & GameActions;

/**
 * Game Zustand Store
 * 
 * Manages client-side game session state with:
 * - Devtools integration for debugging
 * - Immer for immutable state updates
 * - Optimistic answer submission
 * 
 */
export const useGameStore = create<GameStore>()(
  devtools(
    immer((set) => ({
      // Initial state
      activeGame: null,
      currentRound: null,
      scores: {},
      myAnswer: null,
      opponentAnswered: false,

      // Actions
      startGame: (game: GameSession) =>
        set((state) => {
          state.activeGame = game;
          state.scores = game.scores;
          state.currentRound = null;
          state.myAnswer = null;
          state.opponentAnswered = false;
        }),

      updateRound: (round: Round) =>
        set((state) => {
          state.currentRound = round;
          state.myAnswer = null;
          state.opponentAnswered = false;
        }),

      submitAnswer: (answer: string) =>
        set((state) => {
          state.myAnswer = answer;
        }),

      setOpponentAnswered: () =>
        set((state) => {
          state.opponentAnswered = true;
        }),

      updateScores: (scores: Record<string, number>) =>
        set((state) => {
          state.scores = scores;
        }),

      endGame: () =>
        set((state) => {
          state.activeGame = null;
          state.currentRound = null;
          state.scores = {};
          state.myAnswer = null;
          state.opponentAnswered = false;
        }),
    })),
    {
      name: 'GameStore',
    }
  )
);
