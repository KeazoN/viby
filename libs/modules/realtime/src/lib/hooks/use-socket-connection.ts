import { useEffect, useCallback } from 'react';
import { socketManager } from '../socket-manager';
import { useRealtimeStore } from '../stores/realtime-store';
import type { ConnectionStatus } from '../stores/realtime-store';

export interface UseSocketConnectionOptions {
  /**
   * Function to get the JWT token for authentication
   */
  getToken: () => Promise<string | null>;
  
  /**
   * Whether to automatically connect on mount
   * @default true
   */
  autoConnect?: boolean;
  
  /**
   * Whether to automatically disconnect on unmount
   * @default true
   */
  autoDisconnect?: boolean;
  
  /**
   * Callback when connection is established
   */
  onConnect?: () => void;
  
  /**
   * Callback when connection is lost
   */
  onDisconnect?: (reason?: string) => void;
  
  /**
   * Callback when connection error occurs
   */
  onError?: (error: Error) => void;
  
  /**
   * Callback when reconnection fails after max attempts
   */
  onReconnectionFailed?: (error: Error) => void;
}

export interface UseSocketConnectionReturn {
  /**
   * Current connection status
   */
  connectionStatus: ConnectionStatus;
  
  /**
   * Current WebSocket latency in milliseconds
   */
  latency: number;
  
  /**
   * Number of queued messages waiting to be sent
   */
  queuedMessageCount: number;
  
  /**
   * Manually connect to WebSocket server
   */
  connect: () => Promise<void>;
  
  /**
   * Manually disconnect from WebSocket server
   */
  disconnect: () => void;
  
  /**
   * Manually trigger reconnection
   */
  reconnect: () => Promise<void>;
}

/**
 * React hook for managing WebSocket connection lifecycle
 * 
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { connectionStatus, latency, connect, disconnect } = useSocketConnection({
 *     getToken: async () => await storageService.getAccessToken(),
 *     onConnect: () => console.log('Connected!'),
 *     onDisconnect: () => console.log('Disconnected!'),
 *   });
 * 
 *   return (
 *     <View>
 *       <Text>Status: {connectionStatus}</Text>
 *       <Text>Latency: {latency}ms</Text>
 *     </View>
 *   );
 * }
 * ```
 */
export function useSocketConnection(
  options: UseSocketConnectionOptions
): UseSocketConnectionReturn {
  const {
    getToken,
    autoConnect = true,
    autoDisconnect = true,
    onConnect,
    onDisconnect,
    onError,
    onReconnectionFailed,
  } = options;

  const connectionStatus = useRealtimeStore((state: any) => state.connectionStatus);
  const latency = useRealtimeStore((state: any) => state.latency);
  const queuedMessageCount = useRealtimeStore((state: any) => state.messageQueue.length);

  const connect = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }
      await socketManager.connect(token);
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      throw error;
    }
  }, [getToken]);

  const disconnect = useCallback(() => {
    socketManager.disconnect();
  }, []);

  const reconnect = useCallback(async () => {
    try {
      await socketManager.reconnect();
    } catch (error) {
      console.error('Failed to reconnect to WebSocket:', error);
      throw error;
    }
  }, []);

  // Setup event listeners
  useEffect(() => {
    const eventBus = socketManager.getEventBus();

    // Handle connection status changes
    const handleConnectionStatus = ({ status, error, reason }: any) => {
      if (status === 'connected' && onConnect) {
        onConnect();
      } else if (status === 'disconnected' && onDisconnect) {
        onDisconnect(reason);
      }
      
      if (error && onError) {
        onError(error);
      }
    };

    // Handle reconnection failures
    const handleReconnectionFailed = ({ error }: any) => {
      if (onReconnectionFailed) {
        onReconnectionFailed(error);
      }
    };

    // Handle token requests during reconnection
    const handleTokenRequest = async () => {
      const token = await getToken();
      eventBus.emit('reconnection:token', { token });
    };

    eventBus.on('connection:status', handleConnectionStatus);
    eventBus.on('reconnection:failed', handleReconnectionFailed);
    eventBus.on('reconnection:request-token', handleTokenRequest);

    return () => {
      eventBus.off('connection:status', handleConnectionStatus);
      eventBus.off('reconnection:failed', handleReconnectionFailed);
      eventBus.off('reconnection:request-token', handleTokenRequest);
    };
  }, [getToken, onConnect, onDisconnect, onError, onReconnectionFailed]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect().catch((error) => {
        console.error('Auto-connect failed:', error);
      });
    }

    // Auto-disconnect on unmount
    return () => {
      if (autoDisconnect) {
        disconnect();
      }
    };
  }, [autoConnect, autoDisconnect, connect, disconnect]);

  return {
    connectionStatus,
    latency,
    queuedMessageCount,
    connect,
    disconnect,
    reconnect,
  };
}
