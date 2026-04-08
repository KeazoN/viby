import { renderHook, act } from '@testing-library/react';
import { useDiscovery } from './use-discovery';
import { useDiscoveryStore } from '../stores/discovery-store';
import type { Listener, Track } from '../types';

describe('useDiscovery', () => {
  beforeEach(() => {
    // Clear store before each test
    useDiscoveryStore.getState().clear();
  });

  it('should return discovery store state and actions', () => {
    const { result } = renderHook(() => useDiscovery());

    expect(result.current).toHaveProperty('listeners');
    expect(result.current).toHaveProperty('trackClusters');
    expect(result.current).toHaveProperty('currentlyPlaying');
    expect(result.current).toHaveProperty('addListener');
    expect(result.current).toHaveProperty('removeListener');
    expect(result.current).toHaveProperty('updateListenerCount');
    expect(result.current).toHaveProperty('setCurrentlyPlaying');
  });

  it('should have empty initial state', () => {
    const { result } = renderHook(() => useDiscovery());

    expect(result.current.listeners).toEqual([]);
    expect(result.current.trackClusters).toEqual([]);
    expect(result.current.currentlyPlaying).toBeNull();
  });

  it('should add listener and update track clusters', () => {
    const { result } = renderHook(() => useDiscovery());

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

    act(() => {
      result.current.addListener(listener);
    });

    expect(result.current.listeners).toHaveLength(1);
    expect(result.current.listeners[0]).toEqual(listener);
    expect(result.current.trackClusters).toHaveLength(1);
    expect(result.current.trackClusters[0].trackId).toBe('track-1');
    expect(result.current.trackClusters[0].listenerCount).toBe(1);
  });

  it('should remove listener and update track clusters', () => {
    const { result } = renderHook(() => useDiscovery());

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

    act(() => {
      result.current.addListener(listener);
    });

    expect(result.current.listeners).toHaveLength(1);

    act(() => {
      result.current.removeListener('user-1');
    });

    expect(result.current.listeners).toHaveLength(0);
    expect(result.current.trackClusters).toHaveLength(0);
  });

  it('should set currently playing track', () => {
    const { result } = renderHook(() => useDiscovery());

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

    act(() => {
      result.current.setCurrentlyPlaying(track);
    });

    expect(result.current.currentlyPlaying).toEqual(track);
  });

  it('should update listener count for track cluster', () => {
    const { result } = renderHook(() => useDiscovery());

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

    act(() => {
      result.current.addListener(listener);
    });

    expect(result.current.trackClusters[0].listenerCount).toBe(1);

    act(() => {
      result.current.updateListenerCount('track-1', 5);
    });

    expect(result.current.trackClusters[0].listenerCount).toBe(5);
  });

  it('should clear all state', () => {
    const { result } = renderHook(() => useDiscovery());

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

    act(() => {
      result.current.addListener(listener);
      result.current.setCurrentlyPlaying(track);
    });

    expect(result.current.listeners).toHaveLength(1);
    expect(result.current.currentlyPlaying).not.toBeNull();

    act(() => {
      result.current.clear();
    });

    expect(result.current.listeners).toHaveLength(0);
    expect(result.current.trackClusters).toHaveLength(0);
    expect(result.current.currentlyPlaying).toBeNull();
  });
});
