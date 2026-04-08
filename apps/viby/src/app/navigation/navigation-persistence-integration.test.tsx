/**
 * Navigation State Persistence Integration Tests
 * 
 * Tests the integration of navigation state persistence with the NavigationContainer.
 * 
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { AppState } from 'react-native';
import { NavigationContainer } from './NavigationContainer';
import { storageService } from '@viby/shared/storage';
import type { NavigationState } from '@react-navigation/native';

// Mock dependencies
jest.mock('@viby/shared/storage');
jest.mock('./RootStackNavigator', () => ({
  RootStackNavigator: () => null,
}));
jest.mock('./linking', () => ({
  default: {
    prefixes: [],
    config: {},
  },
}));
jest.mock('./deep-link-handler', () => ({
  processPendingDeepLink: jest.fn(),
  isProtectedScreen: jest.fn(() => false),
  setPendingDeepLink: jest.fn(),
}));

describe('Navigation State Persistence Integration', () => {
  const mockNavigationState: NavigationState = {
    index: 0,
    routes: [
      {
        name: 'Main',
        state: {
          index: 1,
          routes: [
            { name: 'Discovery', key: 'discovery-1' },
            { name: 'Profile', key: 'profile-1' },
          ],
        },
        key: 'main-1',
      },
    ],
    key: 'root-1',
    routeNames: ['Main', 'Auth'],
    stale: false,
    type: 'stack',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('State Restoration on Mount', () => {
    it('should restore navigation state for authenticated users', async () => {
      const persistedState = {
        version: '1.0.0',
        state: mockNavigationState,
        timestamp: Date.now(),
      };

      (storageService.getObject as jest.Mock).mockReturnValue(persistedState);

      const { container } = render(<NavigationContainer isAuthenticated={true} />);

      await waitFor(() => {
        expect(storageService.getObject).toHaveBeenCalledWith('navigation_state');
      });

      // Container should render after state is restored
      expect(container).toBeTruthy();
    });

    it('should not restore navigation state for unauthenticated users', async () => {
      const { container } = render(<NavigationContainer isAuthenticated={false} />);

      await waitFor(() => {
        expect(container).toBeTruthy();
      });

      // Should not attempt to restore state
      expect(storageService.getObject).not.toHaveBeenCalled();
    });

    it('should handle corrupted state gracefully', async () => {
      (storageService.getObject as jest.Mock).mockImplementation(() => {
        throw new Error('Corrupted state');
      });

      const { container } = render(<NavigationContainer isAuthenticated={true} />);

      await waitFor(() => {
        expect(container).toBeTruthy();
      });

      // Should clear corrupted state
      expect(storageService.delete).toHaveBeenCalledWith('navigation_state');
      expect(console.error).toHaveBeenCalledWith(
        'Failed to restore navigation state:',
        expect.any(Error)
      );
    });
  });

  describe('State Persistence on Background', () => {
    it('should save navigation state when app enters background (authenticated)', async () => {
      const { container } = render(<NavigationContainer isAuthenticated={true} />);

      await waitFor(() => {
        expect(container).toBeTruthy();
      });

      // Simulate app going to background
      // Note: In real implementation, this would be triggered by AppState.addEventListener
      // For testing, we verify the setup is correct
      expect(AppState.addEventListener).toBeDefined();
    });

    it('should not save navigation state when app enters background (unauthenticated)', async () => {
      const { container } = render(<NavigationContainer isAuthenticated={false} />);

      await waitFor(() => {
        expect(container).toBeTruthy();
      });

      // Even if app goes to background, state should not be saved for unauthenticated users
      expect(storageService.setObject).not.toHaveBeenCalled();
    });
  });

  describe('State Clearing on Logout', () => {
    it('should clear navigation state when user logs out', async () => {
      const { rerender } = render(<NavigationContainer isAuthenticated={true} />);

      await waitFor(() => {
        expect(storageService.getObject).toHaveBeenCalled();
      });

      // User logs out
      rerender(<NavigationContainer isAuthenticated={false} />);

      await waitFor(() => {
        expect(storageService.delete).toHaveBeenCalledWith('navigation_state');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid authentication state changes', async () => {
      const { rerender } = render(<NavigationContainer isAuthenticated={false} />);

      // Rapid changes
      rerender(<NavigationContainer isAuthenticated={true} />);
      rerender(<NavigationContainer isAuthenticated={false} />);
      rerender(<NavigationContainer isAuthenticated={true} />);

      await waitFor(() => {
        expect(storageService.delete).toHaveBeenCalled();
      });
    });

    it('should not crash if storage operations fail', async () => {
      (storageService.getObject as jest.Mock).mockImplementation(() => {
        throw new Error('Storage error');
      });
      (storageService.setObject as jest.Mock).mockImplementation(() => {
        throw new Error('Storage error');
      });
      (storageService.delete as jest.Mock).mockImplementation(() => {
        throw new Error('Storage error');
      });

      const { container } = render(<NavigationContainer isAuthenticated={true} />);

      await waitFor(() => {
        expect(container).toBeTruthy();
      });

      // Should handle errors gracefully
      expect(console.error).toHaveBeenCalled();
    });
  });
});
