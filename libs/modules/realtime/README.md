# Realtime Module

The Realtime module provides robust WebSocket connection management for the Viby mobile application. It handles connection lifecycle, automatic reconnection with exponential backoff, event subscriptions, message queuing for offline mode, and latency monitoring.

## Features

- **SocketManager**: WebSocket connection manager with JWT authentication
- **EventBus**: Client-side event-driven communication system
- **ReconnectionStrategy**: Exponential backoff reconnection logic
- **Zustand Store**: Connection status and message queue state management
- **React Hooks**: Easy integration with React components

## Components

### SocketManager

The core WebSocket connection manager that handles:
- Connect/disconnect with JWT authentication
- Subscribe/unsubscribe for event handling
- Emit with offline message queuing
- Automatic reconnection with exponential backoff
- Heartbeat for latency measurement
- Subscription restoration on reconnect

See [SOCKET_MANAGER_USAGE.md](./SOCKET_MANAGER_USAGE.md) for detailed usage examples.

### EventBus

A lightweight event-driven communication system for module-level events:
- Subscribe to events with `on()`
- Unsubscribe from events with `off()`
- Emit events to all subscribers with `emit()`
- Subscribe to one-time events with `once()`

See [EVENTBUS_USAGE.md](./EVENTBUS_USAGE.md) for detailed usage examples.

### ReconnectionStrategy

Manages reconnection attempts with exponential backoff:
- 10 retry attempts with delays: 1s, 2s, 4s, 8s, 16s, 32s, 60s, 60s, 60s, 60s
- Reset on successful connection
- Check if retry should continue

### Realtime Store

Zustand store for connection state:
- `connectionStatus`: 'connected' | 'disconnected' | 'reconnecting'
- `latency`: Current WebSocket latency in milliseconds
- `messageQueue`: Queued messages for offline delivery

## Installation

The module is part of the NX monorepo and can be imported from `@viby/modules/realtime`.

## Quick Start

### Basic Connection

```typescript
import { socketManager } from '@viby/modules/realtime';
import { storageService } from '@viby/shared/storage';

// Connect to WebSocket server
const token = await storageService.getAccessToken();
await socketManager.connect(token);

// Subscribe to events
socketManager.subscribe('listener:added', (data) => {
  console.log('New listener:', data.listener);
});

// Emit events
socketManager.emit('game:answer', {
  roomId: 'room-123',
  answer: 'The Beatles',
});

// Disconnect
socketManager.disconnect();
```

### Using React Hooks

```typescript
import { useSocketConnection, useSocketEvent } from '@viby/modules/realtime';
import { storageService } from '@viby/shared/storage';

function MyComponent() {
  // Manage connection lifecycle
  const { connectionStatus, latency } = useSocketConnection({
    getToken: async () => await storageService.getAccessToken(),
    onConnect: () => console.log('Connected!'),
    onDisconnect: () => console.log('Disconnected!'),
  });

  // Subscribe to events
  useSocketEvent({
    event: 'listener:added',
    handler: (data) => {
      console.log('New listener:', data.listener);
    },
  });

  return (
    <View>
      <Text>Status: {connectionStatus}</Text>
      <Text>Latency: {latency}ms</Text>
    </View>
  );
}
```

## API Reference

### SocketManager

#### Methods

- `connect(token: string): Promise<void>` - Establish WebSocket connection with JWT authentication
- `disconnect(): void` - Disconnect from WebSocket server
- `subscribe(event: string, handler: EventHandler): void` - Subscribe to a WebSocket event
- `unsubscribe(event: string, handler: EventHandler): void` - Unsubscribe from a WebSocket event
- `emit(event: string, data: any): void` - Emit an event to the WebSocket server
- `getConnectionStatus(): ConnectionStatus` - Get current connection status
- `reconnect(): Promise<void>` - Manually trigger reconnection
- `getEventBus(): EventBus` - Get the event bus for module-level communication

### Hooks

#### useSocketConnection(options)

Manages WebSocket connection lifecycle with automatic connect/disconnect.

**Options:**
- `getToken: () => Promise<string | null>` - Function to get JWT token
- `autoConnect?: boolean` - Auto-connect on mount (default: true)
- `autoDisconnect?: boolean` - Auto-disconnect on unmount (default: true)
- `onConnect?: () => void` - Callback when connected
- `onDisconnect?: (reason?: string) => void` - Callback when disconnected
- `onError?: (error: Error) => void` - Callback on error
- `onReconnectionFailed?: (error: Error) => void` - Callback when reconnection fails

**Returns:**
- `connectionStatus: ConnectionStatus` - Current connection status
- `latency: number` - Current WebSocket latency
- `queuedMessageCount: number` - Number of queued messages
- `connect: () => Promise<void>` - Manually connect
- `disconnect: () => void` - Manually disconnect
- `reconnect: () => Promise<void>` - Manually reconnect

#### useSocketEvent(options)

Subscribes to a WebSocket event with automatic cleanup.

**Options:**
- `event: string` - Event name to subscribe to
- `handler: (data: T) => void` - Handler function
- `enabled?: boolean` - Whether to subscribe (default: true)

#### useSocketEmit()

Returns a memoized emit function for sending events.

**Returns:**
- `(event: string, data: any) => void` - Emit function

## Feature mapping

This module provides:

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

## Testing

Run tests with:

```bash
npm test -- libs/modules/realtime
```

## Architecture

```
realtime/
├── src/
│   ├── lib/
│   │   ├── socket-manager.ts       # WebSocket connection manager
│   │   ├── event-bus.ts            # Event-driven communication
│   │   ├── reconnection-strategy.ts # Reconnection logic
│   │   ├── stores/
│   │   │   └── realtime-store.ts   # Zustand store
│   │   └── hooks/
│   │       ├── use-socket-connection.ts
│   │       └── use-socket-event.ts
│   └── index.ts
├── SOCKET_MANAGER_USAGE.md
├── EVENTBUS_USAGE.md
└── README.md
```

## Best Practices

1. **Use the singleton instance**: Import `socketManager` from the module
2. **Clean up subscriptions**: Always unsubscribe in cleanup functions
3. **Handle reconnection**: Listen for connection status changes
4. **Provide fresh tokens**: Handle token requests during reconnection
5. **Use React hooks**: Prefer hooks for component integration
6. **Monitor latency**: Track WebSocket latency for performance monitoring

## License

MIT
