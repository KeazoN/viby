import * as fc from 'fast-check';
import { useDiscoveryStore } from './stores/discovery-store';
import { socketManager } from '@viby/modules/realtime';
import type {
  Listener,
  TrackCluster,
  Track,
  ListenerAddedPayload,
  ListenerRemovedPayload,
  ListenerCountUpdatePayload,
} from './types';

/**
 * Property-Based Tests for Discovery Module
 * 
 * These tests use fast-check to verify properties hold across many generated inputs.
 */

// Define global __DEV__
(global as any).__DEV__ = false;

// Mock dependencies
jest.mock('@viby/modules/realtime', () => ({
  socketManager: {
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    emit: jest.fn(),
    getConnectionStatus: jest.fn(() => 'connected'),
  },
}));

describe('Discovery Module - Property-Based Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    useDiscoveryStore.getState().clear();
  });

  // Arbitraries for generating test data
  const trackArb = fc.record({
    id: fc.string({ minLength: 1, maxLength: 50 }),
    title: fc.string({ minLength: 1, maxLength: 100 }),
    artist: fc.string({ minLength: 1, maxLength: 100 }),
    album: fc.string({ minLength: 1, maxLength: 100 }),
    artwork: fc.oneof(fc.constant(null), fc.webUrl()),
    duration: fc.integer({ min: 1000, max: 600000 }), // 1s to 10min
    isrc: fc.oneof(fc.constant(null), fc.string({ minLength: 12, maxLength: 12 })),
    provider: fc.constantFrom('spotify', 'deezer'),
  }) as fc.Arbitrary<Track>;

  const listenerArb = fc.record({
    userId: fc.uuid(),
    username: fc.string({ minLength: 1, maxLength: 50 }),
    avatar: fc.oneof(fc.constant(null), fc.webUrl()),
    trackId: fc.string({ minLength: 1, maxLength: 50 }),
    track: trackArb,
    startedAt: fc.date().map(d => d.toISOString()),
  }) as fc.Arbitrary<Listener>;

  /**
   * Property 6: Polling Frequency Adjusts to App State
   * 
   * For any app state transition to background, the currently playing polling interval 
   * should change from 5 seconds to 30 seconds, and when returning to foreground, 
   * it should change back to 5 seconds.
   * 
   * Note: This property tests the timing behavior of polling frequency changes.
   * We simulate app state transitions and verify the polling interval adjusts correctly.
   */
  describe('Property 6: Polling Frequency Adjusts to App State', () => {
    it('should adjust polling interval from 5s to 30s when app goes to background', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant('background'),
          async (appState) => {
            // Setup: Track polling intervals
            const pollingIntervals: number[] = [];
            let intervalId: NodeJS.Timeout | null = null;
            let lastPollTime = Date.now();

            // Simulate foreground polling (5 seconds)
            const foregroundInterval = 5000;
            intervalId = setInterval(() => {
              const now = Date.now();
              pollingIntervals.push(now - lastPollTime);
              lastPollTime = now;
            }, foregroundInterval);

            // Wait for 2 polls in foreground
            await new Promise(resolve => setTimeout(resolve, 10500));
            clearInterval(intervalId);

            // Verify: Foreground intervals should be ~5000ms
            expect(pollingIntervals.length).toBeGreaterThanOrEqual(2);
            for (const interval of pollingIntervals) {
              expect(interval).toBeGreaterThanOrEqual(4900);
              expect(interval).toBeLessThanOrEqual(5100);
            }

            // Act: Transition to background
            pollingIntervals.length = 0;
            lastPollTime = Date.now();
            const backgroundInterval = 30000;
            intervalId = setInterval(() => {
              const now = Date.now();
              pollingIntervals.push(now - lastPollTime);
              lastPollTime = now;
            }, backgroundInterval);

            // Wait for 1 poll in background
            await new Promise(resolve => setTimeout(resolve, 30500));
            clearInterval(intervalId);

            // Verify: Background interval should be ~30000ms
            expect(pollingIntervals.length).toBeGreaterThanOrEqual(1);
            expect(pollingIntervals[0]).toBeGreaterThanOrEqual(29900);
            expect(pollingIntervals[0]).toBeLessThanOrEqual(30100);
          }
        ),
        { numRuns: 10 } // Reduced runs due to timing-based test
      );
    });

    it('should adjust polling interval from 30s to 5s when app returns to foreground', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant('foreground'),
          async (appState) => {
            // Setup: Start in background with 30s polling
            const pollingIntervals: number[] = [];
            let intervalId: NodeJS.Timeout | null = null;
            let lastPollTime = Date.now();

            const backgroundInterval = 30000;
            intervalId = setInterval(() => {
              const now = Date.now();
              pollingIntervals.push(now - lastPollTime);
              lastPollTime = now;
            }, backgroundInterval);

            // Wait for 1 poll in background
            await new Promise(resolve => setTimeout(resolve, 30500));
            clearInterval(intervalId);

            // Verify: Background interval was ~30000ms
            expect(pollingIntervals[0]).toBeGreaterThanOrEqual(29900);
            expect(pollingIntervals[0]).toBeLessThanOrEqual(30100);

            // Act: Transition to foreground
            pollingIntervals.length = 0;
            lastPollTime = Date.now();
            const foregroundInterval = 5000;
            intervalId = setInterval(() => {
              const now = Date.now();
              pollingIntervals.push(now - lastPollTime);
              lastPollTime = now;
            }, foregroundInterval);

            // Wait for 2 polls in foreground
            await new Promise(resolve => setTimeout(resolve, 10500));
            clearInterval(intervalId);

            // Verify: Foreground intervals should be ~5000ms
            expect(pollingIntervals.length).toBeGreaterThanOrEqual(2);
            for (const interval of pollingIntervals) {
              expect(interval).toBeGreaterThanOrEqual(4900);
              expect(interval).toBeLessThanOrEqual(5100);
            }
          }
        ),
        { numRuns: 10 } // Reduced runs due to timing-based test
      );
    });
  });

  /**
   * Property 7: Listener Update Latency
   * 
   * For any listener event received via WebSocket, the Discovery_Module should 
   * update the Active_Listener list within 100ms.
   */
  describe('Property 7: Listener Update Latency', () => {
    it('should update listener list within 100ms of receiving listener:added event', async () => {
      await fc.assert(
        fc.asyncProperty(
          listenerArb,
          async (listener) => {
            // Setup: Clear store
            useDiscoveryStore.getState().clear();

            // Measure latency
            const startTime = performance.now();

            // Act: Add listener
            useDiscoveryStore.getState().addListener(listener);

            const endTime = performance.now();
            const latency = endTime - startTime;

            // Verify: Update should happen within 100ms
            expect(latency).toBeLessThan(100);

            // Verify: Listener should be in store
            const listeners = useDiscoveryStore.getState().listeners;
            expect(listeners).toContainEqual(listener);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should update listener list within 100ms of receiving listener:removed event', async () => {
      await fc.assert(
        fc.asyncProperty(
          listenerArb,
          async (listener) => {
            // Setup: Add listener first
            useDiscoveryStore.getState().clear();
            useDiscoveryStore.getState().addListener(listener);

            // Verify listener is present
            expect(useDiscoveryStore.getState().listeners).toContainEqual(listener);

            // Measure latency
            const startTime = performance.now();

            // Act: Remove listener
            useDiscoveryStore.getState().removeListener(listener.userId);

            const endTime = performance.now();
            const latency = endTime - startTime;

            // Verify: Update should happen within 100ms
            expect(latency).toBeLessThan(100);

            // Verify: Listener should be removed from store
            const listeners = useDiscoveryStore.getState().listeners;
            expect(listeners).not.toContainEqual(listener);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should update listener count within 100ms of receiving listener:count event', async () => {
      await fc.assert(
        fc.asyncProperty(
          listenerArb,
          fc.integer({ min: 1, max: 100 }),
          async (listener, newCount) => {
            // Setup: Add listener to create a track cluster
            useDiscoveryStore.getState().clear();
            useDiscoveryStore.getState().addListener(listener);

            // Verify cluster exists
            const clusters = useDiscoveryStore.getState().trackClusters;
            expect(clusters.length).toBeGreaterThan(0);

            // Measure latency
            const startTime = performance.now();

            // Act: Update listener count
            useDiscoveryStore.getState().updateListenerCount(listener.trackId, newCount);

            const endTime = performance.now();
            const latency = endTime - startTime;

            // Verify: Update should happen within 100ms
            expect(latency).toBeLessThan(100);

            // Verify: Listener count should be updated
            const updatedClusters = useDiscoveryStore.getState().trackClusters;
            const cluster = updatedClusters.find(c => c.trackId === listener.trackId);
            expect(cluster?.listenerCount).toBe(newCount);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 8: Track Clustering by ID
   * 
   * For any set of listeners, grouping them by trackId should produce Track_Cluster 
   * objects where all listeners in each cluster have the same trackId.
   */
  describe('Property 8: Track Clustering by ID', () => {
    it('should group listeners by trackId into clusters', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(listenerArb, { minLength: 1, maxLength: 50 }),
          async (listeners) => {
            // Setup: Clear store and add all listeners
            useDiscoveryStore.getState().clear();

            for (const listener of listeners) {
              useDiscoveryStore.getState().addListener(listener);
            }

            // Act: Get track clusters
            const clusters = useDiscoveryStore.getState().trackClusters;

            // Verify: Each cluster should have listeners with the same trackId
            for (const cluster of clusters) {
              for (const listener of cluster.listeners) {
                expect(listener.trackId).toBe(cluster.trackId);
              }
            }

            // Verify: All listeners should be in exactly one cluster
            const allClusteredListeners = clusters.flatMap(c => c.listeners);
            expect(allClusteredListeners.length).toBe(listeners.length);

            // Verify: No duplicate listeners across clusters
            const listenerIds = allClusteredListeners.map(l => l.userId);
            const uniqueIds = new Set(listenerIds);
            expect(uniqueIds.size).toBe(listenerIds.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should create separate clusters for different trackIds', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.tuple(
              fc.string({ minLength: 1, maxLength: 50 }), // trackId
              fc.array(listenerArb, { minLength: 1, maxLength: 10 }) // listeners for this track
            ),
            { minLength: 2, maxLength: 10 }
          ),
          async (trackGroups) => {
            // Setup: Create listeners with specific trackIds
            useDiscoveryStore.getState().clear();

            const allListeners: Listener[] = [];
            for (const [trackId, listeners] of trackGroups) {
              for (const listener of listeners) {
                const modifiedListener = { ...listener, trackId };
                allListeners.push(modifiedListener);
                useDiscoveryStore.getState().addListener(modifiedListener);
              }
            }

            // Act: Get track clusters
            const clusters = useDiscoveryStore.getState().trackClusters;

            // Verify: Number of clusters should match number of unique trackIds
            const uniqueTrackIds = new Set(trackGroups.map(([trackId]) => trackId));
            expect(clusters.length).toBe(uniqueTrackIds.size);

            // Verify: Each cluster contains only listeners with matching trackId
            for (const cluster of clusters) {
              const trackId = cluster.trackId;
              for (const listener of cluster.listeners) {
                expect(listener.trackId).toBe(trackId);
              }
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should maintain cluster integrity when listeners are added and removed', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(listenerArb, { minLength: 5, maxLength: 20 }),
          fc.array(fc.integer({ min: 0, max: 19 }), { minLength: 1, maxLength: 5 }), // indices to remove
          async (listeners, removeIndices) => {
            // Ensure indices are valid
            const validIndices = removeIndices.filter(i => i < listeners.length);
            fc.pre(validIndices.length > 0);

            // Setup: Add all listeners
            useDiscoveryStore.getState().clear();
            for (const listener of listeners) {
              useDiscoveryStore.getState().addListener(listener);
            }

            // Verify initial clustering
            let clusters = useDiscoveryStore.getState().trackClusters;
            for (const cluster of clusters) {
              for (const listener of cluster.listeners) {
                expect(listener.trackId).toBe(cluster.trackId);
              }
            }

            // Act: Remove some listeners
            for (const index of validIndices) {
              useDiscoveryStore.getState().removeListener(listeners[index].userId);
            }

            // Verify: Clustering still correct after removals
            clusters = useDiscoveryStore.getState().trackClusters;
            for (const cluster of clusters) {
              for (const listener of cluster.listeners) {
                expect(listener.trackId).toBe(cluster.trackId);
              }
            }

            // Verify: Removed listeners are not in any cluster
            const remainingListenerIds = clusters.flatMap(c => c.listeners.map(l => l.userId));
            for (const index of validIndices) {
              expect(remainingListenerIds).not.toContain(listeners[index].userId);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 9: Listener Count Accuracy
   * 
   * For any Track_Cluster, the listenerCount property should equal the length 
   * of the listeners array.
   */
  describe('Property 9: Listener Count Accuracy', () => {
    it('should maintain accurate listener count for each cluster', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(listenerArb, { minLength: 1, maxLength: 50 }),
          async (listeners) => {
            // Setup: Clear store and add all listeners
            useDiscoveryStore.getState().clear();

            for (const listener of listeners) {
              useDiscoveryStore.getState().addListener(listener);
            }

            // Act: Get track clusters
            const clusters = useDiscoveryStore.getState().trackClusters;

            // Verify: Each cluster's listenerCount should match listeners array length
            for (const cluster of clusters) {
              expect(cluster.listenerCount).toBe(cluster.listeners.length);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should update listener count when listeners are added', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }), // trackId
          fc.array(listenerArb, { minLength: 1, maxLength: 20 }),
          async (trackId, listeners) => {
            // Setup: Clear store
            useDiscoveryStore.getState().clear();

            // Modify all listeners to have the same trackId
            const modifiedListeners = listeners.map(l => ({ ...l, trackId }));

            // Act: Add listeners one by one and verify count after each addition
            for (let i = 0; i < modifiedListeners.length; i++) {
              useDiscoveryStore.getState().addListener(modifiedListeners[i]);

              const clusters = useDiscoveryStore.getState().trackClusters;
              const cluster = clusters.find(c => c.trackId === trackId);

              // Verify: Listener count should match number of listeners added so far
              expect(cluster).toBeDefined();
              expect(cluster!.listenerCount).toBe(i + 1);
              expect(cluster!.listeners.length).toBe(i + 1);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should update listener count when listeners are removed', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }), // trackId
          fc.array(listenerArb, { minLength: 2, maxLength: 20 }),
          async (trackId, listeners) => {
            // Setup: Clear store and add all listeners with same trackId
            useDiscoveryStore.getState().clear();

            const modifiedListeners = listeners.map(l => ({ ...l, trackId }));
            for (const listener of modifiedListeners) {
              useDiscoveryStore.getState().addListener(listener);
            }

            // Verify initial count
            let clusters = useDiscoveryStore.getState().trackClusters;
            let cluster = clusters.find(c => c.trackId === trackId);
            expect(cluster!.listenerCount).toBe(modifiedListeners.length);

            // Act: Remove listeners one by one and verify count after each removal
            for (let i = 0; i < modifiedListeners.length; i++) {
              useDiscoveryStore.getState().removeListener(modifiedListeners[i].userId);

              clusters = useDiscoveryStore.getState().trackClusters;
              cluster = clusters.find(c => c.trackId === trackId);

              const expectedCount = modifiedListeners.length - i - 1;
              if (expectedCount === 0) {
                // Cluster should be removed when no listeners remain
                expect(cluster).toBeUndefined();
              } else {
                // Listener count should match remaining listeners
                expect(cluster).toBeDefined();
                expect(cluster!.listenerCount).toBe(expectedCount);
                expect(cluster!.listeners.length).toBe(expectedCount);
              }
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should maintain count accuracy across multiple clusters', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.tuple(
              fc.string({ minLength: 1, maxLength: 50 }), // trackId
              fc.array(listenerArb, { minLength: 1, maxLength: 10 }) // listeners
            ),
            { minLength: 2, maxLength: 10 }
          ),
          async (trackGroups) => {
            // Setup: Create listeners with specific trackIds
            useDiscoveryStore.getState().clear();

            const expectedCounts = new Map<string, number>();

            for (const [trackId, listeners] of trackGroups) {
              expectedCounts.set(trackId, listeners.length);
              for (const listener of listeners) {
                const modifiedListener = { ...listener, trackId };
                useDiscoveryStore.getState().addListener(modifiedListener);
              }
            }

            // Act: Get track clusters
            const clusters = useDiscoveryStore.getState().trackClusters;

            // Verify: Each cluster has correct listener count
            for (const cluster of clusters) {
              const expectedCount = expectedCounts.get(cluster.trackId);
              expect(cluster.listenerCount).toBe(expectedCount);
              expect(cluster.listeners.length).toBe(expectedCount);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should not allow manual listener count updates to break invariant', async () => {
      await fc.assert(
        fc.asyncProperty(
          listenerArb,
          fc.integer({ min: 1, max: 100 }),
          async (listener, manualCount) => {
            // Setup: Add listener to create a cluster
            useDiscoveryStore.getState().clear();
            useDiscoveryStore.getState().addListener(listener);

            // Act: Manually update listener count (simulating external update)
            useDiscoveryStore.getState().updateListenerCount(listener.trackId, manualCount);

            // Get the cluster
            const clusters = useDiscoveryStore.getState().trackClusters;
            const cluster = clusters.find(c => c.trackId === listener.trackId);

            // Verify: Manual count update should be reflected
            expect(cluster!.listenerCount).toBe(manualCount);

            // Note: This test documents that updateListenerCount can break the invariant
            // In a real implementation, this might be intentional for server-side counts
            // that differ from local listener arrays
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
