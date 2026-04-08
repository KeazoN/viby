# SocketManager Integration Example

This document shows how to integrate the SocketManager with other modules in the Viby application.

## App-Level Integration

### 1. Setup in App Root

```typescript
// apps/viby/src/app/App.tsx
import React, { useEffect } from 'react';
import { useSocketConnection } from '@viby/modules/realtime';
import { storageService } from '@viby/shared/storage';
import { useAuthStore } from '@viby/modules/auth';

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Setup WebSocket connection when authenticated
  const { connectionStatus, latency } = useSocketConnection({
    getToken: async () => {
      if (!isAuthenticated) return null;
      return await storageService.getAccessToken();
    },
    autoConnect: isAuthenticated,
    autoDisconnect: true,
    onConnect: () => {
      console.log('WebSocket connected');
    },
    onDisconnect: (reason) => {
      console.log('WebSocket disconnected:', reason);
    },
    onReconnectionFailed: (error) => {
      console.error('WebSocket reconnection failed:', error);
      // Show error UI to user
    },
  });

  return (
    <NavigationContainer>
      {/* Show connection indicator */}
      {connectionStatus === 'reconnecting' && <ReconnectingBanner />}
      
      {/* Your app navigation */}
      <RootNavigator />
    </NavigationContainer>
  );
}
```

## Module Integration Examples

### 2. Discovery Module Integration

```typescript
// libs/modules/discovery/src/lib/hooks/use-discovery-websocket.ts
import { useEffect } from 'react';
import { useSocketEvent } from '@viby/modules/realtime';
import { useDiscoveryStore } from '../stores/discovery-store';

export function useDiscoveryWebSocket() {
  const { addListener, removeListener, updateListenerCount } = useDiscoveryStore();

  // Subscribe to listener:added event
  useSocketEvent({
    event: 'listener:added',
    handler: (data: { listener: Listener }) => {
      addListener(data.listener);
    },
  });

  // Subscribe to listener:removed event
  useSocketEvent({
    event: 'listener:removed',
    handler: (data: { userId: string }) => {
      removeListener(data.userId);
    },
  });

  // Subscribe to listener:count event
  useSocketEvent({
    event: 'listener:count',
    handler: (data: { trackId: string; count: number }) => {
      updateListenerCount(data.trackId, data.count);
    },
  });
}
```

### 3. Game Module Integration

```typescript
// libs/modules/game/src/lib/hooks/use-game-websocket.ts
import { useEffect } from 'react';
import { useSocketEvent, useSocketEmit } from '@viby/modules/realtime';
import { useGameStore } from '../stores/game-store';

export function useGameWebSocket(roomId: string | null) {
  const { startGame, updateRound, updateScores, endGame } = useGameStore();
  const emit = useSocketEmit();

  // Subscribe to game events
  useSocketEvent({
    event: 'game:started',
    handler: (data: { game: GameSession }) => {
      startGame(data.game);
    },
    enabled: !!roomId,
  });

  useSocketEvent({
    event: 'game:round-start',
    handler: (data: { round: Round }) => {
      updateRound(data.round);
    },
    enabled: !!roomId,
  });

  useSocketEvent({
    event: 'game:scores-updated',
    handler: (data: { scores: Record<string, number> }) => {
      updateScores(data.scores);
    },
    enabled: !!roomId,
  });

  useSocketEvent({
    event: 'game:ended',
    handler: (data: { finalScores: Record<string, number> }) => {
      updateScores(data.finalScores);
      setTimeout(() => endGame(), 3000);
    },
    enabled: !!roomId,
  });

  // Return emit function for game actions
  return {
    submitAnswer: (answer: string) => {
      emit('game:answer', { roomId, answer });
    },
    leaveGame: () => {
      emit('game:leave', { roomId });
    },
  };
}
```

### 4. Chat Module Integration

