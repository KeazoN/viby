/**
 * Navigation Property-Based Tests
 * 
 * Property-based tests for navigation authentication and state persistence.
 * Uses fast-check to verify properties hold across many generated inputs.
 * 
 */

import * as fc from 'fast-check';
import type { NavigationState } from '@react-navigation/native';
import {
  isProtectedScreen,
  setPendingDeepLink,
  getPendingDeepLink,
  clearPendingDeepLink,
} from './deep-link-handler';
import {
  saveNavigationState,
  restoreNavigationState,
  clearNavigationState,
} from './navigation-persistence';
import { storageService } from '@viby/shared/storage';
import type { RootStackParamList } from './types';

// Mock dependencies
jest.mock('@viby/shared/storage');

// Define global __DEV__
(global as any).__DEV__ = false;

// Mock MMKV storage
const mockStorage = new Map<string, any>();

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    set: jest.fn((key: string, value: any) => {
      mockStorage.set(key, value);
    }),
    getString: jest.fn((key: string) => {
      const value = mockStorage.get(key);
      return typeof value === 'string' ? value : undefined;
    }),
    delete: jest.fn((key: string) => {
      mockStorage.delete(key);
    }),
    contains: jest.fn((key: string) => {
      return mockStorage.has(key);
    }),
  })),
}));

