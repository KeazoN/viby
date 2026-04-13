import { io, Socket } from 'socket.io-client';
import { EventBus } from './event-bus';
import { ReconnectionStrategy } from './reconnection-strategy';
import { useRealtimeStore } from './stores/realtime-store';
import { ErrorTracker } from '@viby/shared/monitoring';
import { analyticsService, AnalyticsEvent, analyticsTracker } from '@viby/shared/analytics';
import type { ConnectionStatus } from './stores/realtime-store';

type EventHandler = (data: any) => void;

/**
 * SocketManager manages WebSocket connection lifecycle, event subscriptions,
 * reconnection with exponential backoff, and message queuing for offline mode.
 * 
 * Features:
 * - Connect/disconnect with JWT authentication
 * - Subscribe/unsubscribe for event handling
 * - Emit with offline message queuing
 * - Automatic reconnection with exponential backoff
 * - Heartbeat for latency measurement
 * - Subscription restoration on reconnect
 * - Error tracking with Sentry
 * 
 * Implements requirements 8.1-8.10
 */
export class SocketManager {
  private socket: Socket | null = null;
  private eventBus: EventBus;
  private reconnectionStrategy: ReconnectionStrategy;
  private subscriptions: Map<string, Set<EventHandler>> = new Map();
  private isIntentionalDisconnect: boolean = false;
  private lastPingTime: number = 0;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private baseUrl: string;
  private connectionStartTime: number = 0;

  constructor(baseUrl?: string) {
    this.eventBus = new EventBus();
    this.reconnectionStrategy = new ReconnectionStrategy();
    // Use environment variable if available, otherwise default to localhost
    const envUrl = typeof globalThis !== 'undefined' && (globalThis as any).process?.env?.EXPO_PUBLIC_WS_URL;
    this.baseUrl = baseUrl || envUrl || 'http://localhost:3000';
  }

  /**
   * Establish WebSocket connection with JWT authentication
   * @param token - JWT access token for authentication
   */
  async connect(token: string): Promise<void> {
    if (this.socket?.connected) {
      return;
    }

    this.isIntentionalDisconnect = false;
    this.connectionStartTime = Date.now();

    this.socket = io(this.baseUrl, {
      auth: { token },
      transports: ['websocket'],
      reconnection: false, // We handle reconnection manually
      timeout: 10000,
    });

    this.setupEventHandlers();

    return new Promise((resolve, reject) => {
      this.socket!.once('connect', () => {
        useRealtimeStore.getState().setConnectionStatus('connected');
        this.reconnectionStrategy.reset();
        this.resubscribeAll();
        this.processMessageQueue();
        this.eventBus.emit('connection:status', { status: 'connected' });
        
        // Track WebSocket connection with analytics tracker
        analyticsService.trackEvent(AnalyticsEvent.WEBSOCKET_CONNECTED, {
          timestamp: Date.now(),
          reconnect_attempts: this.reconnectionStrategy.getAttempts(),
        });
        
        resolve();
      });

      this.socket!.once('connect_error', (error: Error) => {
        useRealtimeStore.getState().setConnectionStatus('disconnected');
        this.eventBus.emit('connection:status', { status: 'disconnected', error });
        
        // Track WebSocket connection error with analytics tracker
        analyticsTracker.error.trackWebSocketError('connect_error', error.message);
        
        reject(error);
      });
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.isIntentionalDisconnect = true;
    this.stopHeartbeat();
    this.socket?.disconnect();
    this.socket = null;
    useRealtimeStore.getState().setConnectionStatus('disconnected');
    this.eventBus.emit('connection:status', { status: 'disconnected' });
  }

  /**
   * Subscribe to a WebSocket event
   * @param event - Event name to subscribe to
   * @param handler - Handler function to call when event is received
   */
  subscribe(event: string, handler: EventHandler): void {
    if (!this.subscriptions.has(event)) {
      this.subscriptions.set(event, new Set());
    }
    this.subscriptions.get(event)!.add(handler);

    // Subscribe to socket event if connected
    if (this.socket?.connected) {
      this.socket.on(event, handler);
    }
  }

  /**
   * Unsubscribe from a WebSocket event
   * @param event - Event name to unsubscribe from
   * @param handler - Handler function to remove
   */
  unsubscribe(event: string, handler: EventHandler): void {
    const handlers = this.subscriptions.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.subscriptions.delete(event);
      }
    }

    this.socket?.off(event, handler);
  }

