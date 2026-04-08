import { httpClient } from '@viby/shared/networking';
import { socketManager } from '@viby/modules/realtime';
import type {
  Listener,
  TrackCluster,
  ListenerAddedPayload,
  ListenerRemovedPayload,
  ListenerCountUpdatePayload,
} from '../types';

/**
 * DiscoveryService handles realtime listener feed visualization,
 * track cluster management, and currently playing detection.
 * 
 * Integrates with:
 * - SocketManager from realtime module for WebSocket events
 * - HttpClient from networking module for REST API calls
 * 

 */
export class DiscoveryService {
  private eventHandlers: Map<string, (data: any) => void> = new Map();

  /**
   * Subscribe to listener events from WebSocket
   * Sets up event handlers for listener:added, listener:removed, and listener:count events
   */
  subscribeToListenerEvents(): void {
    // Handler for listener:added event
    const listenerAddedHandler = (payload: ListenerAddedPayload) => {
      // Event will be handled by hooks/components that subscribe to the store
      console.log('Listener added:', payload.listener);
    };

    // Handler for listener:removed event
    const listenerRemovedHandler = (payload: ListenerRemovedPayload) => {
      console.log('Listener removed:', payload.userId);
    };

    // Handler for listener:count event
    const listenerCountHandler = (payload: ListenerCountUpdatePayload) => {
      console.log('Listener count updated:', payload.trackId, payload.count);
    };

    // Store handlers for cleanup
    this.eventHandlers.set('listener:added', listenerAddedHandler);
    this.eventHandlers.set('listener:removed', listenerRemovedHandler);
    this.eventHandlers.set('listener:count', listenerCountHandler);

    // Subscribe to WebSocket events
    socketManager.subscribe('listener:added', listenerAddedHandler);
    socketManager.subscribe('listener:removed', listenerRemovedHandler);
    socketManager.subscribe('listener:count', listenerCountHandler);
  }

  /**
   * Unsubscribe from listener events
   * Cleans up all WebSocket event subscriptions
   */
  unsubscribeFromListenerEvents(): void {
    // Unsubscribe from all events
    this.eventHandlers.forEach((handler, event) => {
      socketManager.unsubscribe(event, handler);
    });

    // Clear handlers map
    this.eventHandlers.clear();
  }

  /**
   * Get all active listeners from the API
   * @returns Promise resolving to array of active listeners
   */
  async getActiveListeners(): Promise<Listener[]> {
    try {
      const response = await httpClient.get<{ listeners: Listener[] }>(
        '/discovery/listeners'
      );
      return response.listeners;
    } catch (error) {
      console.error('Failed to fetch active listeners:', error);
      throw error;
    }
  }

  /**
   * Get track clusters with listener counts from the API
   * @returns Promise resolving to array of track clusters
   */
  async getTrackClusters(): Promise<TrackCluster[]> {
    try {
      const response = await httpClient.get<{ clusters: TrackCluster[] }>(
        '/discovery/track-clusters'
      );
      return response.clusters;
    } catch (error) {
      console.error('Failed to fetch track clusters:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const discoveryService = new DiscoveryService();
