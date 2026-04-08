/**
 * Navigation State Persistence Tests
 * 
 * Tests for saving, restoring, and clearing navigation state.
 * 
 */

import type { NavigationState } from '@react-navigation/native';
import { storageService } from '@viby/shared/storage';
import {
  saveNavigationState,
  restoreNavigationState,
  clearNavigationState,
} from './navigation-persistence';

// Mock storage service
jest.mock('@viby/shared/storage', () => ({
  storageService: {
    setObject: jest.fn(),
    getObject: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('Navigation State Persistence', () => {
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

  describe('saveNavigationState', () => {
    it('should save navigation state with version and timestamp', async () => {
      await saveNavigationState(mockNavigationState);

      expect(storageService.setObject).toHaveBeenCalledWith(
        'navigation_state',
        expect.objectContaining({
          version: '1.0.0',
          state: mockNavigationState,
          timestamp: expect.any(Number),
        })
      );
    });

    it('should not throw if storage fails', async () => {
      (storageService.setObject as jest.Mock).mockImplementation(() => {
        throw new Error('Storage error');
      });

      await expect(saveNavigationState(mockNavigationState)).resolves.not.toThrow();
      expect(console.error).toHaveBeenCalledWith(
        'Failed to save navigation state:',
        expect.any(Error)
      );
    });
  });

  describe('restoreNavigationState', () => {
    it('should restore valid navigation state', async () => {
      const persistedState = {
        version: '1.0.0',
        state: mockNavigationState,
        timestamp: Date.now(),
      };

      (storageService.getObject as jest.Mock).mockReturnValue(persistedState);

      const result = await restoreNavigationState();

      expect(result).toEqual(mockNavigationState);
    });

    it('should return null if no saved state exists', async () => {
      (storageService.getObject as jest.Mock).mockReturnValue(undefined);

      const result = await restoreNavigationState();

      expect(result).toBeNull();
    });

    it('should return null and clear state if version mismatch', async () => {
      const persistedState = {
        version: '0.9.0', // Old version
        state: mockNavigationState,
        timestamp: Date.now(),
      };

      (storageService.getObject as jest.Mock).mockReturnValue(persistedState);

      const result = await restoreNavigationState();

      expect(result).toBeNull();
      expect(storageService.delete).toHaveBeenCalledWith('navigation_state');
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Navigation state version mismatch')
      );
    });

    it('should return null and clear state if state is too old', async () => {
      const persistedState = {
        version: '1.0.0',
        state: mockNavigationState,
        timestamp: Date.now() - 8 * 24 * 60 * 60 * 1000, // 8 days ago
      };

      (storageService.getObject as jest.Mock).mockReturnValue(persistedState);

      const result = await restoreNavigationState();

      expect(result).toBeNull();
      expect(storageService.delete).toHaveBeenCalledWith('navigation_state');
      expect(console.warn).toHaveBeenCalledWith(
        'Navigation state is too old, clearing'
      );
    });

    it('should return null and clear state if state structure is invalid', async () => {
      const invalidStates = [
        // Missing index
        {
          version: '1.0.0',
          state: { routes: [{ name: 'Main' }] },
          timestamp: Date.now(),
        },
        // Missing routes
        {
          version: '1.0.0',
          state: { index: 0 },
          timestamp: Date.now(),
        },
        // Empty routes
        {
          version: '1.0.0',
          state: { index: 0, routes: [] },
          timestamp: Date.now(),
        },
        // Index out of bounds
        {
          version: '1.0.0',
          state: { index: 5, routes: [{ name: 'Main' }] },
          timestamp: Date.now(),
        },
        // Route missing name
        {
          version: '1.0.0',
          state: { index: 0, routes: [{}] },
          timestamp: Date.now(),
        },
      ];

      for (const invalidState of invalidStates) {
        jest.clearAllMocks();
        (storageService.getObject as jest.Mock).mockReturnValue(invalidState);

        const result = await restoreNavigationState();

        expect(result).toBeNull();
        expect(storageService.delete).toHaveBeenCalledWith('navigation_state');
        expect(console.warn).toHaveBeenCalledWith(
          'Invalid navigation state structure, clearing'
        );
      }
    });

    it('should return null and clear state if restoration throws error', async () => {
      (storageService.getObject as jest.Mock).mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = await restoreNavigationState();

      expect(result).toBeNull();
      expect(storageService.delete).toHaveBeenCalledWith('navigation_state');
      expect(console.error).toHaveBeenCalledWith(
        'Failed to restore navigation state:',
        expect.any(Error)
      );
    });

    it('should accept state that is less than 7 days old', async () => {
      const persistedState = {
        version: '1.0.0',
        state: mockNavigationState,
        timestamp: Date.now() - 6 * 24 * 60 * 60 * 1000, // 6 days ago
      };

      (storageService.getObject as jest.Mock).mockReturnValue(persistedState);

      const result = await restoreNavigationState();

      expect(result).toEqual(mockNavigationState);
      expect(storageService.delete).not.toHaveBeenCalled();
    });
  });

  describe('clearNavigationState', () => {
    it('should delete navigation state from storage', async () => {
      await clearNavigationState();

      expect(storageService.delete).toHaveBeenCalledWith('navigation_state');
    });

    it('should not throw if deletion fails', async () => {
      (storageService.delete as jest.Mock).mockImplementation(() => {
        throw new Error('Storage error');
      });

      await expect(clearNavigationState()).resolves.not.toThrow();
      expect(console.error).toHaveBeenCalledWith(
        'Failed to clear navigation state:',
        expect.any(Error)
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle nested navigation state', async () => {
      const nestedState: NavigationState = {
        index: 0,
        routes: [
          {
            name: 'Main',
            state: {
              index: 1,
              routes: [
                {
                  name: 'Discovery',
                  state: {
                    index: 0,
                    routes: [{ name: 'TrackCluster', key: 'cluster-1' }],
                  },
                  key: 'discovery-1',
                },
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

      const persistedState = {
        version: '1.0.0',
        state: nestedState,
        timestamp: Date.now(),
      };

      (storageService.getObject as jest.Mock).mockReturnValue(persistedState);

      const result = await restoreNavigationState();

      expect(result).toEqual(nestedState);
    });

    it('should handle state with params', async () => {
      const stateWithParams: NavigationState = {
        index: 0,
        routes: [
          {
            name: 'Game',
            params: { roomId: 'room-123' },
            key: 'game-1',
          },
        ],
        key: 'root-1',
        routeNames: ['Main', 'Game'],
        stale: false,
        type: 'stack',
      };

      const persistedState = {
        version: '1.0.0',
        state: stateWithParams,
        timestamp: Date.now(),
      };

      (storageService.getObject as jest.Mock).mockReturnValue(persistedState);

      const result = await restoreNavigationState();

      expect(result).toEqual(stateWithParams);
    });
  });
});
