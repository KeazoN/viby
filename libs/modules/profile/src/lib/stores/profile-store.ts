import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Profile, Match, MusicStats } from '../types';

/**
 * Profile Store State
 * 
 * Manages profile state on the client side including:
 * - User profile data
 * - Match history
 * - Music statistics
 * 
 */
interface ProfileState {
  profile: Profile | null;
  matchHistory: Match[];
  musicStats: MusicStats | null;
}

/**
 * Profile Store Actions
 */
interface ProfileActions {
  /**
   * Set the user profile
   * 
   * @param profile - Profile data to store
   * 
   */
  setProfile: (profile: Profile) => void;

  /**
   * Update the user profile with partial updates
   * Used for optimistic updates before server confirmation
   * 
   * @param updates - Partial profile updates
   * 
   */
  updateProfile: (updates: Partial<Profile>) => void;

  /**
   * Set the match history
   * 
   * @param matches - Array of match history
   * 
   */
  setMatchHistory: (matches: Match[]) => void;

  /**
   * Set the music statistics
   * 
   * @param stats - Music statistics data
   * 
   */
  setMusicStats: (stats: MusicStats) => void;

  /**
   * Clear all profile state
   * Called on logout
   */
  clear: () => void;
}

type ProfileStore = ProfileState & ProfileActions;

/**
 * Profile Zustand Store
 * 
 * Manages client-side profile state with:
 * - Devtools integration for debugging
 * - Immer for immutable state updates
 * 
 */
export const useProfileStore = create<ProfileStore>()(
  devtools(
    immer((set) => ({
      // Initial state
      profile: null,
      matchHistory: [],
      musicStats: null,

      // Actions
      setProfile: (profile: Profile) =>
        set((state) => {
          state.profile = profile;
        }),

      updateProfile: (updates: Partial<Profile>) =>
        set((state) => {
          if (state.profile) {
            state.profile = {
              ...state.profile,
              ...updates,
            };
          }
        }),

      setMatchHistory: (matches: Match[]) =>
        set((state) => {
          state.matchHistory = matches;
        }),

      setMusicStats: (stats: MusicStats) =>
        set((state) => {
          state.musicStats = stats;
        }),

      clear: () =>
        set((state) => {
          state.profile = null;
          state.matchHistory = [];
          state.musicStats = null;
        }),
    })),
    {
      name: 'ProfileStore',
    }
  )
);
