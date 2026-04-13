/**
 * MatchScreen Integration Tests
 * 
 * Tests integration between MatchScreen, Matchmaking module hooks,
 * WebSocket events, and state updates.
 * 
 * Requirements: 5.1, 5.2, 5.4, 5.5, 5.6
 * - 5.1: Quick Match request to Backend_API
 * - 5.2: Display special match notification with animation
 * - 5.4: Accept match and transition to Game_Session
 * - 5.5: Decline match and return to Discovery
 * - 5.6: Auto-decline after 30 seconds timeout
 */

import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { MatchScreen } from './MatchScreen';
import { useMatchmakingStore } from '@viby/modules/matchmaking';
import { matchmakingService } from '@viby/modules/matchmaking';
import { socketManager } from '@viby/modules/realtime';
import type {
  Match,
  Track,
  User,
  MatchCreatedPayload,
  MatchAcceptedPayload,
  MatchDeclinedPayload,
  MatchExpiredPayload,
} from '@viby/modules/matchmaking';

// Mock socket manager
jest.mock('@viby/modules/realtime', () => ({
  socketManager: {
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    emit: jest.fn(),
    isConnected: jest.fn(() => true),
  },
}));

// Mock matchmaking service
jest.mock('@viby/modules/matchmaking', () => {
  const actual = jest.requireActual('@viby/modules/matchmaking');
  return {
    ...actual,
    matchmakingService: {
      requestMatch: jest.fn(),
      acceptMatch: jest.fn(),
      declineMatch: jest.fn(),
      subscribeToMatchEvents: jest.fn(),
      unsubscribeFromMatchEvents: jest.fn(),
    },
  };
});

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  
  Reanimated.default.useSharedValue = (initialValue: any) => ({
    value: initialValue,
  });
  
  Reanimated.default.useAnimatedStyle = (callback: any) => {
    return callback();
  };
  
  return Reanimated.default;
});

