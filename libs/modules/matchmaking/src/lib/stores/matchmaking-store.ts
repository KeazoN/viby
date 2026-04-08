import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Match, MatchStatus } from '../types';

/**
 * Matchmaking Store State
 * 
 * Manages matchmaking state on the client side including:
 * - Active match (current pending or accepted match)
 * - Match status tracking
 * - 30-second timeout logic
 * 
 */
interface MatchmakingState {
  activeMatch: Match | null;
  matchStatus: MatchStatus | null;
  timeoutId: NodeJS.Timeout | null;
}

/**
 * Matchmaking Store Actions
 */
interface MatchmakingActions {
  /**
   * Set the active match
   * Starts the 30-second timeout timer
   * 
   * @param match - Match to set as active
   * 
   */
  setActiveMatch: (match: Match) => void;

  /**
   * Update the status of the active match
   * 
   * @param status - New match status
   * 
   */
  updateMatchStatus: (status: MatchStatus) => void;

  /**
   * Clear the active match and cancel timeout
   * Called when match is accepted, declined, or expired
   * 
   */
  clearActiveMatch: () => void;

  /**
   * Handle match expiration after 30 seconds
   * Automatically declines the match and clears state
   * 
   * @param onExpire - Callback to execute when match expires (e.g., call API)
   * 
   */
  startMatchTimeout: (onExpire: () => void) => void;

  /**
   * Cancel the match timeout
   * Called when user accepts or declines before timeout
   * 
   */
  cancelMatchTimeout: () => void;
}

type MatchmakingStore = MatchmakingState & MatchmakingActions;

/**
 * Matchmaking Zustand Store
 * 
 * Manages client-side matchmaking state with:
 * - Devtools integration for debugging
 * - Immer for immutable state updates
 * - Automatic 30-second timeout for pending matches
 * 
 */
export const useMatchmakingStore = create<MatchmakingStore>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      activeMatch: null,
      matchStatus: null,
      timeoutId: null,

      // Actions
      setActiveMatch: (match: Match) =>
        set((state) => {
          state.activeMatch = match;
          state.matchStatus = match.status;
        }),

      updateMatchStatus: (status: MatchStatus) =>
        set((state) => {
          state.matchStatus = status;
          if (state.activeMatch) {
            state.activeMatch.status = status;
          }
        }),

      clearActiveMatch: () =>
        set((state) => {
          // Cancel any existing timeout
          if (state.timeoutId) {
            clearTimeout(state.timeoutId);
            state.timeoutId = null;
          }

          state.activeMatch = null;
          state.matchStatus = null;
        }),

      startMatchTimeout: (onExpire: () => void) =>
        set((state) => {
          // Cancel any existing timeout
          if (state.timeoutId) {
            clearTimeout(state.timeoutId);
          }

          // Start new 30-second timeout
          const timeoutId = setTimeout(() => {
            // Execute expiration callback (e.g., call decline API)
            onExpire();

            // Update state to expired
            set((state) => {
              state.matchStatus = 'expired';
              if (state.activeMatch) {
                state.activeMatch.status = 'expired';
              }
              state.timeoutId = null;
            });
          }, 30000); // 30 seconds

          state.timeoutId = timeoutId;
        }),

      cancelMatchTimeout: () =>
        set((state) => {
          if (state.timeoutId) {
            clearTimeout(state.timeoutId);
            state.timeoutId = null;
          }
        }),
    })),
    {
      name: 'MatchmakingStore',
    }
  )
);
