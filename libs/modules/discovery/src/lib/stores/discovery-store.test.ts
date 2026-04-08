import { renderHook, act } from '@testing-library/react-native';
import { useDiscoveryStore } from './discovery-store';
import type { Listener, Track } from '../types';

describe('DiscoveryStore', () => {
  // Reset store before each test
  beforeEach(() => {
    const { result } = renderHook(() => useDiscoveryStore());
    act(() => {
      result.current.clear();
    });
  });

  describe('Initial State', () => {
    it('should have empty listeners array', () => {
      const { result } = renderHook(() => useDiscoveryStore());
      expect(result.current.listeners).toEqual([]);
    });

    it('should have empty trackClusters array', () => {
      const { result } = renderHook(() => useDiscoveryStore());
      expect(result.current.trackClusters).toEqual([]);
    });

    it('should have null currentlyPlaying', () => {
      const { result } = renderHook(() => useDiscoveryStore());
      expect(result.current.currentlyPlaying).toBeNull();
    });
  });

  describe('addListener', () => {
    const mockTrack: Track = {
      id: 'track-1',
      title: 'Test Song',
      artist: 'Test Artist',
      album: 'Test Album',
      artwork: 'https://example.com/artwork.jpg',
      duration: 180000,
      isrc: 'USRC12345678',
      provider: 'spotify',
    };

    const mockListener: Listener = {
      userId: 'user-1',
      username: 'testuser',
      avatar: 'https://example.com/avatar.jpg',
      trackId: 'track-1',
      track: mockTrack,
      startedAt: '2024-01-01T00:00:00Z',
    };

    it('should add a new listener', () => {
      const { result } = renderHook(() => useDiscoveryStore());

      act(() => {
        result.current.addListener(mockListener);
      });

      expect(result.current.listeners).toHaveLength(1);
      expect(result.current.listeners[0]).toEqual(mockListener);
    });

    it('should update existing listener when userId matches', () => {
      const { result } = renderHook(() => useDiscoveryStore());

      const updatedListener: Listener = {
        ...mockListener,
        trackId: 'track-2',
        track: { ...mockTrack, id: 'track-2', title: 'Updated Song' },
      };

      act(() => {
        result.current.addListener(mockListener);
        result.current.addListener(updatedListener);
      });

      expect(result.current.listeners).toHaveLength(1);
      expect(result.current.listeners[0].trackId).toBe('track-2');
      expect(result.current.listeners[0].track.title).toBe('Updated Song');
    });

    it('should create track cluster when listener is added', () => {
      const { result } = renderHook(() => useDiscoveryStore());

      act(() => {
        result.current.addListener(mockListener);
      });

      expect(result.current.trackClusters).toHaveLength(1);
      expect(result.current.trackClusters[0].trackId).toBe('track-1');
      expect(result.current.trackClusters[0].listenerCount).toBe(1);
      expect(result.current.trackClusters[0].listeners).toHaveLength(1);
    });

    it('should group multiple listeners by track', () => {
      const { result } = renderHook(() => useDiscoveryStore());

      const listener2: Listener = {
        ...mockListener,
        userId: 'user-2',
        username: 'testuser2',
      };

      act(() => {
        result.current.addListener(mockListener);
        result.current.addListener(listener2);
      });

      expect(result.current.listeners).toHaveLength(2);
      expect(result.current.trackClusters).toHaveLength(1);
      expect(result.current.trackClusters[0].listenerCount).toBe(2);
      expect(result.current.trackClusters[0].listeners).toHaveLength(2);
    });

    it('should create separate clusters for different tracks', () => {
      const { result } = renderHook(() => useDiscoveryStore());

      const track2: Track = {
        ...mockTrack,
        id: 'track-2',
        title: 'Another Song',
      };

      const listener2: Listener = {
        ...mockListener,
        userId: 'user-2',
        username: 'testuser2',
        trackId: 'track-2',
        track: track2,
      };

      act(() => {
        result.current.addListener(mockListener);
        result.current.addListener(listener2);
      });

      expect(result.current.listeners).toHaveLength(2);
      expect(result.current.trackClusters).toHaveLength(2);
    });

    it('should sort clusters by listener count descending', () => {
      const { result } = renderHook(() => useDiscoveryStore());

      const track2: Track = {
        ...mockTrack,
        id: 'track-2',
        title: 'Popular Song',
      };

      // Add 1 listener to track-1
      act(() => {
        result.current.addListener(mockListener);
      });

      // Add 3 listeners to track-2
      act(() => {
        result.current.addListener({
          ...mockListener,
          userId: 'user-2',
          trackId: 'track-2',
          track: track2,
        });
        result.current.addListener({
          ...mockListener,
          userId: 'user-3',
          trackId: 'track-2',
          track: track2,
        });
        result.current.addListener({
          ...mockListener,
          userId: 'user-4',
          trackId: 'track-2',
          track: track2,
        });
      });

      expect(result.current.trackClusters).toHaveLength(2);
      // track-2 should be first (3 listeners)
      expect(result.current.trackClusters[0].trackId).toBe('track-2');
      expect(result.current.trackClusters[0].listenerCount).toBe(3);
      // track-1 should be second (1 listener)
      expect(result.current.trackClusters[1].trackId).toBe('track-1');
      expect(result.current.trackClusters[1].listenerCount).toBe(1);
    });
  });

  describe('removeListener', () => {
    const mockTrack: Track = {
      id: 'track-1',
      title: 'Test Song',
      artist: 'Test Artist',
      album: 'Test Album',
      artwork: 'https://example.com/artwork.jpg',
      duration: 180000,
      isrc: null,
      provider: 'spotify',
    };

    const mockListener: Listener = {
      userId: 'user-1',
      username: 'testuser',
      avatar: null,
      trackId: 'track-1',
      track: mockTrack,
      startedAt: '2024-01-01T00:00:00Z',
    };

    it('should remove listener by userId', () => {
      const { result } = renderHook(() => useDiscoveryStore());

      act(() => {
        result.current.addListener(mockListener);
        result.current.removeListener('user-1');
      });

      expect(result.current.listeners).toHaveLength(0);
    });

    it('should update track clusters after removing listener', () => {
      const { result } = renderHook(() => useDiscoveryStore());

      act(() => {
        result.current.addListener(mockListener);
        result.current.removeListener('user-1');
      });

      expect(result.current.trackClusters).toHaveLength(0);
    });

    it('should remove cluster when last listener is removed', () => {
      const { result } = renderHook(() => useDiscoveryStore());

      const listener2: Listener = {
        ...mockListener,
        userId: 'user-2',
      };

      act(() => {
        result.current.addListener(mockListener);
        result.current.addListener(listener2);
      });

      expect(result.current.trackClusters[0].listenerCount).toBe(2);

      act(() => {
        result.current.removeListener('user-1');
      });

      expect(result.current.trackClusters[0].listenerCount).toBe(1);

      act(() => {
        result.current.removeListener('user-2');
      });

      expect(result.current.trackClusters).toHaveLength(0);
    });

    it('should do nothing when removing non-existent listener', () => {
      const { result } = renderHook(() => useDiscoveryStore());

      act(() => {
        result.current.addListener(mockListener);
        result.current.removeListener('non-existent-user');
      });

      expect(result.current.listeners).toHaveLength(1);
      expect(result.current.trackClusters).toHaveLength(1);
    });
  });

  describe('updateListenerCount', () => {
    const mockTrack: Track = {
      id: 'track-1',
      title: 'Test Song',
      artist: 'Test Artist',
      album: 'Test Album',
      artwork: null,
      duration: 180000,
      isrc: null,
      provider: 'deezer',
    };

    const mockListener: Listener = {
      userId: 'user-1',
      username: 'testuser',
      avatar: null,
      trackId: 'track-1',
      track: mockTrack,
      startedAt: '2024-01-01T00:00:00Z',
    };

    it('should update listener count for existing track cluster', () => {
      const { result } = renderHook(() => useDiscoveryStore());

      act(() => {
        result.current.addListener(mockListener);
        result.current.updateListenerCount('track-1', 5);
      });

      expect(result.current.trackClusters[0].listenerCount).toBe(5);
    });

    it('should do nothing when updating non-existent track', () => {
      const { result } = renderHook(() => useDiscoveryStore());

      act(() => {
        result.current.addListener(mockListener);
        result.current.updateListenerCount('non-existent-track', 10);
      });

      // Original cluster should be unchanged
      expect(result.current.trackClusters[0].listenerCount).toBe(1);
    });
  });

  describe('setCurrentlyPlaying', () => {
    const mockTrack: Track = {
      id: 'track-1',
      title: 'Currently Playing Song',
      artist: 'Test Artist',
      album: 'Test Album',
      artwork: 'https://example.com/artwork.jpg',
      duration: 200000,
      isrc: 'USRC87654321',
      provider: 'spotify',
    };

    it('should set currently playing track', () => {
      const { result } = renderHook(() => useDiscoveryStore());

      act(() => {
        result.current.setCurrentlyPlaying(mockTrack);
      });

      expect(result.current.currentlyPlaying).toEqual(mockTrack);
    });

    it('should update currently playing track', () => {
      const { result } = renderHook(() => useDiscoveryStore());

      const newTrack: Track = {
        ...mockTrack,
        id: 'track-2',
        title: 'New Song',
      };

      act(() => {
        result.current.setCurrentlyPlaying(mockTrack);
        result.current.setCurrentlyPlaying(newTrack);
      });

      expect(result.current.currentlyPlaying).toEqual(newTrack);
    });

    it('should clear currently playing track when set to null', () => {
      const { result } = renderHook(() => useDiscoveryStore());

      act(() => {
        result.current.setCurrentlyPlaying(mockTrack);
        result.current.setCurrentlyPlaying(null);
      });

      expect(result.current.currentlyPlaying).toBeNull();
    });
  });

  describe('clear', () => {
    const mockTrack: Track = {
      id: 'track-1',
      title: 'Test Song',
      artist: 'Test Artist',
      album: 'Test Album',
      artwork: null,
      duration: 180000,
      isrc: null,
      provider: 'spotify',
    };

    const mockListener: Listener = {
      userId: 'user-1',
      username: 'testuser',
      avatar: null,
      trackId: 'track-1',
      track: mockTrack,
      startedAt: '2024-01-01T00:00:00Z',
    };

    it('should clear all state', () => {
      const { result } = renderHook(() => useDiscoveryStore());

      act(() => {
        result.current.addListener(mockListener);
        result.current.setCurrentlyPlaying(mockTrack);
        result.current.clear();
      });

      expect(result.current.listeners).toEqual([]);
      expect(result.current.trackClusters).toEqual([]);
      expect(result.current.currentlyPlaying).toBeNull();
    });
  });

  describe('Track Clustering Logic', () => {
    it('should handle complex clustering scenario', () => {
      const { result } = renderHook(() => useDiscoveryStore());

      const track1: Track = {
        id: 'track-1',
        title: 'Song A',
        artist: 'Artist A',
        album: 'Album A',
        artwork: null,
        duration: 180000,
        isrc: null,
        provider: 'spotify',
      };

      const track2: Track = {
        id: 'track-2',
        title: 'Song B',
        artist: 'Artist B',
        album: 'Album B',
        artwork: null,
        duration: 200000,
        isrc: null,
        provider: 'deezer',
      };

      // Add 2 listeners to track-1
      act(() => {
        result.current.addListener({
          userId: 'user-1',
          username: 'user1',
          avatar: null,
          trackId: 'track-1',
          track: track1,
          startedAt: '2024-01-01T00:00:00Z',
        });
        result.current.addListener({
          userId: 'user-2',
          username: 'user2',
          avatar: null,
          trackId: 'track-1',
          track: track1,
          startedAt: '2024-01-01T00:01:00Z',
        });
      });

      // Add 3 listeners to track-2
      act(() => {
        result.current.addListener({
          userId: 'user-3',
          username: 'user3',
          avatar: null,
          trackId: 'track-2',
          track: track2,
          startedAt: '2024-01-01T00:02:00Z',
        });
        result.current.addListener({
          userId: 'user-4',
          username: 'user4',
          avatar: null,
          trackId: 'track-2',
          track: track2,
          startedAt: '2024-01-01T00:03:00Z',
        });
        result.current.addListener({
          userId: 'user-5',
          username: 'user5',
          avatar: null,
          trackId: 'track-2',
          track: track2,
          startedAt: '2024-01-01T00:04:00Z',
        });
      });

      // Verify clustering
      expect(result.current.listeners).toHaveLength(5);
      expect(result.current.trackClusters).toHaveLength(2);

      // track-2 should be first (3 listeners)
      expect(result.current.trackClusters[0].trackId).toBe('track-2');
      expect(result.current.trackClusters[0].listenerCount).toBe(3);
      expect(result.current.trackClusters[0].track.title).toBe('Song B');

      // track-1 should be second (2 listeners)
      expect(result.current.trackClusters[1].trackId).toBe('track-1');
      expect(result.current.trackClusters[1].listenerCount).toBe(2);
      expect(result.current.trackClusters[1].track.title).toBe('Song A');

      // Remove one listener from track-2
      act(() => {
        result.current.removeListener('user-3');
      });

      // Both clusters should now have 2 listeners each
      expect(result.current.listeners).toHaveLength(4);
      expect(result.current.trackClusters).toHaveLength(2);
      expect(result.current.trackClusters[0].listenerCount).toBe(2);
      expect(result.current.trackClusters[1].listenerCount).toBe(2);
    });
  });
});