describe('Navigation - Property-Based Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.clear();
    clearPendingDeepLink();
  });

  /**
   * Property 25: Deep Link Authentication Check
   * 
   * For any deep link opened while unauthenticated, the Navigation_Service should 
   * redirect to the authentication flow before navigating to the target screen.
   */
  describe('Property 25: Deep Link Authentication Check', () => {
    // Generator for protected screen names
    const protectedScreenArb = fc.constantFrom('Match', 'Game', 'Chat', 'Main');

    // Generator for screen parameters
    const screenParamsArb = fc.record({
      matchId: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
      roomId: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
    });

    it('should identify all protected screens correctly', () => {
      fc.assert(
        fc.property(protectedScreenArb, (screenName) => {
          // Act: Check if screen is protected
          const result = isProtectedScreen(screenName);

          // Assert: All generated screens should be protected
          expect(result).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should store pending deep link for any protected screen', () => {
      fc.assert(
        fc.property(
          protectedScreenArb,
          screenParamsArb,
          (screenName, params) => {
            // Act: Store pending deep link
            setPendingDeepLink(screenName as keyof RootStackParamList, params);

            // Retrieve pending deep link
            const pending = getPendingDeepLink();

            // Assert: Pending link should match what was stored
            expect(pending).not.toBeNull();
            expect(pending?.screen).toBe(screenName);
            expect(pending?.params).toEqual(params);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should clear pending deep link after retrieval', () => {
      fc.assert(
        fc.property(
          protectedScreenArb,
          screenParamsArb,
          (screenName, params) => {
            // Arrange: Store pending deep link
            setPendingDeepLink(screenName as keyof RootStackParamList, params);

            // Act: Retrieve pending deep link (should clear it)
            const firstRetrieval = getPendingDeepLink();
            const secondRetrieval = getPendingDeepLink();

            // Assert: First retrieval should have data, second should be null
            expect(firstRetrieval).not.toBeNull();
            expect(secondRetrieval).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should overwrite previous pending deep link with new one', () => {
      fc.assert(
        fc.property(
          protectedScreenArb,
          screenParamsArb,
          protectedScreenArb,
          screenParamsArb,
          (screen1, params1, screen2, params2) => {
            // Arrange: Store first pending deep link
            setPendingDeepLink(screen1 as keyof RootStackParamList, params1);

            // Act: Store second pending deep link (should overwrite)
            setPendingDeepLink(screen2 as keyof RootStackParamList, params2);

            // Retrieve pending deep link
            const pending = getPendingDeepLink();

            // Assert: Should only have the second deep link
            expect(pending).not.toBeNull();
            expect(pending?.screen).toBe(screen2);
            expect(pending?.params).toEqual(params2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle deep links with no parameters', () => {
      fc.assert(
        fc.property(protectedScreenArb, (screenName) => {
          // Act: Store pending deep link without params
          setPendingDeepLink(screenName as keyof RootStackParamList);

          // Retrieve pending deep link
          const pending = getPendingDeepLink();

          // Assert: Should store screen with undefined params
          expect(pending).not.toBeNull();
          expect(pending?.screen).toBe(screenName);
          expect(pending?.params).toBeUndefined();
        }),
        { numRuns: 100 }
      );
    });

    it('should handle explicit clearing of pending deep link', () => {
      fc.assert(
        fc.property(
          protectedScreenArb,
          screenParamsArb,
          (screenName, params) => {
            // Arrange: Store pending deep link
            setPendingDeepLink(screenName as keyof RootStackParamList, params);

            // Act: Explicitly clear pending deep link
            clearPendingDeepLink();

            // Retrieve pending deep link
            const pending = getPendingDeepLink();

            // Assert: Should be null after clearing
            expect(pending).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve deep link data integrity across multiple operations', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              screen: protectedScreenArb,
              params: screenParamsArb,
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (deepLinks) => {
            // Act: Store multiple deep links sequentially
            deepLinks.forEach(({ screen, params }) => {
              setPendingDeepLink(screen as keyof RootStackParamList, params);
            });

            // Retrieve the final pending deep link
            const pending = getPendingDeepLink();

            // Assert: Should have the last deep link stored
            const lastDeepLink = deepLinks[deepLinks.length - 1];
            expect(pending).not.toBeNull();
            expect(pending?.screen).toBe(lastDeepLink.screen);
            expect(pending?.params).toEqual(lastDeepLink.params);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 26: Navigation State Persistence
   * 
   * For any authenticated user, the navigation state should be saved when the app 
   * enters background and restored when returning to foreground.
   */
  describe('Property 26: Navigation State Persistence', () => {
    // Generator for valid navigation routes
    const routeArb = fc.record({
      name: fc.constantFrom('Discovery', 'Profile', 'Settings', 'Match', 'Game', 'Chat'),
      key: fc.string({ minLength: 5, maxLength: 20 }),
      params: fc.option(
        fc.record({
          userId: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
          matchId: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
          roomId: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
        }),
        { nil: undefined }
      ),
    });

    // Generator for valid navigation state
    const navigationStateArb = fc
      .array(routeArb, { minLength: 1, maxLength: 5 })
      .chain((routes) =>
        fc.record({
          index: fc.integer({ min: 0, max: routes.length - 1 }),
          routes: fc.constant(routes),
          type: fc.constant('stack'),
          key: fc.string({ minLength: 5, maxLength: 20 }),
        })
      );

    it('should save and restore navigation state correctly', async () => {
      await fc.assert(
        fc.asyncProperty(navigationStateArb, async (state) => {
          // Setup: Mock storage service
          let savedState: any = null;
          (storageService.setObject as jest.Mock).mockImplementation((key, value) => {
            savedState = value;
            mockStorage.set(key, JSON.stringify(value));
          });
          (storageService.getObject as jest.Mock).mockImplementation((key) => {
            return savedState;
          });

          // Act: Save navigation state
          await saveNavigationState(state as NavigationState);

          // Assert: State should be saved
          expect(storageService.setObject).toHaveBeenCalledWith(
            'navigation_state',
            expect.objectContaining({
              version: '1.0.0',
              state,
              timestamp: expect.any(Number),
            })
          );

          // Act: Restore navigation state
          const restoredState = await restoreNavigationState();

          // Assert: Restored state should match original
          expect(restoredState).toEqual(state);
        }),
        { numRuns: 50 }
      );
    });

    it('should include version and timestamp when saving state', async () => {
      await fc.assert(
        fc.asyncProperty(navigationStateArb, async (state) => {
          // Setup: Mock storage service
          let savedData: any = null;
          (storageService.setObject as jest.Mock).mockImplementation((key, value) => {
            savedData = value;
          });

          // Act: Save navigation state
          const beforeTimestamp = Date.now();
          await saveNavigationState(state as NavigationState);
          const afterTimestamp = Date.now();

          // Assert: Saved data should have version and timestamp
          expect(savedData).toMatchObject({
            version: '1.0.0',
            state,
          });
          expect(savedData.timestamp).toBeGreaterThanOrEqual(beforeTimestamp);
          expect(savedData.timestamp).toBeLessThanOrEqual(afterTimestamp);
        }),
        { numRuns: 50 }
      );
    });

    it('should return null for corrupted state', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.constant(null),
            fc.constant(undefined),
            fc.constant('invalid'),
            fc.constant(123),
            fc.constant(true),
            fc.record({
              version: fc.string(),
              // Missing state or invalid structure
              timestamp: fc.integer(),
            })
          ),
          async (corruptedData) => {
            // Setup: Mock storage to return corrupted data
            (storageService.getObject as jest.Mock).mockReturnValue(corruptedData);
            (storageService.delete as jest.Mock).mockResolvedValue(undefined);

            // Act: Try to restore navigation state
            const restoredState = await restoreNavigationState();

            // Assert: Should return null for corrupted data
            expect(restoredState).toBeNull();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should reject state with version mismatch', async () => {
      await fc.assert(
        fc.asyncProperty(
          navigationStateArb,
          fc.string({ minLength: 1, maxLength: 20 }).filter((v) => v !== '1.0.0'),
          async (state, wrongVersion) => {
            // Setup: Mock storage with wrong version
            (storageService.getObject as jest.Mock).mockReturnValue({
              version: wrongVersion,
              state,
              timestamp: Date.now(),
            });
            (storageService.delete as jest.Mock).mockResolvedValue(undefined);

            // Act: Try to restore navigation state
            const restoredState = await restoreNavigationState();

            // Assert: Should return null and clear state
            expect(restoredState).toBeNull();
            expect(storageService.delete).toHaveBeenCalledWith('navigation_state');
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should reject state older than 7 days', async () => {
      await fc.assert(
        fc.asyncProperty(navigationStateArb, async (state) => {
          // Setup: Mock storage with old timestamp (8 days ago)
          const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
          (storageService.getObject as jest.Mock).mockReturnValue({
            version: '1.0.0',
            state,
            timestamp: eightDaysAgo,
          });
          (storageService.delete as jest.Mock).mockResolvedValue(undefined);

          // Act: Try to restore navigation state
          const restoredState = await restoreNavigationState();

          // Assert: Should return null and clear state
          expect(restoredState).toBeNull();
          expect(storageService.delete).toHaveBeenCalledWith('navigation_state');
        }),
        { numRuns: 50 }
      );
    });

    it('should accept state within 7 days', async () => {
      await fc.assert(
        fc.asyncProperty(
          navigationStateArb,
          fc.integer({ min: 0, max: 6 * 24 * 60 * 60 * 1000 }), // 0 to 6 days in ms
          async (state, ageMs) => {
            // Setup: Mock storage with recent timestamp
            const timestamp = Date.now() - ageMs;
            (storageService.getObject as jest.Mock).mockReturnValue({
              version: '1.0.0',
              state,
              timestamp,
            });

            // Act: Try to restore navigation state
            const restoredState = await restoreNavigationState();

            // Assert: Should restore state successfully
            expect(restoredState).toEqual(state);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should validate navigation state structure', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            // Invalid state structures
            index: fc.option(fc.oneof(fc.constant(-1), fc.constant(999)), { nil: undefined }),
            routes: fc.option(
              fc.oneof(
                fc.constant([]), // Empty routes
                fc.constant(null),
                fc.constant(undefined)
              ),
              { nil: undefined }
            ),
          }),
          async (invalidState) => {
            // Setup: Mock storage with invalid state structure
            (storageService.getObject as jest.Mock).mockReturnValue({
              version: '1.0.0',
              state: invalidState,
              timestamp: Date.now(),
            });
            (storageService.delete as jest.Mock).mockResolvedValue(undefined);

            // Act: Try to restore navigation state
            const restoredState = await restoreNavigationState();

            // Assert: Should return null for invalid structure
            expect(restoredState).toBeNull();
            expect(storageService.delete).toHaveBeenCalledWith('navigation_state');
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle save errors gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(navigationStateArb, async (state) => {
          // Setup: Mock storage to throw error
          (storageService.setObject as jest.Mock).mockImplementation(() => {
            throw new Error('Storage error');
          });

          // Act: Try to save navigation state (should not throw)
          await expect(saveNavigationState(state as NavigationState)).resolves.not.toThrow();
        }),
        { numRuns: 30 }
      );
    });

    it('should handle restore errors gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(fc.constant(null), async () => {
          // Setup: Mock storage to throw error
          (storageService.getObject as jest.Mock).mockImplementation(() => {
            throw new Error('Storage error');
          });
          (storageService.delete as jest.Mock).mockResolvedValue(undefined);

          // Act: Try to restore navigation state
          const restoredState = await restoreNavigationState();

          // Assert: Should return null and clear corrupted state
          expect(restoredState).toBeNull();
          expect(storageService.delete).toHaveBeenCalledWith('navigation_state');
        }),
        { numRuns: 30 }
      );
    });

    it('should clear navigation state successfully', async () => {
      await fc.assert(
        fc.asyncProperty(fc.constant(null), async () => {
          // Setup: Mock storage delete
          (storageService.delete as jest.Mock).mockResolvedValue(undefined);

          // Act: Clear navigation state
          await clearNavigationState();

          // Assert: Storage delete should be called
          expect(storageService.delete).toHaveBeenCalledWith('navigation_state');
        }),
        { numRuns: 30 }
      );
    });

    it('should handle clear errors gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(fc.constant(null), async () => {
          // Setup: Mock storage to throw error
          (storageService.delete as jest.Mock).mockImplementation(() => {
            throw new Error('Storage error');
          });

          // Act: Try to clear navigation state (should not throw)
          await expect(clearNavigationState()).resolves.not.toThrow();
        }),
        { numRuns: 30 }
      );
    });

    it('should maintain state integrity across save-restore cycles', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(navigationStateArb, { minLength: 1, maxLength: 5 }),
          async (states) => {
            // Setup: Mock storage
            let savedState: any = null;
            (storageService.setObject as jest.Mock).mockImplementation((key, value) => {
              savedState = value;
            });
            (storageService.getObject as jest.Mock).mockImplementation(() => savedState);

            // Act: Save and restore multiple states sequentially
            for (const state of states) {
              await saveNavigationState(state as NavigationState);
              const restored = await restoreNavigationState();

              // Assert: Each restored state should match what was saved
              expect(restored).toEqual(state);
            }
          }
        ),
        { numRuns: 30 }
      );
    });
  });
});
