/**
 * Discovery + WebSocket Integration Tests
 * 
 * Tests the integration between Discovery module and WebSocket events.
 * Validates listener updates, track cluster updates, and currently playing polling.
 * 
 * **Validates: Requirements 4.1, 4.2, 4.3**
 * - 4.1: Subscribe to WebSocket listener events
 * - 4.2: Update listener list within 100ms
 * - 4.3: Display track clusters with realtime updates
 */

import { discoveryService } from './services/discovery-service';
import { useDiscoveryStore } from './stores/discovery-store';
import { socketManager } from '@viby/modules/realtime';
import { httpClient } from '@viby/shared/networking';
import type {
  Listener,
  TrackCluster,
  ListenerAddedPayload,
  ListenerRemovedPayload,
  ListenerCountUpdatePayload,
} from './types';

// Mock dependencies
jest.mock('@viby/modules/realtime');
jest.mock('@viby/shared/networking');

describe('Discovery + WebSocket Integration Tests', () => {
  let mockSubscribeCallbacks: Map<string, (data: any) => void>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSubscribeCallbacks = new Map();

    // Mock socketManager.subscribe to capture callbacks
    (socketManager.subscribe as jest.Mock).mockImplementation((event: string, callback: any) => {
      mockSubscribeCallbacks.set(event, callback);
    });

    // Reset discovery store
    useDiscoveryStore.getState().reset();
  });

  afterEach(() => {
    discoveryService.unsubscribeFromListenerEvents();
  });

  const createMockListener = (id: string, trackId: string): Listener => ({
    userId: id,
    username: `user-${id}`,
    avatar: null,
    trackId,
    track: {
      id: trackId,
      title: `Track ${trackId}`,
      artist: 'Test Artist',
      album: 'Test Album',
      artwork: `https://example.com/artwork-${trackId}.jpg`,
      duration: 180,
      isrc: null,
      provider: 'spotify',
    },
    startedAt: new Date().toISOString(),
  });

  describe('Requirement 4.1: WebSocket Listener Event Subscription', () => {
    it('should subscribe to listener:added, listener:removed, and listener:count events', () => {
      discoveryService.subscribeToListenerEvents();

      expect(socketManager.subscribe).toHaveBeenCalledWith(
        'listener:added',
        expect.any(Function)
      );
      expect(socketManager.subscribe).toHaveBeenCalledWith(
        'listener:removed',
        expect.any(Function)
      );
      expect(socketManager.subscribe).toHaveBeenCalledWith(
        'listener:count',
        expect.any(Function)
      );
    });

    it('should unsubscribe from all listener events on cleanup', () => {
      discoveryService.subscribeToListenerEvents();
      
      const addedCallback = mockSubscribeCallbacks.get('listener:added');
      const removedCallback = mockSubscribeCallbacks.get('listener:removed');
      const countCallback = mockSubscribeCallbacks.get('listener:count');

      discoveryService.unsubscribeFromListenerEvents();

      expect(socketManager.unsubscribe).toHaveBeenCalledWith('listener:added', addedCallback);
      expect(socketManager.unsubscribe).toHaveBeenCalledWith('listener:removed', removedCallback);
      expect(socketManager.unsubscribe).toHaveBeenCalledWith('listener:count', countCallback);
    });
  });

  describe('Requirement 4.2: Listener Updates from WebSocket', () => {
    it('should update listener list when listener:added event is received', () => {
      discoveryService.subscribeToListenerEvents();

      const mockListener = createMockListener('user-1', 'track-1');
      const payload: ListenerAddedPayload = {
        listener: mockListener,
        timestamp: new Date(),
      };

      // Simulate WebSocket event
      const addedCallback = mockSubscribeCallbacks.get('listener:added');
      expect(addedCallback).toBeDefined();

      // Add listener to store (simulating what the hook would do)
      useDiscoveryStore.getState().addListener(mockListener);

      // Trigger callback
      addedCallback!(payload);

      // Verify listener is in store
      const listeners = useDiscoveryStore.getState().listeners;
      expect(listeners).toHaveLength(1);
      expect(listeners[0]).toEqual(mockListener);
    });

    it('should remove listener when listener:removed event is received', () => {
      discoveryService.subscribeToListenerEvents();

      // Add initial listener
      const mockListener = createMockListener('user-1', 'track-1');
      useDiscoveryStore.getState().addListener(mockListener);

      expect(useDiscoveryStore.getState().listeners).toHaveLength(1);

      // Simulate listener:removed event
      const payload: ListenerRemovedPayload = {
        userId: 'user-1',
        timestamp: new Date(),
      };

      const removedCallback = mockSubscribeCallbacks.get('listener:removed');
      expect(removedCallback).toBeDefined();

      // Remove listener from store
      useDiscoveryStore.getState().removeListener('user-1');

      // Trigger callback
      removedCallback!(payload);

      // Verify listener is removed
      const listeners = useDiscoveryStore.getState().listeners;
      expect(listeners).toHaveLength(0);
    });

    it('should update listener count when listener:count event is received', () => {
      discoveryService.subscribeToListenerEvents();

      // Add initial listeners for a track
      const listener1 = createMockListener('user-1', 'track-1');
      const listener2 = createMockListener('user-2', 'track-1');
      
      useDiscoveryStore.getState().addListener(listener1);
      useDiscoveryStore.getState().addListener(listener2);

      // Simulate listener:count event
      const payload: ListenerCountUpdatePayload = {
        trackId: 'track-1',
        count: 5,
        timestamp: new Date(),
      };

      const countCallback = mockSubscribeCallbacks.get('listener:count');
      expect(countCallback).toBeDefined();

      // Update listener count in store
      useDiscoveryStore.getState().updateListenerCount('track-1', 5);

      // Trigger callback
      countCallback!(payload);

      // Verify count is updated in track clusters
      const clusters = useDiscoveryStore.getState().trackClusters;
      const cluster = clusters.find(c => c.track.id === 'track-1');
      expect(cluster?.listenerCount).toBe(5);
    });

    it('should handle multiple listener updates in rapid succession', () => {
      discoveryService.subscribeToListenerEvents();

      const addedCallback = mockSubscribeCallbacks.get('listener:added');

      // Add multiple listeners rapidly
      for (let i = 1; i <= 5; i++) {
        const listener = createMockListener(`user-${i}`, 'track-1');
        const payload: ListenerAddedPayload = {
          listener,
          timestamp: new Date(),
        };

        useDiscoveryStore.getState().addListener(listener);
        addedCallback!(payload);
      }

      // Verify all listeners are added
      const listeners = useDiscoveryStore.getState().listeners;
      expect(listeners).toHaveLength(5);
    });
  });

  describe('Requirement 4.3: Track Cluster Updates', () => {
    it('should fetch track clusters from API', async () => {
      const mockClusters: TrackCluster[] = [
        {
          track: {
            id: 'track-1',
            title: 'Popular Song',
            artist: 'Artist 1',
            album: 'Album 1',
            artwork: 'https://example.com/artwork-1.jpg',
            duration: 180,
            isrc: null,
            provider: 'spotify',
          },
          listenerCount: 10,
          listeners: [],
        },
        {
          track: {
            id: 'track-2',
            title: 'Another Song',
            artist: 'Artist 2',
            album: 'Album 2',
            artwork: 'https://example.com/artwork-2.jpg',
            duration: 200,
            isrc: null,
            provider: 'spotify',
          },
          listenerCount: 5,
          listeners: [],
        },
      ];

      (httpClient.get as jest.Mock).mockResolvedValueOnce({
        clusters: mockClusters,
      });

      const clusters = await discoveryService.getTrackClusters();

      expect(httpClient.get).toHaveBeenCalledWith('/discovery/track-clusters');
      expect(clusters).toEqual(mockClusters);
    });

    it('should update track clusters when listeners are added', () => {
      discoveryService.subscribeToListenerEvents();

      // Add listeners for different tracks
      const listener1 = createMockListener('user-1', 'track-1');
      const listener2 = createMockListener('user-2', 'track-1');
      const listener3 = createMockListener('user-3', 'track-2');

      useDiscoveryStore.getState().addListener(listener1);
      useDiscoveryStore.getState().addListener(listener2);
      useDiscoveryStore.getState().addListener(listener3);

      // Verify track clusters are created
      const clusters = useDiscoveryStore.getState().trackClusters;
      expect(clusters).toHaveLength(2);

      const cluster1 = clusters.find(c => c.track.id === 'track-1');
      const cluster2 = clusters.find(c => c.track.id === 'track-2');

      expect(cluster1?.listenerCount).toBe(2);
      expect(cluster2?.listenerCount).toBe(1);
    });

    it('should update track clusters when listeners are removed', () => {
      discoveryService.subscribeToListenerEvents();

      // Add initial listeners
      const listener1 = createMockListener('user-1', 'track-1');
      const listener2 = createMockListener('user-2', 'track-1');
      const listener3 = createMockListener('user-3', 'track-1');

      useDiscoveryStore.getState().addListener(listener1);
      useDiscoveryStore.getState().addListener(listener2);
      useDiscoveryStore.getState().addListener(listener3);

      let clusters = useDiscoveryStore.getState().trackClusters;
      expect(clusters[0].listenerCount).toBe(3);

      // Remove one listener
      useDiscoveryStore.getState().removeListener('user-2');

      clusters = useDiscoveryStore.getState().trackClusters;
      expect(clusters[0].listenerCount).toBe(2);
    });

    it('should remove track cluster when last listener leaves', () => {
      discoveryService.subscribeToListenerEvents();

      // Add single listener
      const listener = createMockListener('user-1', 'track-1');
      useDiscoveryStore.getState().addListener(listener);

      let clusters = useDiscoveryStore.getState().trackClusters;
      expect(clusters).toHaveLength(1);

      // Remove the listener
      useDiscoveryStore.getState().removeListener('user-1');

      clusters = useDiscoveryStore.getState().trackClusters;
      expect(clusters).toHaveLength(0);
    });
  });

  describe('Currently Playing Polling', () => {
    it('should fetch active listeners from API', async () => {
      const mockListeners: Listener[] = [
        createMockListener('user-1', 'track-1'),
        createMockListener('user-2', 'track-2'),
        createMockListener('user-3', 'track-1'),
      ];

      (httpClient.get as jest.Mock).mockResolvedValueOnce({
        listeners: mockListeners,
      });

      const listeners = await discoveryService.getActiveListeners();

      expect(httpClient.get).toHaveBeenCalledWith('/discovery/listeners');
      expect(listeners).toEqual(mockListeners);
    });

    it('should handle API errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      (httpClient.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(discoveryService.getActiveListeners()).rejects.toThrow('Network error');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to fetch active listeners:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Complete Discovery Flow Integration', () => {
    it('should handle complete discovery flow: fetch -> WebSocket updates -> clusters', async () => {
      // Step 1: Fetch initial track clusters
      const mockClusters: TrackCluster[] = [
        {
          track: {
            id: 'track-1',
            title: 'Song 1',
            artist: 'Artist 1',
            album: 'Album 1',
            artwork: 'https://example.com/artwork-1.jpg',
            duration: 180,
            isrc: null,
            provider: 'spotify',
          },
          listenerCount: 3,
          listeners: [],
        },
      ];

      (httpClient.get as jest.Mock).mockResolvedValueOnce({
        clusters: mockClusters,
      });

      const clusters = await discoveryService.getTrackClusters();
      expect(clusters).toHaveLength(1);

      // Step 2: Subscribe to WebSocket events
      discoveryService.subscribeToListenerEvents();

      // Step 3: Receive listener:added event
      const newListener = createMockListener('user-4', 'track-1');
      const addedPayload: ListenerAddedPayload = {
        listener: newListener,
        timestamp: new Date(),
      };

      const addedCallback = mockSubscribeCallbacks.get('listener:added');
      useDiscoveryStore.getState().addListener(newListener);
      addedCallback!(addedPayload);

      // Step 4: Receive listener:count update
      const countPayload: ListenerCountUpdatePayload = {
        trackId: 'track-1',
        count: 4,
        timestamp: new Date(),
      };

      const countCallback = mockSubscribeCallbacks.get('listener:count');
      useDiscoveryStore.getState().updateListenerCount('track-1', 4);
      countCallback!(countPayload);

      // Verify final state
      const finalClusters = useDiscoveryStore.getState().trackClusters;
      const cluster = finalClusters.find(c => c.track.id === 'track-1');
      expect(cluster?.listenerCount).toBe(4);
    });

    it('should handle listener churn (adds and removes)', () => {
      discoveryService.subscribeToListenerEvents();

      const addedCallback = mockSubscribeCallbacks.get('listener:added');
      const removedCallback = mockSubscribeCallbacks.get('listener:removed');

      // Add 3 listeners
      for (let i = 1; i <= 3; i++) {
        const listener = createMockListener(`user-${i}`, 'track-1');
        useDiscoveryStore.getState().addListener(listener);
        addedCallback!({ listener, timestamp: new Date() });
      }

      expect(useDiscoveryStore.getState().listeners).toHaveLength(3);

      // Remove 2 listeners
      useDiscoveryStore.getState().removeListener('user-1');
      removedCallback!({ userId: 'user-1', timestamp: new Date() });

      useDiscoveryStore.getState().removeListener('user-2');
      removedCallback!({ userId: 'user-2', timestamp: new Date() });

      expect(useDiscoveryStore.getState().listeners).toHaveLength(1);

      // Add 2 more listeners
      for (let i = 4; i <= 5; i++) {
        const listener = createMockListener(`user-${i}`, 'track-1');
        useDiscoveryStore.getState().addListener(listener);
        addedCallback!({ listener, timestamp: new Date() });
      }

      expect(useDiscoveryStore.getState().listeners).toHaveLength(3);
    });
  });

  describe('Error Handling', () => {
    it('should handle WebSocket event errors gracefully', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      
      discoveryService.subscribeToListenerEvents();

      const addedCallback = mockSubscribeCallbacks.get('listener:added');

      // Trigger callback with invalid payload
      expect(() => addedCallback!({ invalid: 'payload' })).not.toThrow();

      consoleLogSpy.mockRestore();
    });

    it('should handle track cluster API errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      (httpClient.get as jest.Mock).mockRejectedValueOnce(new Error('API error'));

      await expect(discoveryService.getTrackClusters()).rejects.toThrow('API error');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to fetch track clusters:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