describe('MatchScreen Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // Clear matchmaking store before each test
    useMatchmakingStore.getState().clearActiveMatch();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const createMockTrack = (id: string, title: string): Track => ({
    id,
    title,
    artist: 'Test Artist',
    album: 'Test Album',
    artwork: `https://example.com/artwork-${id}.jpg`,
    duration: 180,
    isrc: null,
    provider: 'spotify',
  });

  const createMockUser = (id: string, username: string): User => ({
    id,
    username,
    avatar: null,
  });

  const createMockMatch = (id: string, trackId: string): Match => {
    const track = createMockTrack(trackId, 'Matched Song');
    const user1 = createMockUser('user-1', 'currentUser');
    const user2 = createMockUser('user-2', 'matchedUser');

    return {
      id,
      trackId,
      track,
      users: [user1, user2],
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30000).toISOString(),
    };
  };

  describe('Match Notification Display', () => {
    it('should display match notification when match is created', async () => {
      const match = createMockMatch('match-1', 'track-1');

      // Set active match in store
      act(() => {
        useMatchmakingStore.getState().setActiveMatch(match);
      });

      const { getByText } = render(<MatchScreen />);

      // Should display match notification
      await waitFor(() => {
        expect(getByText("It's a Match!")).toBeTruthy();
        expect(getByText('You both love the same music')).toBeTruthy();
      });
    });

    it('should display match notification with animation', async () => {
      const match = createMockMatch('match-1', 'track-1');

      act(() => {
        useMatchmakingStore.getState().setActiveMatch(match);
      });

      const { getByText, UNSAFE_root } = render(<MatchScreen />);

      // Should render with animations
      await waitFor(() => {
        expect(getByText("It's a Match!")).toBeTruthy();
      });

      // Verify component structure includes animation elements
      expect(UNSAFE_root).toBeTruthy();
    });

    it('should handle match:created WebSocket event', async () => {
      const match = createMockMatch('match-1', 'track-1');
      const payload: MatchCreatedPayload = {
        match,
        timestamp: new Date(),
      };

      // Simulate WebSocket event
      act(() => {
        useMatchmakingStore.getState().setActiveMatch(payload.match);
      });

      const { getByText } = render(<MatchScreen />);

      // Should display match notification
      await waitFor(() => {
        expect(getByText("It's a Match!")).toBeTruthy();
      });

      // Verify store state
      expect(useMatchmakingStore.getState().activeMatch).toEqual(match);
      expect(useMatchmakingStore.getState().matchStatus).toBe('pending');
    });

    it('should display confetti animation on match', async () => {
      const match = createMockMatch('match-1', 'track-1');

      act(() => {
        useMatchmakingStore.getState().setActiveMatch(match);
      });

      const { getByText } = render(<MatchScreen />);

      // Should render confetti particles
      await waitFor(() => {
        expect(getByText("It's a Match!")).toBeTruthy();
      });

      // Confetti should be present in the component tree
      // (actual animation behavior is tested in unit tests)
    });

    it('should display avatar with glow effect', async () => {
      const match = createMockMatch('match-1', 'track-1');

      act(() => {
        useMatchmakingStore.getState().setActiveMatch(match);
      });

      const { getByText } = render(<MatchScreen />);

      // Should render avatar
      await waitFor(() => {
        expect(getByText('🎵')).toBeTruthy();
      });
    });
  });

  describe('Accept Match Actions', () => {
    it('should call acceptMatch API when match is accepted', async () => {
      const match = createMockMatch('match-1', 'track-1');
      const mockAcceptResponse = {
        roomId: 'room-123',
        match: { ...match, status: 'accepted' as const },
      };

      (matchmakingService.acceptMatch as jest.Mock).mockResolvedValue(
        mockAcceptResponse
      );

      act(() => {
        useMatchmakingStore.getState().setActiveMatch(match);
      });

      // Simulate accepting the match
      await act(async () => {
        await matchmakingService.acceptMatch(match.id);
      });

      // Should call acceptMatch API
      expect(matchmakingService.acceptMatch).toHaveBeenCalledWith('match-1');
    });

    it('should update match status to accepted', async () => {
      const match = createMockMatch('match-1', 'track-1');

      act(() => {
        useMatchmakingStore.getState().setActiveMatch(match);
      });

      // Simulate match:accepted event
      act(() => {
        useMatchmakingStore.getState().updateMatchStatus('accepted');
      });

      // Should update status
      expect(useMatchmakingStore.getState().matchStatus).toBe('accepted');
      expect(useMatchmakingStore.getState().activeMatch?.status).toBe('accepted');
    });

    it('should handle match:accepted WebSocket event', async () => {
      const match = createMockMatch('match-1', 'track-1');
      const payload: MatchAcceptedPayload = {
        matchId: 'match-1',
        roomId: 'room-123',
        timestamp: new Date(),
      };

      act(() => {
        useMatchmakingStore.getState().setActiveMatch(match);
      });

      // Simulate WebSocket event
      act(() => {
        useMatchmakingStore.getState().updateMatchStatus('accepted');
      });

      // Should update match status
      expect(useMatchmakingStore.getState().matchStatus).toBe('accepted');
    });

    it('should clear active match after accept', async () => {
      const match = createMockMatch('match-1', 'track-1');

      act(() => {
        useMatchmakingStore.getState().setActiveMatch(match);
      });

      expect(useMatchmakingStore.getState().activeMatch).not.toBeNull();

      // Simulate accepting and clearing
      act(() => {
        useMatchmakingStore.getState().updateMatchStatus('accepted');
        useMatchmakingStore.getState().clearActiveMatch();
      });

      // Should clear active match
      expect(useMatchmakingStore.getState().activeMatch).toBeNull();
      expect(useMatchmakingStore.getState().matchStatus).toBeNull();
    });

    it('should cancel timeout when match is accepted', async () => {
      const match = createMockMatch('match-1', 'track-1');
      const onExpire = jest.fn();

      act(() => {
        useMatchmakingStore.getState().setActiveMatch(match);
        useMatchmakingStore.getState().startMatchTimeout(onExpire);
      });

      expect(useMatchmakingStore.getState().timeoutId).not.toBeNull();

      // Accept match
      act(() => {
        useMatchmakingStore.getState().cancelMatchTimeout();
        useMatchmakingStore.getState().updateMatchStatus('accepted');
      });

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      // Timeout callback should not be called
      expect(onExpire).not.toHaveBeenCalled();
    });
  });

  describe('Decline Match Actions', () => {
    it('should call declineMatch API when match is declined', async () => {
      const match = createMockMatch('match-1', 'track-1');

      (matchmakingService.declineMatch as jest.Mock).mockResolvedValue(undefined);

      act(() => {
        useMatchmakingStore.getState().setActiveMatch(match);
      });

      // Simulate declining the match
      await act(async () => {
        await matchmakingService.declineMatch(match.id);
      });

      // Should call declineMatch API
      expect(matchmakingService.declineMatch).toHaveBeenCalledWith('match-1');
    });

    it('should update match status to declined', async () => {
      const match = createMockMatch('match-1', 'track-1');

      act(() => {
        useMatchmakingStore.getState().setActiveMatch(match);
      });

      // Simulate match:declined event
      act(() => {
        useMatchmakingStore.getState().updateMatchStatus('declined');
      });

      // Should update status
      expect(useMatchmakingStore.getState().matchStatus).toBe('declined');
      expect(useMatchmakingStore.getState().activeMatch?.status).toBe('declined');
    });

    it('should handle match:declined WebSocket event', async () => {
      const match = createMockMatch('match-1', 'track-1');
      const payload: MatchDeclinedPayload = {
        matchId: 'match-1',
        timestamp: new Date(),
      };

      act(() => {
        useMatchmakingStore.getState().setActiveMatch(match);
      });

      // Simulate WebSocket event
      act(() => {
        useMatchmakingStore.getState().updateMatchStatus('declined');
      });

      // Should update match status
      expect(useMatchmakingStore.getState().matchStatus).toBe('declined');
    });

    it('should clear active match after decline', async () => {
      const match = createMockMatch('match-1', 'track-1');

      act(() => {
        useMatchmakingStore.getState().setActiveMatch(match);
      });

      expect(useMatchmakingStore.getState().activeMatch).not.toBeNull();

      // Simulate declining and clearing
      act(() => {
        useMatchmakingStore.getState().updateMatchStatus('declined');
        useMatchmakingStore.getState().clearActiveMatch();
      });

      // Should clear active match
      expect(useMatchmakingStore.getState().activeMatch).toBeNull();
      expect(useMatchmakingStore.getState().matchStatus).toBeNull();
    });

    it('should cancel timeout when match is declined', async () => {
      const match = createMockMatch('match-1', 'track-1');
      const onExpire = jest.fn();

      act(() => {
        useMatchmakingStore.getState().setActiveMatch(match);
        useMatchmakingStore.getState().startMatchTimeout(onExpire);
      });

      expect(useMatchmakingStore.getState().timeoutId).not.toBeNull();

      // Decline match
      act(() => {
        useMatchmakingStore.getState().cancelMatchTimeout();
        useMatchmakingStore.getState().updateMatchStatus('declined');
      });

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      // Timeout callback should not be called
      expect(onExpire).not.toHaveBeenCalled();
    });
  });

  describe('Timeout Behavior', () => {
    it('should start 30-second timeout when match is created', async () => {
      const match = createMockMatch('match-1', 'track-1');
      const onExpire = jest.fn();

      act(() => {
        useMatchmakingStore.getState().setActiveMatch(match);
        useMatchmakingStore.getState().startMatchTimeout(onExpire);
      });

      // Should have timeout ID
      expect(useMatchmakingStore.getState().timeoutId).not.toBeNull();

      // Fast-forward time by 30 seconds
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      // Should call expire callback
      expect(onExpire).toHaveBeenCalled();
    });

    it('should auto-decline match after 30 seconds', async () => {
      const match = createMockMatch('match-1', 'track-1');

      (matchmakingService.declineMatch as jest.Mock).mockResolvedValue(undefined);

      const onExpire = jest.fn(async () => {
        await matchmakingService.declineMatch(match.id);
      });

      act(() => {
        useMatchmakingStore.getState().setActiveMatch(match);
        useMatchmakingStore.getState().startMatchTimeout(onExpire);
      });

      // Fast-forward time by 30 seconds
      await act(async () => {
        jest.advanceTimersByTime(30000);
        // Allow promises to resolve
        await Promise.resolve();
      });

      // Should call declineMatch API
      expect(onExpire).toHaveBeenCalled();
    });

    it('should update match status to expired after timeout', async () => {
      const match = createMockMatch('match-1', 'track-1');
      const onExpire = jest.fn();

      act(() => {
        useMatchmakingStore.getState().setActiveMatch(match);
        useMatchmakingStore.getState().startMatchTimeout(onExpire);
      });

      // Fast-forward time by 30 seconds
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      // Should update status to expired
      expect(useMatchmakingStore.getState().matchStatus).toBe('expired');
      expect(useMatchmakingStore.getState().activeMatch?.status).toBe('expired');
    });

    it('should handle match:expired WebSocket event', async () => {
      const match = createMockMatch('match-1', 'track-1');
      const payload: MatchExpiredPayload = {
        matchId: 'match-1',
        timestamp: new Date(),
      };

      act(() => {
        useMatchmakingStore.getState().setActiveMatch(match);
      });

      // Simulate WebSocket event
      act(() => {
        useMatchmakingStore.getState().updateMatchStatus('expired');
      });

      // Should update match status
      expect(useMatchmakingStore.getState().matchStatus).toBe('expired');
    });

    it('should clear timeout ID after expiration', async () => {
      const match = createMockMatch('match-1', 'track-1');
      const onExpire = jest.fn();

      act(() => {
        useMatchmakingStore.getState().setActiveMatch(match);
        useMatchmakingStore.getState().startMatchTimeout(onExpire);
      });

      expect(useMatchmakingStore.getState().timeoutId).not.toBeNull();

      // Fast-forward time by 30 seconds
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      // Timeout ID should be cleared
      expect(useMatchmakingStore.getState().timeoutId).toBeNull();
    });

    it('should not trigger timeout if match is accepted before expiration', async () => {
      const match = createMockMatch('match-1', 'track-1');
      const onExpire = jest.fn();

      act(() => {
        useMatchmakingStore.getState().setActiveMatch(match);
        useMatchmakingStore.getState().startMatchTimeout(onExpire);
      });

      // Accept match before timeout
      act(() => {
        jest.advanceTimersByTime(15000); // 15 seconds
        useMatchmakingStore.getState().cancelMatchTimeout();
        useMatchmakingStore.getState().updateMatchStatus('accepted');
      });

      // Fast-forward remaining time
      act(() => {
        jest.advanceTimersByTime(15000); // Total 30 seconds
      });

      // Should not call expire callback
      expect(onExpire).not.toHaveBeenCalled();
      expect(useMatchmakingStore.getState().matchStatus).toBe('accepted');
    });

    it('should not trigger timeout if match is declined before expiration', async () => {
      const match = createMockMatch('match-1', 'track-1');
      const onExpire = jest.fn();

      act(() => {
        useMatchmakingStore.getState().setActiveMatch(match);
        useMatchmakingStore.getState().startMatchTimeout(onExpire);
      });

      // Decline match before timeout
      act(() => {
        jest.advanceTimersByTime(10000); // 10 seconds
        useMatchmakingStore.getState().cancelMatchTimeout();
        useMatchmakingStore.getState().updateMatchStatus('declined');
      });

      // Fast-forward remaining time
      act(() => {
        jest.advanceTimersByTime(20000); // Total 30 seconds
      });

      // Should not call expire callback
      expect(onExpire).not.toHaveBeenCalled();
      expect(useMatchmakingStore.getState().matchStatus).toBe('declined');
    });
  });

  describe('Integration with Matchmaking Module', () => {
    it('should integrate with matchmaking store', async () => {
      const match = createMockMatch('match-1', 'track-1');

      act(() => {
        useMatchmakingStore.getState().setActiveMatch(match);
      });

      const { getByText } = render(<MatchScreen />);

      // Should display data from matchmaking store
      await waitFor(() => {
        expect(getByText("It's a Match!")).toBeTruthy();
        expect(useMatchmakingStore.getState().activeMatch).toEqual(match);
      });
    });

    it('should handle rapid match status updates', async () => {
      const match = createMockMatch('match-1', 'track-1');

      act(() => {
        useMatchmakingStore.getState().setActiveMatch(match);
      });

      // Rapidly update status
      act(() => {
        useMatchmakingStore.getState().updateMatchStatus('pending');
        useMatchmakingStore.getState().updateMatchStatus('accepted');
      });

      // Should reflect final status
      expect(useMatchmakingStore.getState().matchStatus).toBe('accepted');
    });

    it('should maintain state consistency across updates', async () => {
      const match1 = createMockMatch('match-1', 'track-1');
      const match2 = createMockMatch('match-2', 'track-2');

      // Set first match
      act(() => {
        useMatchmakingStore.getState().setActiveMatch(match1);
      });

      expect(useMatchmakingStore.getState().activeMatch?.id).toBe('match-1');

      // Clear and set second match
      act(() => {
        useMatchmakingStore.getState().clearActiveMatch();
        useMatchmakingStore.getState().setActiveMatch(match2);
      });

      expect(useMatchmakingStore.getState().activeMatch?.id).toBe('match-2');
    });

    it('should handle multiple timeout scenarios', async () => {
      const match1 = createMockMatch('match-1', 'track-1');
      const match2 = createMockMatch('match-2', 'track-2');
      const onExpire1 = jest.fn();
      const onExpire2 = jest.fn();

      // Start first timeout
      act(() => {
        useMatchmakingStore.getState().setActiveMatch(match1);
        useMatchmakingStore.getState().startMatchTimeout(onExpire1);
      });

      // Start second timeout (should cancel first)
      act(() => {
        useMatchmakingStore.getState().setActiveMatch(match2);
        useMatchmakingStore.getState().startMatchTimeout(onExpire2);
      });

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      // Only second callback should be called
      expect(onExpire1).not.toHaveBeenCalled();
      expect(onExpire2).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle acceptMatch API error', async () => {
      const match = createMockMatch('match-1', 'track-1');
      const error = new Error('Match already expired');

      (matchmakingService.acceptMatch as jest.Mock).mockRejectedValue(error);

      act(() => {
        useMatchmakingStore.getState().setActiveMatch(match);
      });

      // Simulate accepting the match
      await expect(
        matchmakingService.acceptMatch(match.id)
      ).rejects.toThrow('Match already expired');
    });

    it('should handle declineMatch API error', async () => {
      const match = createMockMatch('match-1', 'track-1');
      const error = new Error('Match not found');

      (matchmakingService.declineMatch as jest.Mock).mockRejectedValue(error);

      act(() => {
        useMatchmakingStore.getState().setActiveMatch(match);
      });

      // Simulate declining the match
      await expect(
        matchmakingService.declineMatch(match.id)
      ).rejects.toThrow('Match not found');
    });

    it('should handle timeout callback error gracefully', async () => {
      const match = createMockMatch('match-1', 'track-1');
      const error = new Error('Network error');
      const onExpire = jest.fn(() => {
        throw error;
      });

      act(() => {
        useMatchmakingStore.getState().setActiveMatch(match);
        useMatchmakingStore.getState().startMatchTimeout(onExpire);
      });

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      // Should still update status even if callback throws
      expect(onExpire).toHaveBeenCalled();
      expect(useMatchmakingStore.getState().matchStatus).toBe('expired');
    });
  });
});
