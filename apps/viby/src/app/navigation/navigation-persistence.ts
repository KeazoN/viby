/**
 * Navigation State Persistence
 * 
 * Handles saving and restoring navigation state across app restarts.
 * Only persists state for authenticated users.
 * 
 * Features:
 * - Save state when app enters background
 * - Restore state when app returns to foreground
 * - Version checking to handle state schema changes
 * - Corrupted state handling
 * 
 */

import type { NavigationState } from '@react-navigation/native';
import { storageService } from '@viby/shared/storage';

const NAVIGATION_STATE_KEY = 'navigation_state';
const NAVIGATION_STATE_VERSION = '1.0.0';

interface PersistedNavigationState {
  version: string;
  state: NavigationState;
  timestamp: number;
}

/**
 * Save navigation state to storage
 * 
 * @param state - Current navigation state
 * 
 */
export async function saveNavigationState(state: NavigationState): Promise<void> {
  try {
    const persistedState: PersistedNavigationState = {
      version: NAVIGATION_STATE_VERSION,
      state,
      timestamp: Date.now(),
    };

    storageService.setObject(NAVIGATION_STATE_KEY, persistedState);
  } catch (error) {
    console.error('Failed to save navigation state:', error);
    // Don't throw - navigation state persistence is not critical
  }
}

/**
 * Restore navigation state from storage
 * 
 * Returns null if:
 * - No saved state exists
 * - State version doesn't match (schema changed)
 * - State is corrupted
 * - State is too old (>7 days)
 * 
 * @returns Restored navigation state or null
 * 
 */
export async function restoreNavigationState(): Promise<NavigationState | null> {
  try {
    const persistedState = storageService.getObject<PersistedNavigationState>(
      NAVIGATION_STATE_KEY
    );

    if (!persistedState) {
      return null;
    }

    // Check version compatibility
    if (persistedState.version !== NAVIGATION_STATE_VERSION) {
      console.warn(
        `Navigation state version mismatch: expected ${NAVIGATION_STATE_VERSION}, got ${persistedState.version}`
      );
      await clearNavigationState();
      return null;
    }

    // Check if state is too old (7 days)
    const MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    const age = Date.now() - persistedState.timestamp;
    if (age > MAX_AGE) {
      console.warn('Navigation state is too old, clearing');
      await clearNavigationState();
      return null;
    }

    // Validate state structure
    if (!isValidNavigationState(persistedState.state)) {
      console.warn('Invalid navigation state structure, clearing');
      await clearNavigationState();
      return null;
    }

    return persistedState.state;
  } catch (error) {
    console.error('Failed to restore navigation state:', error);
    // Clear corrupted state
    await clearNavigationState();
    return null;
  }
}

/**
 * Clear saved navigation state
 * 
 * Called when:
 * - User logs out
 * - State is corrupted
 * - State version doesn't match
 * - State is too old
 */
export async function clearNavigationState(): Promise<void> {
  try {
    storageService.delete(NAVIGATION_STATE_KEY);
  } catch (error) {
    console.error('Failed to clear navigation state:', error);
  }
}

/**
 * Validate navigation state structure
 * 
 * Ensures the state has the required properties and structure
 * to prevent crashes from corrupted data.
 * 
 * @param state - State to validate
 * @returns True if state is valid
 */
function isValidNavigationState(state: any): state is NavigationState {
  if (!state || typeof state !== 'object') {
    return false;
  }

  // Check required properties
  if (
    typeof state.index !== 'number' ||
    !Array.isArray(state.routes) ||
    state.routes.length === 0
  ) {
    return false;
  }

  // Check index is within bounds
  if (state.index < 0 || state.index >= state.routes.length) {
    return false;
  }

  // Check each route has required properties
  for (const route of state.routes) {
    if (!route || typeof route !== 'object' || typeof route.name !== 'string') {
      return false;
    }
  }

  return true;
}
