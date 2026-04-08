# SocketManager Usage Guide

The `SocketManager` class provides a robust WebSocket connection manager with automatic reconnection, message queuing, and event subscription management.

## Features

- **JWT Authentication**: Secure WebSocket connections with JWT tokens
- **Automatic Reconnection**: Exponential backoff strategy with up to 10 retry attempts
- **Message Queuing**: Offline message queuing for delivery when connection is restored
- **Event Subscriptions**: Subscribe/unsubscribe to WebSocket events with automatic restoration on reconnect
- **Heartbeat Monitoring**: Latency measurement with ping/pong heartbeat
- **Connection Status**: Real-time connection status updates via Zustand store

## Basic Usage

### Connecting to WebSocket Server

```typescript
import { socketManager } from '@viby/modules/realtime';
import { storageService } from '@viby/shared/storage';

// Get JWT token from storage
const token = await storageService.getAccessToken();

// Connect to WebSocket server
try {
  await socketManager.connect(token);
  console.log('Connected to WebSocket server');
} catch (error) {
  console.error('Failed to connect:', error);
}
```

### Subscribing to Events

```typescript
import { socketManager } from '@viby/modules/realtime';

// Define event handler
const handleListenerAdded = (data: { listener: Listener }) => {
  console.log('New listener added:', data.listener);
  // Update your UI or state
};

// Subscribe to event
socketManager.subscribe('listener:added', handleListenerAdded);

// Unsubscribe when component unmounts
socketManager.unsubscribe('listener:added', handleListenerAdded);
```

### Emitting Events

```typescript
import { socketManager } from '@viby/modules/realtime';

// Emit event to server
socketManager.emit('game:answer', {
  roomId: 'room-123',
  answer: 'The Beatles',
});

// If offline, message will be queued and sent when connection is restored
```

### Monitoring Connection Status

```typescript
import { useRealtimeStore } from '@viby/modules/realtime';

function ConnectionIndicator() {
  const connectionStatus = useRealtimeStore((state) => state.connectionStatus);
  const latency = useRealtimeStore((state) => state.latency);

  return (
    <View>
      <Text>Status: {connectionStatus}</Text>
      {connectionStatus === 'connected' && (
        <Text>Latency: {latency}ms</Text>
      )}
    </View>
  );
}
```

### Disconnecting

```typescript
import { socketManager } from '@viby/modules/realtime';

// Disconnect from server (e.g., on logout)
socketManager.disconnect();
```

## Advanced Usage

### Using Event Bus for Module Communication

The SocketManager includes an internal EventBus for module-level communication:

```typescript
import { socketManager } from '@viby/modules/realtime';

// Get event bus
const eventBus = socketManager.getEventBus();

// Listen for connection status changes
eventBus.on('connection:status', ({ status, error }) => {
  console.log('Connection status changed:', status);
  if (error) {
    console.error('Connection error:', error);
  }
});

// Listen for reconnection failures
eventBus.on('reconnection:failed', ({ error }) => {
  console.error('Reconnection failed after max attempts:', error);
  // Show error UI to user
});
```

### Handling Reconnection with Token Refresh

The SocketManager emits events when it needs a new token for reconnection:

```typescript
import { socketManager } from '@viby/modules/realtime';
import { storageService } from '@viby/shared/storage';

// Listen for token requests during reconnection
const eventBus = socketManager.getEventBus();

eventBus.on('reconnection:request-token', async () => {
  // Get fresh token from storage
  const token = await storageService.getAccessToken();
  
  // Provide token for reconnection
  eventBus.emit('reconnection:token', { token });
});
```

### React Hook Example

```typescript
import { useEffect } from 'react';
import { socketManager } from '@viby/modules/realtime';
import { useRealtimeStore } from '@viby/modules/realtime';

export function useWebSocketConnection() {
  const connectionStatus = useRealtimeStore((state) => state.connectionStatus);

  useEffect(() => {
    // Connect on mount
    const connect = async () => {
      const token = await storageService.getAccessToken();
      if (token) {
        try {
          await socketManager.connect(token);
        } catch (error) {
          console.error('Failed to connect:', error);
        }
      }
    };

    connect();

    // Disconnect on unmount
    return () => {
      socketManager.disconnect();
    };
  }, []);

  return { connectionStatus };
}
```

