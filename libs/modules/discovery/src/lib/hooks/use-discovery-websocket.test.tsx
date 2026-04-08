import { renderHook, act, waitFor } from '@testing-library/react';
import { useDiscoveryWebSocket } from './use-discovery-websocket';
import { useDiscoveryStore } from '../stores/discovery-store';
import { socketManager } from '@viby/modules/realtime';
import type {
  Listener,
  Track,
  ListenerAddedPayload,
  ListenerRemovedPayload,
  ListenerCountUpdatePayload,
} from '../types';

// Mock socketManager
jest.mock('@viby/modules/realtime', () => ({
  socketManager: {
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
  },
}));

describe('useDiscoveryWebSocket', () => {
  let mockSubscribe: jest.Mock;
  let mockUnsubscribe: jest.Mock;

  beforeEach(() => {
    // Clear store before each test
    useDiscoveryStore.getState().clear();

    // Reset mocks
    mockSubscribe = socketManager.subscribe as jest.Mock;
    mockUnsubscribe = socketManager.unsubscribe as jest.Mock;
    mockSubscribe.mockClear();
    mockUnsubscribe.mockClear();
  });

  it('should subscribe to WebSocket events on mount', () => {
    renderHook(() => useDiscoveryWebSocket());

    expect(mockSubscribe).toHaveBeenCalledTimes(3);
    expect(mockSubscribe).toHaveBeenCalledWith(
      'listener:added',
      expect.any(Function)
    );
    expect(mockSubscribe).toHaveBeenCalledWith(
      'listener:removed',
      expect.any(Function)
    );
    expect(mockSubscribe).toHaveBeenCalledWith(
      'listener:count',
      expect.any(Function)
    );
  });

  it('should unsubscribe from WebSocket events on unmount', () => {
    const { unmount } = renderHook(() => useDiscoveryWebSocket());

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledTimes(3);
    expect(mockUnsubscribe).toHaveBeenCalledWith(
      'listener:added',
      expect.any(Function)
    );
    expect(mockUnsubscribe).toHaveBeenCalledWith(
      'listener:removed',
      expect.any(Function)
    );
    expect(mockUnsubscribe).toHaveBeenCalledWith(
      'listener:count',
      expect.any(Function)
    );
  });

  it('should not subscribe when enabled is false', () => {
    renderHook(() => useDiscoveryWebSocket({ enabled: false }));

    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('should handle listener:added event', () => {
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

    const payload: ListenerAddedPayload = {
      listener,
      timestamp: new Date(),
    };

    renderHook(() => useDiscoveryWebSocket());

    // Get the handler that was registered
    const listenerAddedHandler = mockSubscribe.mock.calls.find(
      (call) => call[0] === 'listener:added'
    )?.[1];

    expect(listenerAddedHandler).toBeDefined();

    // Simulate WebSocket event
    act(() => {
      listenerAddedHandler(payload);
    });

    // Check that store was updated
    const state = useDiscoveryStore.getState();
    expect(state.listeners).toHaveLength(1);
    expect(state.listeners[0]).toEqual(listener);
  });

  it('should handle listener:removed event', () => {
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

    // Add listener first
    act(() => {
      useDiscoveryStore.getState().addListener(listener);
    });

    expect(useDiscoveryStore.getState().listeners).toHaveLength(1);

    renderHook(() => useDiscoveryWebSocket());

    // Get the handler that was registered
    const listenerRemovedHandler = mockSubscribe.mock.calls.find(
      (call) => call[0] === 'listener:removed'
    )?.[1];

    expect(listenerRemovedHandler).toBeDefined();

    const payload: ListenerRemovedPayload = {
      userId: 'user-1',
      timestamp: new Date(),
    };

    // Simulate WebSocket event
    act(() => {
      listenerRemovedHandler(payload);
    });

    // Check that store was updated
    const state = useDiscoveryStore.getState();
    expect(state.listeners).toHaveLength(0);
  });

  it('should handle listener:count event', () => {
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

    // Add listener first to create a track cluster
    act(() => {
      useDiscoveryStore.getState().addListener(listener);
    });

    renderHook(() => useDiscoveryWebSocket());

    // Get the handler that was registered
    const listenerCountHandler = mockSubscribe.mock.calls.find(
      (call) => call[0] === 'listener:count'
    )?.[1];

    expect(listenerCountHandler).toBeDefined();

    const payload: ListenerCountUpdatePayload = {
      trackId: 'track-1',
      count: 5,
      timestamp: new Date(),
    };

    // Simulate WebSocket event
    act(() => {
      listenerCountHandler(payload);
    });

    // Check that store was updated
    const state = useDiscoveryStore.getState();
    expect(state.trackClusters[0].listenerCount).toBe(5);
  });

  it('should call onListenerAdded callback', () => {
    const onListenerAdded = jest.fn();

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

    const payload: ListenerAddedPayload = {
      listener,
      timestamp: new Date(),
    };

    renderHook(() => useDiscoveryWebSocket({ onListenerAdded }));

    // Get the handler that was registered
    const listenerAddedHandler = mockSubscribe.mock.calls.find(
      (call) => call[0] === 'listener:added'
    )?.[1];

    // Simulate WebSocket event
    act(() => {
      listenerAddedHandler(payload);
    });

    expect(onListenerAdded).toHaveBeenCalledWith(payload);
  });

  it('should call onListenerRemoved callback', () => {
    const onListenerRemoved = jest.fn();

    const payload: ListenerRemovedPayload = {
      userId: 'user-1',
      timestamp: new Date(),
    };

    renderHook(() => useDiscoveryWebSocket({ onListenerRemoved }));

    // Get the handler that was registered
    const listenerRemovedHandler = mockSubscribe.mock.calls.find(
      (call) => call[0] === 'listener:removed'
    )?.[1];

    // Simulate WebSocket event
    act(() => {
      listenerRemovedHandler(payload);
    });

    expect(onListenerRemoved).toHaveBeenCalledWith(payload);
  });

  it('should call onListenerCountUpdate callback', () => {
    const onListenerCountUpdate = jest.fn();

    const payload: ListenerCountUpdatePayload = {
      trackId: 'track-1',
      count: 5,
      timestamp: new Date(),
    };

    renderHook(() => useDiscoveryWebSocket({ onListenerCountUpdate }));

    // Get the handler that was registered
    const listenerCountHandler = mockSubscribe.mock.calls.find(
      (call) => call[0] === 'listener:count'
    )?.[1];

    // Simulate WebSocket event
    act(() => {
      listenerCountHandler(payload);
    });

    expect(onListenerCountUpdate).toHaveBeenCalledWith(payload);
  });

  it('should resubscribe when dependencies change', () => {
    const { rerender } = renderHook(
      ({ enabled }) => useDiscoveryWebSocket({ enabled }),
      { initialProps: { enabled: true } }
    );

    expect(mockSubscribe).toHaveBeenCalledTimes(3);

    // Change enabled to false
    rerender({ enabled: false });

    // Should unsubscribe
    expect(mockUnsubscribe).toHaveBeenCalledTimes(3);

    // Clear mocks
    mockSubscribe.mockClear();
    mockUnsubscribe.mockClear();

    // Change enabled back to true
    rerender({ enabled: true });

    // Should resubscribe
    expect(mockSubscribe).toHaveBeenCalledTimes(3);
  });
});
