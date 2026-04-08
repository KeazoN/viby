import { useEffect } from 'react';
import { socketManager } from '@viby/modules/realtime';
import { useDiscoveryStore } from '../stores/discovery-store';
import type {
  ListenerAddedPayload,
  ListenerRemovedPayload,
  ListenerCountUpdatePayload,
} from '../types';

export interface UseDiscoveryWebSocketOptions {
  /**
   * Whether to automatically subscribe to discovery events
   * @default true
   */
  enabled?: boolean;

  /**
   * Callback when a listener is added
   */
  onListenerAdded?: (payload: ListenerAddedPayload) => void;

  /**
   * Callback when a listener is removed
   */
  onListenerRemoved?: (payload: ListenerRemovedPayload) => void;

  /**
   * Callback when listener count is updated
   */
  onListenerCountUpdate?: (payload: ListenerCountUpdatePayload) => void;
}

/**
 * useDiscoveryWebSocket Hook
 * 
 * Manages WebSocket event subscriptions for the Discovery module.
 * Automatically subscribes to listener events and updates the discovery store.
 * 
 * Events handled:
 * - listener:added - When a new listener starts playing
 * - listener:removed - When a listener stops playing
 * - listener:count - When listener count for a track changes
 * 
 * @param options - Configuration options
 * 
 * 
 * @example
 * ```tsx
 * function DiscoveryScreen() {
 *   const { listeners, trackClusters } = useDiscovery();
 *   
 *   // Subscribe to WebSocket events
 *   useDiscoveryWebSocket({
 *     onListenerAdded: (payload) => {
 *       console.log('New listener:', payload.listener.username);
 *     },
 *     onListenerRemoved: (payload) => {
 *       console.log('Listener left:', payload.userId);
 *     },
 *   });
 *   
 *   return (
 *     <View>
 *       <TrackClusterList clusters={trackClusters} />
 *     </View>
 *   );
 * }
 * ```
 */
export function useDiscoveryWebSocket(
  options: UseDiscoveryWebSocketOptions = {}
): void {
  const {
    enabled = true,
    onListenerAdded,
    onListenerRemoved,
    onListenerCountUpdate,
  } = options;

  const { addListener, removeListener, updateListenerCount } =
    useDiscoveryStore();

  useEffect(() => {
    if (!enabled) return;

    // Handler for listener:added event
    const handleListenerAdded = (payload: ListenerAddedPayload) => {
      // Update store
      addListener(payload.listener);

      // Call optional callback
      if (onListenerAdded) {
        onListenerAdded(payload);
      }
    };

    // Handler for listener:removed event
    const handleListenerRemoved = (payload: ListenerRemovedPayload) => {
      // Update store
      removeListener(payload.userId);

      // Call optional callback
      if (onListenerRemoved) {
        onListenerRemoved(payload);
      }
    };

    // Handler for listener:count event
    const handleListenerCountUpdate = (payload: ListenerCountUpdatePayload) => {
      // Update store
      updateListenerCount(payload.trackId, payload.count);

      // Call optional callback
      if (onListenerCountUpdate) {
        onListenerCountUpdate(payload);
      }
    };

    // Subscribe to WebSocket events
    socketManager.subscribe('listener:added', handleListenerAdded);
    socketManager.subscribe('listener:removed', handleListenerRemoved);
    socketManager.subscribe('listener:count', handleListenerCountUpdate);

    // Cleanup: unsubscribe on unmount
    return () => {
      socketManager.unsubscribe('listener:added', handleListenerAdded);
      socketManager.unsubscribe('listener:removed', handleListenerRemoved);
      socketManager.unsubscribe('listener:count', handleListenerCountUpdate);
    };
  }, [
    enabled,
    addListener,
    removeListener,
    updateListenerCount,
    onListenerAdded,
    onListenerRemoved,
    onListenerCountUpdate,
  ]);
}