```typescript
// libs/modules/chat/src/lib/hooks/use-chat-websocket.ts
import { useSocketEvent, useSocketEmit } from '@viby/modules/realtime';
import { useChatStore } from '../stores/chat-store';

export function useChatWebSocket(roomId: string | null) {
  const { addMessage, setTyping } = useChatStore();
  const emit = useSocketEmit();

  // Subscribe to chat:message event
  useSocketEvent({
    event: 'chat:message',
    handler: (data: { message: Message }) => {
      addMessage(roomId!, data.message);
    },
    enabled: !!roomId,
  });

  // Subscribe to chat:typing event
  useSocketEvent({
    event: 'chat:typing',
    handler: (data: { userId: string; isTyping: boolean }) => {
      setTyping(roomId!, data.userId, data.isTyping);
    },
    enabled: !!roomId,
  });

  // Return chat actions
  return {
    sendMessage: (content: string) => {
      emit('chat:message', { roomId, content });
    },
    sendTypingIndicator: (isTyping: boolean) => {
      emit('chat:typing', { roomId, isTyping });
    },
  };
}
```

## Connection Status UI

### 5. Connection Indicator Component

```typescript
// libs/shared/design-system/src/lib/components/ConnectionIndicator.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useRealtimeStore } from '@viby/modules/realtime';

export function ConnectionIndicator() {
  const connectionStatus = useRealtimeStore((state: any) => state.connectionStatus);
  const latency = useRealtimeStore((state: any) => state.latency);

  if (connectionStatus === 'connected') {
    return null; // Don't show anything when connected
  }

  return (
    <View className="bg-yellow-500 p-2">
      <Text className="text-center text-white font-semibold">
        {connectionStatus === 'reconnecting' 
          ? 'Reconnecting...' 
          : 'Disconnected'}
      </Text>
    </View>
  );
}
```

### 6. Latency Monitor Component

```typescript
// libs/shared/design-system/src/lib/components/LatencyMonitor.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useRealtimeStore } from '@viby/modules/realtime';

export function LatencyMonitor() {
  const latency = useRealtimeStore((state: any) => state.latency);
  const connectionStatus = useRealtimeStore((state: any) => state.connectionStatus);

  if (connectionStatus !== 'connected') {
    return null;
  }

  const getLatencyColor = () => {
    if (latency < 50) return 'text-green-500';
    if (latency < 100) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <View className="absolute top-2 right-2">
      <Text className={`text-xs ${getLatencyColor()}`}>
        {latency}ms
      </Text>
    </View>
  );
}
```

## Testing Integration

### 7. Mock SocketManager for Tests

```typescript
// libs/modules/realtime/src/lib/__mocks__/socket-manager.ts
export const mockSocketManager = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  emit: jest.fn(),
  getConnectionStatus: jest.fn(() => 'connected'),
  reconnect: jest.fn(),
  getEventBus: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    once: jest.fn(),
  })),
};

export const socketManager = mockSocketManager;
```

### 8. Test Example

```typescript
// libs/modules/discovery/src/lib/hooks/use-discovery-websocket.test.ts
import { renderHook } from '@testing-library/react-native';
import { useDiscoveryWebSocket } from './use-discovery-websocket';
import { socketManager } from '@viby/modules/realtime';

jest.mock('@viby/modules/realtime');

describe('useDiscoveryWebSocket', () => {
  it('should subscribe to listener events', () => {
    renderHook(() => useDiscoveryWebSocket());

    expect(socketManager.subscribe).toHaveBeenCalledWith(
      'listener:added',
      expect.any(Function)
    );
    expect(socketManager.subscribe).toHaveBeenCalledWith(
      'listener:removed',
      expect.any(Function)
    );
  });
});
```

## Best Practices

1. **Centralized Connection**: Manage connection at app root level
2. **Module-Specific Hooks**: Create hooks for each module's WebSocket needs
3. **Conditional Subscriptions**: Use `enabled` prop to control subscriptions
4. **Cleanup**: Hooks automatically handle cleanup on unmount
5. **Error Handling**: Show UI feedback for connection issues
6. **Testing**: Mock SocketManager for unit tests
