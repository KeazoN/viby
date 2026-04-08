import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { storageService } from '@viby/shared/storage';
import type { User, AuthTokens } from '../types';
import { authService } from '../services/auth-service';

/**
 * Auth Store State
 * 
 * Manages authentication state on the client side including:
 * - User data
 * - Authentication status
 * - Loading state
 * 
 */
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/**
 * Auth Store Actions
 */
interface AuthActions {
  /**
   * Login action - sets user and authentication state
   * 
   * @param tokens - Auth tokens from OAuth callback
   * @param user - User data from backend
   * 
   */
  login: (tokens: AuthTokens, user: User) => void;

  /**
   * Logout action - clears user and authentication state
   * Tokens are cleared by AuthService
   * 
   */
  logout: () => Promise<void>;

  /**
   * Set user data
   * 
   * @param user - User data to store
   */
  setUser: (user: User) => void;

  /**
   * Set loading state
   * 
   * @param isLoading - Loading state
   */
  setLoading: (isLoading: boolean) => void;
}

type AuthStore = AuthState & AuthActions;

/**
 * Auth Zustand Store
 * 
 * Manages client-side authentication state with:
 * - Devtools integration for debugging
 * - Persistence for isAuthenticated flag (not tokens - those are in SecureStore)
 * - Immer for immutable state updates
 * 
 */
export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      immer((set) => ({
        // Initial state
        user: null,
        isAuthenticated: false,
        isLoading: false,

        // Actions
        login: (tokens: AuthTokens, user: User) =>
          set((state) => {
            state.user = user;
            state.isAuthenticated = true;
            state.isLoading = false;
          }),

        logout: async () => {
          // Call AuthService to clear tokens from SecureStore
          await authService.logout();

          // Clear client state
          set((state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.isLoading = false;
          });
        },

        setUser: (user: User) =>
          set((state) => {
            state.user = user;
          }),

        setLoading: (isLoading: boolean) =>
          set((state) => {
            state.isLoading = isLoading;
          }),
      })),
      {
        name: 'auth-storage',
        // Only persist isAuthenticated flag
        // Tokens are stored separately in SecureStore by AuthService
        partialize: (state) => ({
          isAuthenticated: state.isAuthenticated,
        }),
        // Use MMKV storage via storageService for fast synchronous access
        storage: createJSONStorage(() => ({
          getItem: (name) => {
            const value = storageService.get(name);
            return value ? JSON.parse(value) : null;
          },
          setItem: (name, value) => {
            storageService.set(name, JSON.stringify(value));
          },
          removeItem: (name) => {
            storageService.delete(name);
          },
        })),
      }
    ),
    {
      name: 'AuthStore',
    }
  )
);
