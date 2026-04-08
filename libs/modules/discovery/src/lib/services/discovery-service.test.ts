import { DiscoveryService } from './discovery-service';
import { httpClient } from '@viby/shared/networking';
import { socketManager } from '@viby/modules/realtime';
import type { Listener, TrackCluster } from '../types';

// Mock dependencies
jest.mock('@viby/shared/networking');
jest.mock('@viby/modules/realtime');

describe('DiscoveryService', () => {
  let discoveryService: DiscoveryService;

  beforeEach(() => {
    discoveryService = new DiscoveryService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up subscriptions
    discoveryService.unsubscribeFromListenerEvents();
  });

  describe('subscribeToListenerEvents', () => {
    it('should subscribe to listener:added event', () => {
      discoveryService.subscribeToListenerEvents();

      expect(socketManager.subscribe).toHaveBeenCalledWith(
        'listener:added',
        expect.any(Function)
      );
    });

    it('should subscribe to listener:removed event', () => {
      discoveryService.subscribeToListenerEvents();

      expect(socketManager.subscribe).toHaveBeenCalledWith(
        'listener:removed',
        expect.any(Function)
      );
    });

    it('should subscribe to listener:count event', () => {
      discoveryService.subscribeToListenerEvents();

      expect(socketManager.subscribe).toHaveBeenCalledWith(
        'listener:count',
        expect.any(Function)
      );
    });

    it('should handle listener:added event', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      discoveryService.subscribeToListenerEvents();

      // Get the handler that was registered
      const subscribeCalls = (socketManager.subscribe as jest.Mock).mock.calls;
      const listenerAddedCall = subscribeCalls.find(
        (call) => call[0] === 'listener:added'
      );
      const handler = listenerAddedCall?.[1];

      const mockListener: Listener = {
        userId: '1',
        username: 'testuser',
        avatar: null,
        trackId: 'track-1',
        track: {
          id: 'track-1',
          title: 'Test Track',
          artist: 'Test Artist',
          album: 'Test Album',
          artwork: null,
          duration: 180,
          isrc: null,
          provider: 'spotify',
        },
        startedAt: new Date().toISOString(),
      };

      handler({ listener: mockListener, timestamp: new Date() });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Listener added:',
        mockListener
      );

      consoleSpy.mockRestore();
    });

    it('should handle listener:removed event', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      discoveryService.subscribeToListenerEvents();

      const subscribeCalls = (socketManager.subscribe as jest.Mock).mock.calls;
      const listenerRemovedCall = subscribeCalls.find(
        (call) => call[0] === 'listener:removed'
      );
      const handler = listenerRemovedCall?.[1];

      handler({ userId: '1', timestamp: new Date() });

      expect(consoleSpy).toHaveBeenCalledWith('Listener removed:', '1');

      consoleSpy.mockRestore();
    });

    it('should handle listener:count event', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      discoveryService.subscribeToListenerEvents();

      const subscribeCalls = (socketManager.subscribe as jest.Mock).mock.calls;
      const listenerCountCall = subscribeCalls.find(
        (call) => call[0] === 'listener:count'
      );
      const handler = listenerCountCall?.[1];

      handler({ trackId: 'track-1', count: 5, timestamp: new Date() });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Listener count updated:',
        'track-1',
        5
      );

      consoleSpy.mockRestore();
    });
  });

  describe('unsubscribeFromListenerEvents', () => {
    it('should unsubscribe from all listener events', () => {
      discoveryService.subscribeToListenerEvents();
      discoveryService.unsubscribeFromListenerEvents();

      expect(socketManager.unsubscribe).toHaveBeenCalledTimes(3);
      expect(socketManager.unsubscribe).toHaveBeenCalledWith(
        'listener:added',
        expect.any(Function)
      );
      expect(socketManager.unsubscribe).toHaveBeenCalledWith(
        'listener:removed',
        expect.any(Function)
      );
      expect(socketManager.unsubscribe).toHaveBeenCalledWith(
        'listener:count',
        expect.any(Function)
      );
    });

    it('should clear event handlers map', () => {
      discoveryService.subscribeToListenerEvents();
      discoveryService.unsubscribeFromListenerEvents();

      // Subscribe again should create new handlers
      discoveryService.subscribeToListenerEvents();
      expect(socketManager.subscribe).toHaveBeenCalledTimes(6); // 3 initial + 3 new
    });
  });

  describe('getActiveListeners', () => {
    it('should fetch active listeners from API', async () => {
      const mockListeners: Listener[] = [
        {
          userId: '1',
          username: 'user1',
          avatar: null,
          trackId: 'track-1',
          track: {
            id: 'track-1',
            title: 'Track 1',
            artist: 'Artist 1',
            album: 'Album 1',
            artwork: null,
            duration: 180,
            isrc: null,
            provider: 'spotify',
          },
          startedAt: new Date().toISOString(),
        },
        {
          userId: '2',
          username: 'user2',
          avatar: null,
          trackId: 'track-2',
          track: {
            id: 'track-2',
            title: 'Track 2',
            artist: 'Artist 2',
            album: 'Album 2',
            artwork: null,
            duration: 200,
            isrc: null,
            provider: 'spotify',
          },
          startedAt: new Date().toISOString(),
        },
      ];

      (httpClient.get as jest.Mock).mockResolvedValue({
        listeners: mockListeners,
      });

      const result = await discoveryService.getActiveListeners();

      expect(httpClient.get).toHaveBeenCalledWith('/discovery/listeners');
      expect(result).toEqual(mockListeners);
    });

    it('should throw error when API call fails', async () => {
      const mockError = new Error('Network error');
      (httpClient.get as jest.Mock).mockRejectedValue(mockError);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(discoveryService.getActiveListeners()).rejects.toThrow(
        'Network error'
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to fetch active listeners:',
        mockError
      );

      consoleSpy.mockRestore();
    });
  });

  describe('getTrackClusters', () => {
    it('should fetch track clusters from API', async () => {
      const mockClusters: TrackCluster[] = [
        {
          trackId: 'track-1',
          track: {
            id: 'track-1',
            title: 'Track 1',
            artist: 'Artist 1',
            album: 'Album 1',
            artwork: null,
            duration: 180,
            isrc: null,
            provider: 'spotify',
          },
          listenerCount: 3,
          listeners: [],
        },
        {
          trackId: 'track-2',
          track: {
            id: 'track-2',
            title: 'Track 2',
            artist: 'Artist 2',
            album: 'Album 2',
            artwork: null,
            duration: 200,
            isrc: null,
            provider: 'spotify',
          },
          listenerCount: 2,
          listeners: [],
        },
      ];

      (httpClient.get as jest.Mock).mockResolvedValue({
        clusters: mockClusters,
      });

      const result = await discoveryService.getTrackClusters();

      expect(httpClient.get).toHaveBeenCalledWith('/discovery/track-clusters');
      expect(result).toEqual(mockClusters);
    });

    it('should throw error when API call fails', async () => {
      const mockError = new Error('Network error');
      (httpClient.get as jest.Mock).mockRejectedValue(mockError);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(discoveryService.getTrackClusters()).rejects.toThrow(
        'Network error'
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to fetch track clusters:',
        mockError
      );

      consoleSpy.mockRestore();
    });
  });
});
