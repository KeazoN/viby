# EventBus Usage Guide

The EventBus provides a client-side event-driven communication system for modules to communicate without tight coupling.

## Basic Usage

### Creating an EventBus Instance

```typescript
import { EventBus } from '@viby/modules/realtime';

const eventBus = new EventBus();
```

### Subscribing to Events

Use `on()` to subscribe to events:

```typescript
const handler = (data) => {
  console.log('Event received:', data);
};

eventBus.on('connection:status', handler);
```

### Emitting Events

Use `emit()` to send events to all subscribers:

```typescript
eventBus.emit('connection:status', { status: 'connected' });
```

### Unsubscribing from Events

Use `off()` to unsubscribe:

```typescript
eventBus.off('connection:status', handler);
```

### One-Time Subscriptions

Use `once()` for events that should only fire once:

```typescript
eventBus.once('game:ended', (data) => {
  console.log('Game ended:', data);
  // This handler will automatically unsubscribe after first emission
});
```

## Real-World Examples

### Connection Status Events

```typescript
// Subscribe to connection status changes
eventBus.on('connection:status', ({ status }) => {
  switch (status) {
    case 'connected':
      console.log('Connected to server');
      break;
    case 'disconnected':
      console.log('Disconnected from server');
      break;
    case 'reconnecting':
      console.log('Reconnecting to server...');
      break;
  }
});

// Emit connection status
eventBus.emit('connection:status', { status: 'connected' });
```

### Listener Events

```typescript
// Subscribe to listener added events
eventBus.on('listener:added', ({ listener }) => {
  console.log('New listener:', listener.username);
  // Update UI to show new listener
});

// Subscribe to listener removed events
eventBus.on('listener:removed', ({ userId }) => {
  console.log('Listener removed:', userId);
  // Update UI to remove listener
});

// Emit listener events
eventBus.emit('listener:added', {
  listener: {
    userId: '123',
    username: 'john_doe',
    trackId: 'track_456'
  }
});
```

### Game Events

```typescript
// Subscribe to game start
eventBus.on('game:started', ({ roomId }) => {
  console.log('Game started in room:', roomId);
});

// Subscribe to round start
eventBus.on('game:round-start', ({ round }) => {
  console.log('Round started:', round);
});

// Use once() for game end (only need to handle once)
eventBus.once('game:ended', ({ finalScores }) => {
  console.log('Game ended with scores:', finalScores);
  // Show final scores screen
});
```

## Error Handling

The EventBus automatically catches and logs errors in event handlers:

```typescript
eventBus.on('test-event', (data) => {
  throw new Error('Handler error');
  // Error will be caught and logged
  // Other handlers will still execute
});

eventBus.on('test-event', (data) => {
  console.log('This handler still runs');
});

eventBus.emit('test-event', {});
// Console output:
// Error in event handler for test-event: Error: Handler error
// This handler still runs
```

## Cleanup Pattern

Always clean up event subscriptions when components unmount:

```typescript
// React example
useEffect(() => {
  const handler = (data) => {
    console.log('Event received:', data);
  };

  eventBus.on('my-event', handler);

  // Cleanup on unmount
  return () => {
    eventBus.off('my-event', handler);
  };
}, []);
```

## Integration with SocketManager

The EventBus is used internally by the SocketManager to emit connection status events:

```typescript
import { socketManager } from '@viby/modules/realtime';

// The SocketManager uses EventBus internally
socketManager.eventBus.on('connection:status', ({ status }) => {
  console.log('Connection status:', status);
});
```

## Best Practices

1. **Use descriptive event names**: Use namespaced event names like `connection:status`, `game:started`, `listener:added`

2. **Clean up subscriptions**: Always unsubscribe when components unmount to prevent memory leaks

3. **Use once() for one-time events**: Use `once()` instead of `on()` for events that should only fire once

4. **Handle errors gracefully**: The EventBus catches errors, but ensure your handlers are robust

5. **Type your event data**: Use TypeScript interfaces for event data to ensure type safety

```typescript
interface ConnectionStatusEvent {
  status: 'connected' | 'disconnected' | 'reconnecting';
}

eventBus.on('connection:status', (data: ConnectionStatusEvent) => {
  console.log('Status:', data.status);
});
```
