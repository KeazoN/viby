type EventHandler = (data: any) => void;

/**
 * EventBus provides a client-side event-driven communication system
 * for modules to communicate without tight coupling.
 * 
 * Features:
 * - Subscribe to events with on()
 * - Unsubscribe from events with off()
 * - Emit events to all subscribers with emit()
 * - Subscribe to one-time events with once()
 * - Error handling for event handlers
 */
export class EventBus {
  private events: Map<string, Set<EventHandler>> = new Map();

  /**
   * Subscribe to an event
   * @param event - Event name to subscribe to
   * @param handler - Handler function to call when event is emitted
   */
  on(event: string, handler: EventHandler): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(handler);
  }

  /**
   * Unsubscribe from an event
   * @param event - Event name to unsubscribe from
   * @param handler - Handler function to remove
   */
  off(event: string, handler: EventHandler): void {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.events.delete(event);
      }
    }
  }

  /**
   * Emit an event to all subscribers
   * @param event - Event name to emit
   * @param data - Data to pass to event handlers
   */
  emit(event: string, data: any): void {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Subscribe to an event that will only fire once
   * @param event - Event name to subscribe to
   * @param handler - Handler function to call when event is emitted
   */
  once(event: string, handler: EventHandler): void {
    const wrappedHandler = (data: any) => {
      handler(data);
      this.off(event, wrappedHandler);
    };
    this.on(event, wrappedHandler);
  }
}
