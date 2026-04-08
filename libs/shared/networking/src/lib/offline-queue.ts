import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNetworkStore } from './stores/network-store';
import { httpClient } from './http-client';

export interface QueuedRequest {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  data?: any;
  timestamp: number;
  retryCount: number;
}

/**
 * OfflineQueue manages failed HTTP requests when the device is offline.
 * It persists requests to AsyncStorage and automatically processes them
 * when network connectivity is restored.
 */
export class OfflineQueue {
  private queue: QueuedRequest[] = [];
  private readonly QUEUE_KEY = '@viby:offline_queue';
  private readonly MAX_RETRY = 3;
  private isProcessing = false;

  /**
   * Initialize the queue by loading persisted requests from AsyncStorage
   */
  async init(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to initialize offline queue:', error);
      this.queue = [];
    }
  }

  /**
   * Add a request to the queue
   */
  async enqueue(
    request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retryCount'>
  ): Promise<void> {
    const queuedRequest: QueuedRequest = {
      ...request,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.queue.push(queuedRequest);
    await this.persist();
  }

  /**
   * Process all queued requests when network is available
   */
  async processQueue(): Promise<void> {
    const { isConnected, isInternetReachable } = useNetworkStore.getState();

    if (!isConnected || !isInternetReachable) {
      return;
    }

    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      const requests = [...this.queue];
      this.queue = [];

      for (const request of requests) {
        try {
          await this.executeRequest(request);
        } catch (error) {
          if (request.retryCount < this.MAX_RETRY) {
            request.retryCount++;
            this.queue.push(request);
          } else {
            console.error('Request failed after max retries:', request, error);
          }
        }
      }

      await this.persist();
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Clear all queued requests
   */
  async clear(): Promise<void> {
    this.queue = [];
    await AsyncStorage.removeItem(this.QUEUE_KEY);
  }

  /**
   * Get the current queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Get all queued requests (for debugging/testing)
   */
  getQueue(): QueuedRequest[] {
    return [...this.queue];
  }

  /**
   * Execute a queued request using the HTTP client
   */
  private async executeRequest(request: QueuedRequest): Promise<void> {
    switch (request.method) {
      case 'GET':
        await httpClient.get(request.url);
        break;
      case 'POST':
        await httpClient.post(request.url, request.data);
        break;
      case 'PUT':
        await httpClient.put(request.url, request.data);
        break;
      case 'PATCH':
        await httpClient.patch(request.url, request.data);
        break;
      case 'DELETE':
        await httpClient.delete(request.url);
        break;
    }
  }

  /**
   * Persist the queue to AsyncStorage
   */
  private async persist(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to persist offline queue:', error);
    }
  }
}

// Export singleton instance
export const offlineQueue = new OfflineQueue();
