import { renderHook, act } from '@testing-library/react';
import { useTrackClusters } from './use-track-clusters';
import { useDiscoveryStore } from '../stores/discovery-store';
import type { Listener, Track } from '../types';

describe('useTrackClusters', () => {
  beforeEach(() => {
    // Clear store before each test
    useDiscoveryStore.getState().clear();
  });

  it('should return empty array initially', () => {
    const { result } = renderHook(() => useTrackClusters());

    expect(result.current).toEqual([]);
  });

  it('should return track clusters from store', () => {
    const track: Track = {
      id: 'track-1',
      title: 'Test Song',
      artist: 'Test Artist',
      album: 'Test Album',
      artwork: 'https://example.com/artwork.jpg',
      duration: 180,
      isrc: null,
      provider: 'spotify',
    };

    const listener: Listener = {
      userId: 'user-1',
      username: 'testuser',
      avatar: null,
      trackId: 'track-1',
      track,
      startedAt: new Date().toISOString(),
    };

    const { result } = renderHook(() => useTrackClusters());

    act(() => {
      useDiscoveryStore.getState().addListener(listener);
    });

    expect(result.current).toHaveLength(1);
    expect(result.current[0].trackId).toBe('track-1');
    expect(result.current[0].listenerCount).toBe(1);
    expect(result.current[0].listeners).toHaveLength(1);
  });

  it('should update when listeners are added', () => {
    const track: Track = {
      id: 'track-1',
      title: 'Test Song',
      artist: 'Test Artist',
      album: 'Test Album',
      artwork: 'https://example.com/artwork.jpg',
      duration: 180,
      isrc: null,
      provider: 'spotify',
    };

    const listener1: Listener = {
      userId: 'user-1',
      username: 'testuser1',
      avatar: null,
      trackId: 'track-1',
      track,
      startedAt: new Date().toISOString(),
    };

    const listener2: Listener = {
      userId: 'user-2',
      username: 'testuser2',
      avatar: null,
      trackId: 'track-1',
      track,
      startedAt: new Date().toISOString(),
    };

    const { result } = renderHook(() => useTrackClusters());

    act(() => {
      useDiscoveryStore.getState().addListener(listener1);
    });

    expect(result.current[0].listenerCount).toBe(1);

    act(() => {
      useDiscoveryStore.getState().addListener(listener2);
    });

    expect(result.current[0].listenerCount).toBe(2);
    expect(result.current[0].listeners).toHaveLength(2);
  });

  it('should group listeners by track', () => {
    const track1: Track = {
      id: 'track-1',
      title: 'Test Song 1',
      artist: 'Test Artist',
      album: 'Test Album',
      artwork: 'https://example.com/artwork1.jpg',
      duration: 180,
      isrc: null,
      provider: 'spotify',
    };

    const track2: Track = {
      id: 'track-2',
      title: 'Test Song 2',
      artist: 'Test Artist',
      album: 'Test Album',
      artwork: 'https://example.com/artwork2.jpg',
      duration: 200,
      isrc: null,
      provider: 'spotify',
    };

    const listener1: Listener = {
      userId: 'user-1',
      username: 'testuser1',
      avatar: null,
      trackId: 'track-1',
      track: track1,
      startedAt: new Date().toISOString(),
    };

    const listener2: Listener = {
      userId: 'user-2',
      username: 'testuser2',
      avatar: null,
      trackId: 'track-2',
      track: track2,
      startedAt: new Date().toISOString(),
    };

    const { result } = renderHook(() => useTrackClusters());

    act(() => {
      useDiscoveryStore.getState().addListener(listener1);
      useDiscoveryStore.getState().addListener(listener2);
    });

    expect(result.current).toHaveLength(2);
    expect(result.current.find((c) => c.trackId === 'track-1')).toBeDefined();
    expect(result.current.find((c) => c.trackId === 'track-2')).toBeDefined();
  });

  it('should sort clusters by listener count descending', () => {
    const track1: Track = {
      id: 'track-1',
      title: 'Test Song 1',
      artist: 'Test Artist',
      album: 'Test Album',
      artwork: 'https://example.com/artwork1.jpg',
      duration: 180,
      isrc: null,
      provider: 'spotify',
    };

    const track2: Track = {
      id: 'track-2',
      title: 'Test Song 2',
      artist: 'Test Artist',
      album: 'Test Album',
      artwork: 'https://example.com/artwork2.jpg',
      duration: 200,
      isrc: null,
      provider: 'spotify',
    };

    const listener1: Listener = {
      userId: 'user-1',
      username: 'testuser1',
      avatar: null,
      trackId: 'track-1',
      track: track1,
      startedAt: new Date().toISOString(),
    };

    const listener2: Listener = {
      userId: 'user-2',
      username: 'testuser2',
      avatar: null,
      trackId: 'track-2',
      track: track2,
      startedAt: new Date().toISOString(),
    };

    const listener3: Listener = {
      userId: 'user-3',
      username: 'testuser3',
      avatar: null,
      trackId: 'track-2',
      track: track2,
      startedAt: new Date().toISOString(),
    };

    const { result } = renderHook(() => useTrackClusters());

    act(() => {
      useDiscoveryStore.getState().addListener(listener1);
      useDiscoveryStore.getState().addListener(listener2);
      useDiscoveryStore.getState().addListener(listener3);
    });

    // track-2 should be first (2 listeners) before track-1 (1 listener)
    expect(result.current[0].trackId).toBe('track-2');
    expect(result.current[0].listenerCount).toBe(2);
    expect(result.current[1].trackId).toBe('track-1');
    expect(result.current[1].listenerCount).toBe(1);
  });
});
