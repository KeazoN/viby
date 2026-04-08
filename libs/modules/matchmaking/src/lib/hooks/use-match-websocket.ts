import { useEffect } from 'react';
import { socketManager } from '@viby/modules/realtime';
import { useMatchmakingStore } from '../stores/matchmaking-store';
import { matchmakingService } from '../services/matchmaking-service';
import type {
  MatchCreatedPayload,
  MatchAcceptedPayload,
  MatchDeclinedPayload,
  MatchExpiredPayload,
} from '../types';

export interface UseMatchWebSocketOptions {
  /**
   * Whether to automatically subscribe to match events
   * @default true
   */
  enabled?: boolean;

  /**
   * Callback when a match is created
   */
  onMatchCreated?: (payload: MatchCreatedPayload) => void;

  /**
   * Callback when a match is accepted
   */
  onMatchAccepted?: (payload: MatchAcceptedPayload) => void;

  /**
   * Callback when a match is declined
   */
  onMatchDeclined?: (payload: MatchDeclinedPayload) => void;

  /**
   * Callback when a match expires
   */
  onMatchExpired?: (payload: MatchExpiredPayload) => void;
}

/**
 * useMatchWebSocket Hook
 * 
 * Manages WebSocket event subscriptions for the Matchmaking module.
 * Automatically subscribes to match events and updates the matchmaking store.
 * Triggers the 30-second timeout when a match is created.
 * 
 * Events handled:
 * - match:created - When a new match is found
 * - match:accepted - When a match is accepted by either user
 * - match:declined - When a match is declined by either user
 * - match:expired - When a match expires after 30 seconds
 * 
 * @param options - Configuration options
 * 
 * 
 * @example
 * ```tsx
 * function MatchmakingScreen() {
 *   const { activeMatch } = useMatchmaking();
 *   
 *   // Subscribe to WebSocket events
 *   useMatchWebSocket({
 *     onMatchCreated: (payload) => {
 *       console.log('Match found:', payload.match.users[1].username);
 *       // Show notification or modal
 *     },
 *     onMatchAccepted: (payload) => {
 *       console.log('Match accepted, room:', payload.roomId);
 *       // Navigate to game screen
 *     },
 *     onMatchExpired: (payload) => {
 *       console.log('Match expired:', payload.matchId);
 *       // Show timeout message
 *     },
 *   });
 *   
 *   return (
 *     <View>
 *       {activeMatch && <MatchNotification match={activeMatch} />}
 *     </View>
 *   );
 * }
 * ```
 */
export function useMatchWebSocket(
  options: UseMatchWebSocketOptions = {}
): void {
  const {
    enabled = true,
    onMatchCreated,
    onMatchAccepted,
    onMatchDeclined,
    onMatchExpired,
  } = options;

  const {
    setActiveMatch,
    updateMatchStatus,
    clearActiveMatch,
    startMatchTimeout,
  } = useMatchmakingStore();

  useEffect(() => {
    if (!enabled) return;

    // Handler for match:created event
    const handleMatchCreated = (payload: MatchCreatedPayload) => {
      // Update store with new match
      setActiveMatch(payload.match);

      // Start 30-second timeout for auto-decline
      startMatchTimeout(async () => {
        try {
          // Auto-decline the match after 30 seconds
          await matchmakingService.declineMatch(payload.match.id);
          console.log('Match auto-declined after timeout:', payload.match.id);
        } catch (error) {
          console.error('Failed to auto-decline match:', error);
        }
      });

      // Call optional callback
      if (onMatchCreated) {
        onMatchCreated(payload);
      }
    };

    // Handler for match:accepted event
    const handleMatchAccepted = (payload: MatchAcceptedPayload) => {
      // Update match status
      updateMatchStatus('accepted');

      // Call optional callback
      if (onMatchAccepted) {
        onMatchAccepted(payload);
      }

      // Clear active match after a short delay to allow UI transition
      setTimeout(() => {
        clearActiveMatch();
      }, 500);
    };

    // Handler for match:declined event
    const handleMatchDeclined = (payload: MatchDeclinedPayload) => {
      // Update match status
      updateMatchStatus('declined');

      // Call optional callback
      if (onMatchDeclined) {
        onMatchDeclined(payload);
      }

      // Clear active match
      clearActiveMatch();
    };

    // Handler for match:expired event
    const handleMatchExpired = (payload: MatchExpiredPayload) => {
      // Update match status
      updateMatchStatus('expired');

      // Call optional callback
      if (onMatchExpired) {
        onMatchExpired(payload);
      }

      // Clear active match
      clearActiveMatch();
    };

    // Subscribe to WebSocket events
    socketManager.subscribe('match:created', handleMatchCreated);
    socketManager.subscribe('match:accepted', handleMatchAccepted);
    socketManager.subscribe('match:declined', handleMatchDeclined);
    socketManager.subscribe('match:expired', handleMatchExpired);

    // Cleanup: unsubscribe on unmount
    return () => {
      socketManager.unsubscribe('match:created', handleMatchCreated);
      socketManager.unsubscribe('match:accepted', handleMatchAccepted);
      socketManager.unsubscribe('match:declined', handleMatchDeclined);
      socketManager.unsubscribe('match:expired', handleMatchExpired);
    };
  }, [
    enabled,
    setActiveMatch,
    updateMatchStatus,
    clearActiveMatch,
    startMatchTimeout,
    onMatchCreated,
    onMatchAccepted,
    onMatchDeclined,
    onMatchExpired,
  ]);
}