### Discovery Module Integration Example

```typescript
import { useEffect } from 'react';
import { socketManager } from '@viby/modules/realtime';
import { useDiscoveryStore } from '@viby/modules/discovery';

export function useDiscoveryWebSocket() {
  const { addListener, removeListener, updateListenerCount } = useDiscoveryStore();

  useEffect(() => {
    // Subscribe to listener events
    const handleListenerAdded = (data: { listener: Listener }) => {
      addListener(data.listener);
    };

    const handleListenerRemoved = (data: { userId: string }) => {
      removeListener(data.userId);
    };

    const handleListenerCount = (data: { trackId: string; count: number }) => {
      updateListenerCount(data.trackId, data.count);
    };

    socketManager.subscribe('listener:added', handleListenerAdded);
    socketManager.subscribe('listener:removed', handleListenerRemoved);
    socketManager.subscribe('listener:count', handleListenerCount);

    // Cleanup subscriptions
    return () => {
      socketManager.unsubscribe('listener:added', handleListenerAdded);
      socketManager.unsubscribe('listener:removed', handleListenerRemoved);
      socketManager.unsubscribe('listener:count', handleListenerCount);
    };
  }, [addListener, removeListener, updateListenerCount]);
}
```

## Connection Lifecycle

1. **Initial Connection**: Call `connect(token)` with JWT token
2. **Connected**: Connection established, subscriptions restored, queued messages sent
3. **Disconnected**: Connection lost (network issue, server restart, etc.)
4. **Reconnecting**: Automatic reconnection with exponential backoff
5. **Reconnected**: Connection restored, subscriptions restored, queued messages sent
6. **Failed**: Max reconnection attempts reached (10 attempts)

## Reconnection Strategy

The SocketManager uses exponential backoff for reconnection:

- Attempt 1: 1 second delay
- Attempt 2: 2 seconds delay
- Attempt 3: 4 seconds delay
- Attempt 4: 8 seconds delay
- Attempt 5: 16 seconds delay
- Attempt 6: 32 seconds delay
- Attempts 7-10: 60 seconds delay each

After 10 failed attempts, reconnection stops and a `reconnection:failed` event is emitted.

## Message Queue

When the WebSocket connection is offline, emitted messages are automatically queued in the Zustand store. When the connection is restored, all queued messages are sent in order.

```typescript
// This message will be queued if offline
socketManager.emit('chat:message', {
  roomId: 'room-123',
  content: 'Hello!',
});

// When connection is restored, the message is automatically sent
```

## Heartbeat and Latency

The SocketManager sends a `ping` message every 5 seconds and measures the latency based on the `pong` response. The latency is stored in the Zustand store and can be accessed via `useRealtimeStore`.

```typescript
const latency = useRealtimeStore((state) => state.latency);

if (latency > 100) {
  console.warn('High latency detected:', latency);
}
```

## Best Practices

1. **Single Instance**: Use the singleton `socketManager` instance throughout your app
2. **Cleanup Subscriptions**: Always unsubscribe in cleanup functions (useEffect return)
3. **Handle Reconnection**: Listen for connection status changes and update UI accordingly
4. **Token Management**: Provide fresh tokens during reconnection via event bus
5. **Error Handling**: Handle connection errors and show appropriate UI to users
6. **Offline Support**: Rely on message queuing for offline functionality

## Feature mapping

This implementation covers:

- **8.1**: Establish WebSocket connection on app launch
- **8.2**: Authenticate WebSocket connection using JWT tokens
- **8.3**: Attempt reconnection with exponential backoff when connection drops
- **8.4**: Retry reconnection up to 10 times with specified delays
- **8.5**: Resubscribe to all active event channels on reconnection
- **8.6**: Request state recovery for active sessions on reconnection
- **8.7**: Emit connection status events to all modules
- **8.8**: Measure WebSocket message latency and log high latency
- **8.9**: Display error and offer manual retry after max reconnection attempts
- **8.10**: Handle WebSocket heartbeat messages to detect connection health
