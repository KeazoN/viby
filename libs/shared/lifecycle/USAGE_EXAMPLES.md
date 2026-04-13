# App State Manager Usage Examples

## Basic Usage

### Initialize in App Root

```typescript
import { appStateManager } from '@viby/shared/lifecycle';

function App() {
  useEffect(() => {
    // Initialize app state manager
    appStateManager.initialize();

    // Cleanup on unmount
    return () => {
      appStateManager.cleanup();
    };
  }, []);

  return <RootNavigator />;
}
```

### Using the Hook

```typescript
import { useAppStateListener } from '@viby/shared/lifecycle';

function StatusIndicator() {
  const appState = useAppStateListener();

  return (
    <View>
      <Text>App State: {appState}</Text>
      {appState === 'background' && (
        <Text>App is in background</Text>
      )}
      {appState === 'active' && (
        <Text>App is active</Text>
      )}
    </View>
  );
}
```

### Using Transition Callbacks

```typescript
import { useAppStateTransitions } from '@viby/shared/lifecycle';

function DataSyncComponent() {
  const { refetch } = useCurrentlyPlayingQuery();

  useAppStateTransitions({
    onForeground: () => {
      console.log('App entered foreground - refreshing data');
      refetch();
    },
    onBackground: () => {
      console.log('App entered background - pausing operations');
      // Pause any ongoing operations
    },
  });

  return <View>...</View>;
}
```

## Advanced Usage

### Manual Subscription

```typescript
import { appStateManager } from '@viby/shared/lifecycle';

class MyService {
  private unsubscribe: (() => void) | null = null;

  start() {
    this.unsubscribe = appStateManager.subscribe((state) => {
      if (state === 'active') {
        this.resumeOperations();
      } else if (state === 'background') {
        this.pauseOperations();
      }
    });
  }

  stop() {
    this.unsubscribe?.();
  }

  private resumeOperations() {
    // Resume service operations
  }

  private pauseOperations() {
    // Pause service operations
  }
}
```

### Conditional Behavior Based on App State

```typescript
import { appStateManager } from '@viby/shared/lifecycle';

function performBackgroundTask() {
  const currentState = appStateManager.getCurrentState();

  if (currentState === 'background') {
    // Use reduced frequency or skip non-critical tasks
    console.log('App is in background, skipping non-critical task');
    return;
  }

  // Perform task normally
  console.log('Performing task in foreground');
}
```

## Integration with Other Modules

### With Query Hooks (Automatic Polling Adjustment)

The query hooks automatically adjust polling frequency based on app state:

```typescript
import { useCurrentlyPlayingQuery } from '@viby/shared/query';

function NowPlaying() {
  // Automatically polls every 5s in foreground, 30s in background
  const { data: currentlyPlaying } = useCurrentlyPlayingQuery();

  return (
    <View>
      {currentlyPlaying?.track && (
        <TrackCard track={currentlyPlaying.track} />
      )}
    </View>
  );
}
```

### With WebSocket (Automatic Reconnection)

The app state manager automatically handles WebSocket reconnection:

```typescript
import { useSocketConnection } from '@viby/modules/realtime';
import { storageService } from '@viby/shared/storage';

function RealtimeComponent() {
  // WebSocket automatically reconnects when app returns to foreground
  const { connectionStatus } = useSocketConnection({
    getToken: () => storageService.getAccessToken(),
    onConnect: () => console.log('Connected'),
    onDisconnect: () => console.log('Disconnected'),
  });

  return (
    <View>
      <Text>Connection: {connectionStatus}</Text>
    </View>
  );
}
```

### With Game Module (State Sync)

The app state manager automatically syncs game state when returning to foreground:

