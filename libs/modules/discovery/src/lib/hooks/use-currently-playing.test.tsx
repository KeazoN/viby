import { renderHook, act } from '@testing-library/react';
import { useCurrentlyPlaying } from './use-currently-playing';
import { useDiscoveryStore } from '../stores/discovery-store';
import type { Track } from '../types';

describe('useCurrentlyPlaying', () => {
  beforeEach(() => {
    // Clear store before each test
    useDiscoveryStore.getState().clear();
  });

  it('should return null initially', () => {
    const { result } = renderHook(() => useCurrentlyPlaying());

    expect(result.current).toBeNull();
  });

  it('should return currently playing track from store', () => {
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

    const { result } = renderHook(() => useCurrentlyPlaying());

    act(() => {
      useDiscoveryStore.getState().setCurrentlyPlaying(track);
    });

    expect(result.current).toEqual(track);
  });

  it('should update when currently playing changes', () => {
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
      provider: 'deezer',
    };

    const { result } = renderHook(() => useCurrentlyPlaying());

    act(() => {
      useDiscoveryStore.getState().setCurrentlyPlaying(track1);
    });

    expect(result.current).toEqual(track1);

    act(() => {
      useDiscoveryStore.getState().setCurrentlyPlaying(track2);
    });

    expect(result.current).toEqual(track2);
  });

  it('should return null when currently playing is cleared', () => {
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

    const { result } = renderHook(() => useCurrentlyPlaying());

    act(() => {
      useDiscoveryStore.getState().setCurrentlyPlaying(track);
    });

    expect(result.current).toEqual(track);

    act(() => {
      useDiscoveryStore.getState().setCurrentlyPlaying(null);
    });

    expect(result.current).toBeNull();
  });

  it('should not re-render when other discovery state changes', () => {
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

    let renderCount = 0;
    const { result } = renderHook(() => {
      renderCount++;
      return useCurrentlyPlaying();
    });

    const initialRenderCount = renderCount;

    // Add a listener (should not trigger re-render for useCurrentlyPlaying)
    act(() => {
      useDiscoveryStore.getState().addListener({
        userId: 'user-1',
        username: 'testuser',
        avatar: null,
        trackId: 'track-1',
        track,
        startedAt: new Date().toISOString(),
      });
    });

    // Render count should not increase
    expect(renderCount).toBe(initialRenderCount);
  });
});