  /**
   * Emit an event to the WebSocket server
   * If offline, queues the message for later delivery
   * @param event - Event name to emit
   * @param data - Data to send with the event
   */
  emit(event: string, data: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      // Queue message for later delivery
      useRealtimeStore.getState().queueMessage({
        event,
        data,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return useRealtimeStore.getState().connectionStatus;
  }

  /**
   * Attempt to reconnect to the WebSocket server
   * Uses exponential backoff strategy
   */
  async reconnect(): Promise<void> {
    if (!this.reconnectionStrategy.shouldRetry()) {
      const error = new Error('Max reconnection attempts reached');
      this.eventBus.emit('reconnection:failed', { error });
      throw error;
    }

    useRealtimeStore.getState().setConnectionStatus('reconnecting');
    this.eventBus.emit('connection:status', { status: 'reconnecting' });

    const delay = this.reconnectionStrategy.getNextDelay();
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Get token from storage - this should be provided by the caller
    // For now, we'll emit an event to request a new token
    return new Promise((resolve, reject) => {
      this.eventBus.once('reconnection:token', async ({ token }) => {
        if (!token) {
          reject(new Error('No access token available'));
          return;
        }

        try {
          await this.connect(token);
          resolve();
        } catch (error) {
          // Retry recursively
          try {
            await this.reconnect();
            resolve();
          } catch (retryError) {
            reject(retryError);
          }
        }
      });

      // Request token from auth module
      this.eventBus.emit('reconnection:request-token', {});
    });
  }

  /**
   * Get the event bus for module-level communication
   */
  getEventBus(): EventBus {
    return this.eventBus;
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('disconnect', (reason: string) => {
      const connectionDuration = Date.now() - this.connectionStartTime;
      useRealtimeStore.getState().setConnectionStatus('disconnected');
      this.eventBus.emit('connection:status', { status: 'disconnected', reason });
      this.stopHeartbeat();

      // Track disconnection with analytics tracker
      analyticsTracker.error.trackWebSocketDisconnection(reason, connectionDuration);

      if (!this.isIntentionalDisconnect) {
        // Track unexpected disconnection
        ErrorTracker.trackWebSocketError(
          new Error(`WebSocket disconnected: ${reason}`),
          {
            connectionStatus: 'disconnected',
            reconnectAttempts: this.reconnectionStrategy.getAttempts(),
          }
        );

        // Attempt reconnection
        this.reconnect().catch((error) => {
          console.error('Reconnection failed:', error);
          ErrorTracker.trackWebSocketError(error as Error, {
            connectionStatus: 'failed',
            reconnectAttempts: this.reconnectionStrategy.getAttempts(),
          });
        });
      }
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('Connection error:', error);
      useRealtimeStore.getState().setConnectionStatus('disconnected');
      this.eventBus.emit('connection:error', { error });

      // Track connection errors with analytics tracker
      analyticsTracker.error.trackWebSocketError('connect_error', error.message);
      
      ErrorTracker.trackWebSocketError(error, {
        connectionStatus: 'error',
        reconnectAttempts: this.reconnectionStrategy.getAttempts(),
      });
    });

    // Heartbeat for latency measurement
    this.socket.on('pong', () => {
      const latency = Date.now() - this.lastPingTime;
      useRealtimeStore.getState().setLatency(latency);

      // Track WebSocket latency with analytics tracker
      analyticsTracker.performance.trackWebSocketLatency(latency);

      if (latency > 100) {
        console.warn(`High WebSocket latency: ${latency}ms`);
      }
    });

    // Start heartbeat
    this.startHeartbeat();
  }

  /**
   * Start heartbeat interval for latency measurement
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.lastPingTime = Date.now();
        this.socket.emit('ping');
      }
    }, 5000);
  }

  /**
   * Stop heartbeat interval
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Resubscribe to all events after reconnection
   */
  private resubscribeAll(): void {
    this.subscriptions.forEach((handlers, event) => {
      handlers.forEach((handler) => {
        this.socket?.on(event, handler);
      });
    });
  }

  /**
   * Process queued messages after reconnection
   */
  private processMessageQueue(): void {
    const queue = useRealtimeStore.getState().messageQueue;
    queue.forEach(({ event, data }: { event: string; data: any }) => {
      this.emit(event, data);
    });
    useRealtimeStore.getState().clearQueue();
  }
}

// Singleton instance
export const socketManager = new SocketManager();
