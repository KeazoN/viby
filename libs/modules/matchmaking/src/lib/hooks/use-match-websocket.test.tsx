import { renderHook, act } from '@testing-library/react';
import { useMatchWebSocket } from './use-match-websocket';
import { useMatchmakingStore } from '../stores/matchmaking-store';
import { socketManager } from '@viby/modules/realtime';
import { matchmakingService } from '../services/matchmaking-service';
import type {
  Match,
  Track,
  User,
  MatchCreatedPayload,
  MatchAcceptedPayload,
  MatchDeclinedPayload,
  MatchExpiredPayload,
} from '../types';

// Mock socketManager
jest.mock('@viby/modules/realtime', () => ({
  socketManager: {
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
  },
}));

// Mock matchmakingService
jest.mock('../services/matchmaking-service', () => ({
  matchmakingService: {
    declineMatch: jest.fn(),
  },
}));

describe('useMatchWebSocket', () => {
  let mockSubscribe: jest.Mock;
  let mockUnsubscribe: jest.Mock;
  let mockDeclineMatch: jest.Mock;

  beforeEach(() => {
    // Clear store before each test
    const store = useMatchmakingStore.getState();
    store.clearActiveMatch();

    // Reset mocks
    mockSubscribe = socketManager.subscribe as jest.Mock;
    mockUnsubscribe = socketManager.unsubscribe as jest.Mock;
    mockDeclineMatch = matchmakingService.declineMatch as jest.Mock;
    mockSubscribe.mockClear();
    mockUnsubscribe.mockClear();
    mockDeclineMatch.mockClear();
    mockDeclineMatch.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should subscribe to WebSocket events on mount', () => {
    renderHook(() => useMatchWebSocket());

    expect(mockSubscribe).toHaveBeenCalledTimes(4);
    expect(mockSubscribe).toHaveBeenCalledWith(
      'match:created',
      expect.any(Function)
    );
    expect(mockSubscribe).toHaveBeenCalledWith(
      'match:accepted',
      expect.any(Function)
    );
    expect(mockSubscribe).toHaveBeenCalledWith(
      'match:declined',
      expect.any(Function)
    );
    expect(mockSubscribe).toHaveBeenCalledWith(
      'match:expired',
      expect.any(Function)
    );
  });

  it('should unsubscribe from WebSocket events on unmount', () => {
    const { unmount } = renderHook(() => useMatchWebSocket());

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledTimes(4);
    expect(mockUnsubscribe).toHaveBeenCalledWith(
      'match:created',
      expect.any(Function)
    );
    expect(mockUnsubscribe).toHaveBeenCalledWith(
      'match:accepted',
      expect.any(Function)
    );
    expect(mockUnsubscribe).toHaveBeenCalledWith(
      'match:declined',
      expect.any(Function)
    );
    expect(mockUnsubscribe).toHaveBeenCalledWith(
      'match:expired',
      expect.any(Function)
    );
  });

  it('should not subscribe when enabled is false', () => {
    renderHook(() => useMatchWebSocket({ enabled: false }));

    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('should handle match:created event and start timeout', () => {
    jest.useFakeTimers();

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

    const user1: User = {
      id: 'user-1',
      username: 'testuser1',
      avatar: null,
    };

    const user2: User = {
      id: 'user-2',
      username: 'testuser2',
      avatar: null,
    };

    const match: Match = {
      id: 'match-1',
      trackId: 'track-1',
      track,
      users: [user1, user2],
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30000).toISOString(),
    };

    const payload: MatchCreatedPayload = {
      match,
      timestamp: new Date(),
    };

    renderHook(() => useMatchWebSocket());

    // Get the handler that was registered
    const matchCreatedHandler = mockSubscribe.mock.calls.find(
      (call) => call[0] === 'match:created'
    )?.[1];

    expect(matchCreatedHandler).toBeDefined();

    // Simulate WebSocket event
    act(() => {
      matchCreatedHandler(payload);
    });

    // Check that store was updated
    const state = useMatchmakingStore.getState();
    expect(state.activeMatch).toEqual(match);
    expect(state.matchStatus).toBe('pending');
    expect(state.timeoutId).not.toBeNull();

    // Fast-forward time by 30 seconds to trigger auto-decline
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    // Check that auto-decline was called
    expect(mockDeclineMatch).toHaveBeenCalledWith('match-1');
  });

  it('should handle match:accepted event', () => {
    jest.useFakeTimers();

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

    const user1: User = {
      id: 'user-1',
      username: 'testuser1',
      avatar: null,
    };

    const user2: User = {
      id: 'user-2',
      username: 'testuser2',
      avatar: null,
    };

    const match: Match = {
      id: 'match-1',
      trackId: 'track-1',
      track,
      users: [user1, user2],
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30000).toISOString(),
    };

    // Set active match first
    act(() => {
      useMatchmakingStore.getState().setActiveMatch(match);
    });

    renderHook(() => useMatchWebSocket());

    // Get the handler that was registered
    const matchAcceptedHandler = mockSubscribe.mock.calls.find(
      (call) => call[0] === 'match:accepted'
    )?.[1];

    expect(matchAcceptedHandler).toBeDefined();

    const payload: MatchAcceptedPayload = {
      matchId: 'match-1',
      roomId: 'room-1',
      timestamp: new Date(),
    };

    // Simulate WebSocket event
    act(() => {
      matchAcceptedHandler(payload);
    });

    // Check that status was updated
    let state = useMatchmakingStore.getState();
    expect(state.matchStatus).toBe('accepted');

    // Fast-forward time by 500ms to allow clearActiveMatch to execute
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Check that active match was cleared after delay
    state = useMatchmakingStore.getState();
    expect(state.activeMatch).toBeNull();
  });

  it('should handle match:declined event', () => {
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

    const user1: User = {
      id: 'user-1',
      username: 'testuser1',
      avatar: null,
    };

    const user2: User = {
      id: 'user-2',
      username: 'testuser2',
      avatar: null,
    };

    const match: Match = {
      id: 'match-1',
      trackId: 'track-1',
      track,
      users: [user1, user2],
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30000).toISOString(),
    };

    // Set active match first
    act(() => {
      useMatchmakingStore.getState().setActiveMatch(match);
    });

    renderHook(() => useMatchWebSocket());

    // Get the handler that was registered
    const matchDeclinedHandler = mockSubscribe.mock.calls.find(
      (call) => call[0] === 'match:declined'
    )?.[1];

    expect(matchDeclinedHandler).toBeDefined();

    const payload: MatchDeclinedPayload = {
      matchId: 'match-1',
      timestamp: new Date(),
    };

    // Simulate WebSocket event
    act(() => {
      matchDeclinedHandler(payload);
    });

    // Check that store was updated
    const state = useMatchmakingStore.getState();
    expect(state.matchStatus).toBe('declined');
    expect(state.activeMatch).toBeNull();
  });

  it('should handle match:expired event', () => {
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

    const user1: User = {
      id: 'user-1',
      username: 'testuser1',
      avatar: null,
    };

    const user2: User = {
      id: 'user-2',
      username: 'testuser2',
      avatar: null,
    };

    const match: Match = {
      id: 'match-1',
      trackId: 'track-1',
      track,
      users: [user1, user2],
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30000).toISOString(),
    };

    // Set active match first
    act(() => {
      useMatchmakingStore.getState().setActiveMatch(match);
    });

    renderHook(() => useMatchWebSocket());

    // Get the handler that was registered
    const matchExpiredHandler = mockSubscribe.mock.calls.find(
      (call) => call[0] === 'match:expired'
    )?.[1];

    expect(matchExpiredHandler).toBeDefined();

    const payload: MatchExpiredPayload = {
      matchId: 'match-1',
      timestamp: new Date(),
    };

    // Simulate WebSocket event
    act(() => {
      matchExpiredHandler(payload);
    });

    // Check that store was updated
    const state = useMatchmakingStore.getState();
    expect(state.matchStatus).toBe('expired');
    expect(state.activeMatch).toBeNull();
  });

  it('should call onMatchCreated callback', () => {
    const onMatchCreated = jest.fn();

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

    const user1: User = {
      id: 'user-1',
      username: 'testuser1',
      avatar: null,
    };

    const user2: User = {
      id: 'user-2',
      username: 'testuser2',
      avatar: null,
    };

    const match: Match = {
      id: 'match-1',
      trackId: 'track-1',
      track,
      users: [user1, user2],
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30000).toISOString(),
    };

    const payload: MatchCreatedPayload = {
      match,
      timestamp: new Date(),
    };

    renderHook(() => useMatchWebSocket({ onMatchCreated }));

    // Get the handler that was registered
    const matchCreatedHandler = mockSubscribe.mock.calls.find(
      (call) => call[0] === 'match:created'
    )?.[1];

    // Simulate WebSocket event
    act(() => {
      matchCreatedHandler(payload);
    });

    expect(onMatchCreated).toHaveBeenCalledWith(payload);
  });

  it('should call onMatchAccepted callback', () => {
    const onMatchAccepted = jest.fn();

    const payload: MatchAcceptedPayload = {
      matchId: 'match-1',
      roomId: 'room-1',
      timestamp: new Date(),
    };

    renderHook(() => useMatchWebSocket({ onMatchAccepted }));

    // Get the handler that was registered
    const matchAcceptedHandler = mockSubscribe.mock.calls.find(
      (call) => call[0] === 'match:accepted'
    )?.[1];

    // Simulate WebSocket event
    act(() => {
      matchAcceptedHandler(payload);
    });

    expect(onMatchAccepted).toHaveBeenCalledWith(payload);
  });

  it('should call onMatchDeclined callback', () => {
    const onMatchDeclined = jest.fn();

    const payload: MatchDeclinedPayload = {
      matchId: 'match-1',
      timestamp: new Date(),
    };

    renderHook(() => useMatchWebSocket({ onMatchDeclined }));

    // Get the handler that was registered
    const matchDeclinedHandler = mockSubscribe.mock.calls.find(
      (call) => call[0] === 'match:declined'
    )?.[1];

    // Simulate WebSocket event
    act(() => {
      matchDeclinedHandler(payload);
    });

    expect(onMatchDeclined).toHaveBeenCalledWith(payload);
  });

  it('should call onMatchExpired callback', () => {
    const onMatchExpired = jest.fn();

    const payload: MatchExpiredPayload = {
      matchId: 'match-1',
      timestamp: new Date(),
    };

    renderHook(() => useMatchWebSocket({ onMatchExpired }));

    // Get the handler that was registered
    const matchExpiredHandler = mockSubscribe.mock.calls.find(
      (call) => call[0] === 'match:expired'
    )?.[1];

    // Simulate WebSocket event
    act(() => {
      matchExpiredHandler(payload);
    });

    expect(onMatchExpired).toHaveBeenCalledWith(payload);
  });

  it('should resubscribe when dependencies change', () => {
    const { rerender } = renderHook(
      ({ enabled }) => useMatchWebSocket({ enabled }),
      { initialProps: { enabled: true } }
    );

    expect(mockSubscribe).toHaveBeenCalledTimes(4);

    // Change enabled to false
    rerender({ enabled: false });

    // Should unsubscribe
    expect(mockUnsubscribe).toHaveBeenCalledTimes(4);

    // Clear mocks
    mockSubscribe.mockClear();
    mockUnsubscribe.mockClear();

    // Change enabled back to true
    rerender({ enabled: true });

    // Should resubscribe
    expect(mockSubscribe).toHaveBeenCalledTimes(4);
  });
});
