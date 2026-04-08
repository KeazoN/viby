import { useEffect, useCallback } from 'react';
import { socketManager } from '../socket-manager';

type EventHandler<T = any> = (data: T) => void;

export interface UseSocketEventOptions<T = any> {
  /**
   * Event name to subscribe to
   */
  event: string;
  
  /**
   * Handler function to call when event is received
   */
  handler: EventHandler<T>;
  
  /**
   * Whether to subscribe to the event
   * @default true
   */
  enabled?: boolean;
}

/**
 * React hook for subscribing to WebSocket events
 * 
 * Automatically subscribes on mount and unsubscribes on unmount.
 * Handles subscription restoration on reconnection.
 * 
 * @example
 * ```typescript
 * function ListenerFeed() {
 *   useSocketEvent({
 *     event: 'listener:added',
 *     handler: (data: { listener: Listener }) => {
 *       console.log('New listener:', data.listener);
 *       // Update your state
 *     },
 *   });
 * 
 *   return <View>...</View>;
 * }
 * ```
 */
export function useSocketEvent<T = any>(options: UseSocketEventOptions<T>): void {
  const { event, handler, enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;

    // Subscribe to event
    socketManager.subscribe(event, handler);

    // Cleanup: unsubscribe on unmount
    return () => {
      socketManager.unsubscribe(event, handler);
    };
  }, [event, handler, enabled]);
}

/**
 * React hook for emitting WebSocket events
 * 
 * Returns a memoized emit function that can be used to send events to the server.
 * Automatically queues messages when offline.
 * 
 * @example
 * ```typescript
 * function GameAnswer() {
 *   const emitAnswer = useSocketEmit();
 * 
 *   const handleSubmit = (answer: string) => {
 *     emitAnswer('game:answer', {
 *       roomId: 'room-123',
 *       answer,
 *     });
 *   };
 * 
 *   return <Button onPress={() => handleSubmit('The Beatles')} />;
 * }
 * ```
 */
export function useSocketEmit() {
  return useCallback((event: string, data: any) => {
    socketManager.emit(event, data);
  }, []);
}