```typescript
import { useGameWebSocket } from '@viby/modules/game';
import { socketManager } from '@viby/modules/realtime';

function GameComponent({ roomId }: { roomId: string }) {
  const { activeGame } = useGameStore();

  useEffect(() => {
    // Listen for game state sync requests
    const eventBus = socketManager.getEventBus();

    const handleSyncRequest = ({ roomId: syncRoomId }: { roomId: string }) => {
      if (syncRoomId === roomId) {
        // Request current game state from server
        socketManager.emit('game:request-state', { roomId });
      }
    };

    eventBus.on('app:foreground:sync-game', handleSyncRequest);

    return () => {
      eventBus.off('app:foreground:sync-game', handleSyncRequest);
    };
  }, [roomId]);

  return <GameUI game={activeGame} />;
}
```

## Testing

### Mocking in Tests

```typescript
import { appStateManager } from '@viby/shared/lifecycle';

jest.mock('@viby/shared/lifecycle', () => ({
  appStateManager: {
    initialize: jest.fn(),
    cleanup: jest.fn(),
    getCurrentState: jest.fn(() => 'active'),
    subscribe: jest.fn(() => jest.fn()),
  },
}));

describe('MyComponent', () => {
  it('should initialize app state manager', () => {
    render(<MyComponent />);

    expect(appStateManager.initialize).toHaveBeenCalled();
  });
});
```

### Simulating State Changes in Tests

```typescript
import { AppState } from 'react-native';

describe('App State Behavior', () => {
  it('should handle background transition', async () => {
    const { result } = renderHook(() => useAppStateListener());

    // Simulate app going to background
    act(() => {
      const handler = (AppState.addEventListener as jest.Mock).mock.calls[0][1];
      handler('background');
    });

    expect(result.current).toBe('background');
  });
});
```

## Best Practices

### 1. Initialize Once at App Root

Always initialize the app state manager at the root of your app, not in individual components:

```typescript
// ✅ Good - Initialize in App.tsx
function App() {
  useEffect(() => {
    appStateManager.initialize();
    return () => appStateManager.cleanup();
  }, []);

  return <RootNavigator />;
}

// ❌ Bad - Don't initialize in multiple places
function MyComponent() {
  useEffect(() => {
    appStateManager.initialize(); // Don't do this!
  }, []);
}
```

### 2. Use Hooks for Component-Level Logic

Prefer using hooks over direct manager access in components:

```typescript
// ✅ Good - Use hooks
function MyComponent() {
  const appState = useAppStateListener();
  return <Text>{appState}</Text>;
}

// ❌ Less ideal - Direct manager access
function MyComponent() {
  const [appState, setAppState] = useState(appStateManager.getCurrentState());
  // Manual subscription management...
}
```

### 3. Clean Up Subscriptions

Always clean up subscriptions to prevent memory leaks:

```typescript
// ✅ Good - Clean up subscription
useEffect(() => {
  const unsubscribe = appStateManager.subscribe(handleStateChange);
  return () => unsubscribe();
}, []);

// ❌ Bad - No cleanup
useEffect(() => {
  appStateManager.subscribe(handleStateChange);
  // Missing cleanup!
}, []);
```

### 4. Handle Errors Gracefully

The app state manager handles errors internally, but you should still handle errors in your callbacks:

```typescript
useAppStateTransitions({
  onForeground: () => {
    try {
      // Your logic here
      refreshData();
    } catch (error) {
      console.error('Failed to refresh data:', error);
      // Handle error appropriately
    }
  },
});
```

## Troubleshooting

### WebSocket Not Reconnecting

If WebSocket doesn't reconnect when app returns to foreground:

1. Check that app state manager is initialized
2. Verify that `storageService.getAccessToken()` returns a valid token
3. Check console logs for reconnection errors

### Polling Not Adjusting

If polling frequency doesn't adjust based on app state:

1. Verify that query hooks are using `useAppState` internally
2. Check that `refetchInterval` is configured correctly
3. Ensure `refetchIntervalInBackground` is set to `true`

### Game State Not Syncing

If game state doesn't sync when returning to foreground:

1. Verify that game module is listening to `app:foreground:sync-game` event
2. Check that `activeGame` is properly set in game store
3. Ensure WebSocket is connected before emitting sync request
