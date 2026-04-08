import { httpClient } from '@viby/shared/networking';
import { socketManager } from '@viby/modules/realtime';
import type {
  Match,
  RequestMatchRequest,
  RequestMatchResponse,
  AcceptMatchResponse,
  MatchCreatedPayload,
  MatchAcceptedPayload,
  MatchDeclinedPayload,
  MatchExpiredPayload,
} from '../types';

/**
 * MatchmakingService handles user pairing based on shared listening.
 * 
 * Integrates with:
 * - SocketManager from realtime module for WebSocket events
 * - HttpClient from networking module for REST API calls
 * 

 */
export class MatchmakingService {
  private eventHandlers: Map<string, (data: any) => void> = new Map();

  /**
   * Request a match with another user listening to the same track
   * @param trackId - The track ID to match on
   * @returns Promise resolving to the created match
   */
  async requestMatch(trackId: string): Promise<Match> {
    try {
      const response = await httpClient.post<RequestMatchResponse>(
        '/matchmaking/request',
        { trackId } as RequestMatchRequest
      );
      return response.match;
    } catch (error) {
      console.error('Failed to request match:', error);
      throw error;
    }
  }

  /**
   * Accept a match invitation
   * @param matchId - The match ID to accept
   * @returns Promise resolving to the room ID and match details
   */
  async acceptMatch(matchId: string): Promise<AcceptMatchResponse> {
    try {
      const response = await httpClient.post<AcceptMatchResponse>(
        `/matchmaking/${matchId}/accept`
      );
      return response;
    } catch (error) {
      console.error('Failed to accept match:', error);
      throw error;
    }
  }

  /**
   * Decline a match invitation
   * @param matchId - The match ID to decline
   */
  async declineMatch(matchId: string): Promise<void> {
    try {
      await httpClient.post(`/matchmaking/${matchId}/decline`);
    } catch (error) {
      console.error('Failed to decline match:', error);
      throw error;
    }
  }

  /**
   * Subscribe to match events from WebSocket
   * Sets up event handlers for match:created, match:accepted, match:declined, and match:expired events
   */
  subscribeToMatchEvents(): void {
    // Handler for match:created event
    const matchCreatedHandler = (payload: MatchCreatedPayload) => {
      console.log('Match created:', payload.match);
    };

    // Handler for match:accepted event
    const matchAcceptedHandler = (payload: MatchAcceptedPayload) => {
      console.log('Match accepted:', payload.matchId, 'Room:', payload.roomId);
    };

    // Handler for match:declined event
    const matchDeclinedHandler = (payload: MatchDeclinedPayload) => {
      console.log('Match declined:', payload.matchId);
    };

    // Handler for match:expired event
    const matchExpiredHandler = (payload: MatchExpiredPayload) => {
      console.log('Match expired:', payload.matchId);
    };

    // Store handlers for cleanup
    this.eventHandlers.set('match:created', matchCreatedHandler);
    this.eventHandlers.set('match:accepted', matchAcceptedHandler);
    this.eventHandlers.set('match:declined', matchDeclinedHandler);
    this.eventHandlers.set('match:expired', matchExpiredHandler);

    // Subscribe to WebSocket events
    socketManager.subscribe('match:created', matchCreatedHandler);
    socketManager.subscribe('match:accepted', matchAcceptedHandler);
    socketManager.subscribe('match:declined', matchDeclinedHandler);
    socketManager.subscribe('match:expired', matchExpiredHandler);
  }

  /**
   * Unsubscribe from match events
   * Cleans up all WebSocket event subscriptions
   */
  unsubscribeFromMatchEvents(): void {
    // Unsubscribe from all events
    this.eventHandlers.forEach((handler, event) => {
      socketManager.unsubscribe(event, handler);
    });

    // Clear handlers map
    this.eventHandlers.clear();
  }
}

// Export singleton instance
export const matchmakingService = new MatchmakingService();
