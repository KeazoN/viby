import AsyncStorage from '@react-native-async-storage/async-storage';
import { OfflineQueue, QueuedRequest } from './offline-queue';
import { useNetworkStore } from './stores/network-store';
import { httpClient } from './http-client';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('./http-client');
jest.mock('./stores/network-store');

describe('OfflineQueue', () => {
  let queue: OfflineQueue;
  const QUEUE_KEY = '@viby:offline_queue';

  beforeEach(() => {
    queue = new OfflineQueue();
    jest.clearAllMocks();
  });

  describe('init', () => {
    it('should load persisted queue from AsyncStorage', async () => {
      const mockQueue: QueuedRequest[] = [
        {
          id: '1',
          method: 'POST',
          url: '/api/test',
          data: { test: 'data' },
          timestamp: Date.now(),
          retryCount: 0,
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockQueue)
      );

      await queue.init();

      expect(AsyncStorage.getItem).toHaveBeenCalledWith(QUEUE_KEY);
      expect(queue.getQueueSize()).toBe(1);
    });

    it('should handle empty storage', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      await queue.init();

      expect(queue.getQueueSize()).toBe(0);
    });

    it('should handle storage errors gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      );

      await queue.init();

      expect(queue.getQueueSize()).toBe(0);
    });
  });

  describe('enqueue', () => {
    it('should add request to queue', async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await queue.enqueue({
        method: 'POST',
        url: '/api/test',
        data: { test: 'data' },
      });

      expect(queue.getQueueSize()).toBe(1);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should generate unique ID and timestamp', async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await queue.enqueue({
        method: 'POST',
        url: '/api/test',
      });

      const queuedRequests = queue.getQueue();
      expect(queuedRequests[0].id).toBeDefined();
      expect(queuedRequests[0].timestamp).toBeDefined();
      expect(queuedRequests[0].retryCount).toBe(0);
    });

    it('should persist queue to AsyncStorage', async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await queue.enqueue({
        method: 'POST',
        url: '/api/test',
      });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        QUEUE_KEY,
        expect.any(String)
      );
    });
  });

  describe('processQueue', () => {
    beforeEach(() => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    });

    it('should not process queue when offline', async () => {
      (useNetworkStore.getState as jest.Mock).mockReturnValue({
        isConnected: false,
        isInternetReachable: false,
      });

      await queue.enqueue({
        method: 'POST',
        url: '/api/test',
      });

      await queue.processQueue();

      expect(httpClient.post).not.toHaveBeenCalled();
      expect(queue.getQueueSize()).toBe(1);
    });

    it('should process queue when online', async () => {
      (useNetworkStore.getState as jest.Mock).mockReturnValue({
        isConnected: true,
        isInternetReachable: true,
      });
      (httpClient.post as jest.Mock).mockResolvedValue({});

      await queue.enqueue({
        method: 'POST',
        url: '/api/test',
        data: { test: 'data' },
      });

      await queue.processQueue();

      expect(httpClient.post).toHaveBeenCalledWith('/api/test', {
        test: 'data',
      });
      expect(queue.getQueueSize()).toBe(0);
    });

    it('should execute GET requests', async () => {
      (useNetworkStore.getState as jest.Mock).mockReturnValue({
        isConnected: true,
        isInternetReachable: true,
      });
      (httpClient.get as jest.Mock).mockResolvedValue({});

      await queue.enqueue({
        method: 'GET',
        url: '/api/test',
      });

      await queue.processQueue();

      expect(httpClient.get).toHaveBeenCalledWith('/api/test');
    });

    it('should execute PUT requests', async () => {
      (useNetworkStore.getState as jest.Mock).mockReturnValue({
        isConnected: true,
        isInternetReachable: true,
      });
      (httpClient.put as jest.Mock).mockResolvedValue({});

      await queue.enqueue({
        method: 'PUT',
        url: '/api/test',
        data: { test: 'data' },
      });

      await queue.processQueue();

      expect(httpClient.put).toHaveBeenCalledWith('/api/test', {
        test: 'data',
      });
    });

    it('should execute PATCH requests', async () => {
      (useNetworkStore.getState as jest.Mock).mockReturnValue({
        isConnected: true,
        isInternetReachable: true,
      });
      (httpClient.patch as jest.Mock).mockResolvedValue({});

      await queue.enqueue({
        method: 'PATCH',
        url: '/api/test',
        data: { test: 'data' },
      });

      await queue.processQueue();

      expect(httpClient.patch).toHaveBeenCalledWith('/api/test', {
        test: 'data',
      });
    });

    it('should execute DELETE requests', async () => {
      (useNetworkStore.getState as jest.Mock).mockReturnValue({
        isConnected: true,
        isInternetReachable: true,
      });
      (httpClient.delete as jest.Mock).mockResolvedValue({});

      await queue.enqueue({
        method: 'DELETE',
        url: '/api/test',
      });

      await queue.processQueue();

      expect(httpClient.delete).toHaveBeenCalledWith('/api/test');
    });

    it('should retry failed requests up to MAX_RETRY times', async () => {
      (useNetworkStore.getState as jest.Mock).mockReturnValue({
        isConnected: true,
        isInternetReachable: true,
      });
      (httpClient.post as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      await queue.enqueue({
        method: 'POST',
        url: '/api/test',
      });

      // First attempt
      await queue.processQueue();
      expect(queue.getQueueSize()).toBe(1);
      expect(queue.getQueue()[0].retryCount).toBe(1);

      // Second attempt
      await queue.processQueue();
      expect(queue.getQueueSize()).toBe(1);
      expect(queue.getQueue()[0].retryCount).toBe(2);

      // Third attempt
      await queue.processQueue();
      expect(queue.getQueueSize()).toBe(1);
      expect(queue.getQueue()[0].retryCount).toBe(3);

      // Fourth attempt - should be removed after max retries
      await queue.processQueue();
      expect(queue.getQueueSize()).toBe(0);
    });

    it('should process multiple requests in order', async () => {
      (useNetworkStore.getState as jest.Mock).mockReturnValue({
        isConnected: true,
        isInternetReachable: true,
      });
      (httpClient.post as jest.Mock).mockResolvedValue({});
      (httpClient.get as jest.Mock).mockResolvedValue({});

      await queue.enqueue({
        method: 'POST',
        url: '/api/test1',
      });
      await queue.enqueue({
        method: 'GET',
        url: '/api/test2',
      });

      await queue.processQueue();

      expect(httpClient.post).toHaveBeenCalledWith('/api/test1', undefined);
      expect(httpClient.get).toHaveBeenCalledWith('/api/test2');
      expect(queue.getQueueSize()).toBe(0);
    });

    it('should not process queue concurrently', async () => {
      (useNetworkStore.getState as jest.Mock).mockReturnValue({
        isConnected: true,
        isInternetReachable: true,
      });
      (httpClient.post as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      await queue.enqueue({
        method: 'POST',
        url: '/api/test',
      });

      // Start two concurrent process calls
      const promise1 = queue.processQueue();
      const promise2 = queue.processQueue();

      await Promise.all([promise1, promise2]);

      // Should only be called once
      expect(httpClient.post).toHaveBeenCalledTimes(1);
    });
  });

  describe('clear', () => {
    it('should clear queue and remove from storage', async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      await queue.enqueue({
        method: 'POST',
        url: '/api/test',
      });

      expect(queue.getQueueSize()).toBe(1);

      await queue.clear();

      expect(queue.getQueueSize()).toBe(0);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(QUEUE_KEY);
    });
  });

  describe('getQueueSize', () => {
    it('should return correct queue size', async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      expect(queue.getQueueSize()).toBe(0);

      await queue.enqueue({
        method: 'POST',
        url: '/api/test1',
      });
      expect(queue.getQueueSize()).toBe(1);

      await queue.enqueue({
        method: 'POST',
        url: '/api/test2',
      });
      expect(queue.getQueueSize()).toBe(2);
    });
  });

  describe('getQueue', () => {
    it('should return copy of queue', async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await queue.enqueue({
        method: 'POST',
        url: '/api/test',
      });

      const queueCopy = queue.getQueue();
      expect(queueCopy.length).toBe(1);

      // Modifying copy should not affect original
      queueCopy.push({
        id: 'test',
        method: 'GET',
        url: '/api/test2',
        timestamp: Date.now(),
        retryCount: 0,
      });

      expect(queue.getQueueSize()).toBe(1);
    });
  });

  describe('queue persistence after processing', () => {
    it('should persist failed requests back to queue', async () => {
      (useNetworkStore.getState as jest.Mock).mockReturnValue({
        isConnected: true,
        isInternetReachable: true,
      });
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
      (httpClient.post as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      await queue.enqueue({
        method: 'POST',
        url: '/api/test',
      });

      await queue.processQueue();

      // Request should still be in queue with incremented retry count
      expect(queue.getQueueSize()).toBe(1);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@viby:offline_queue',
        expect.any(String)
      );
    });

    it('should remove successful requests from persisted queue', async () => {
      (useNetworkStore.getState as jest.Mock).mockReturnValue({
        isConnected: true,
        isInternetReachable: true,
      });
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
      (httpClient.post as jest.Mock).mockResolvedValue({});

      await queue.enqueue({
        method: 'POST',
        url: '/api/test',
      });

      await queue.processQueue();

      // Queue should be empty and persisted as empty
      expect(queue.getQueueSize()).toBe(0);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@viby:offline_queue',
        '[]'
      );
    });
  });

  describe('queue order preservation', () => {
    it('should maintain FIFO order when processing', async () => {
      (useNetworkStore.getState as jest.Mock).mockReturnValue({
        isConnected: true,
        isInternetReachable: true,
      });
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
      (httpClient.post as jest.Mock).mockResolvedValue({});

      const callOrder: string[] = [];
      (httpClient.post as jest.Mock).mockImplementation((url: string) => {
        callOrder.push(url);
        return Promise.resolve({});
      });

      await queue.enqueue({
        method: 'POST',
        url: '/api/first',
      });
      await queue.enqueue({
        method: 'POST',
        url: '/api/second',
      });
      await queue.enqueue({
        method: 'POST',
        url: '/api/third',
      });

      await queue.processQueue();

      expect(callOrder).toEqual(['/api/first', '/api/second', '/api/third']);
    });

    it('should preserve order of failed requests in queue', async () => {
      (useNetworkStore.getState as jest.Mock).mockReturnValue({
        isConnected: true,
        isInternetReachable: true,
      });
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
      (httpClient.post as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      await queue.enqueue({
        method: 'POST',
        url: '/api/first',
      });
      await queue.enqueue({
        method: 'POST',
        url: '/api/second',
      });

      await queue.processQueue();

      const queuedRequests = queue.getQueue();
      expect(queuedRequests[0].url).toBe('/api/first');
      expect(queuedRequests[1].url).toBe('/api/second');
    });
  });

  describe('mixed success and failure', () => {
    it('should handle mix of successful and failed requests', async () => {
      (useNetworkStore.getState as jest.Mock).mockReturnValue({
        isConnected: true,
        isInternetReachable: true,
      });
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      // First request succeeds, second fails, third succeeds
      (httpClient.post as jest.Mock)
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({});

      await queue.enqueue({
        method: 'POST',
        url: '/api/success1',
      });
      await queue.enqueue({
        method: 'POST',
        url: '/api/fail',
      });
      await queue.enqueue({
        method: 'POST',
        url: '/api/success2',
      });

      await queue.processQueue();

      // Only failed request should remain
      expect(queue.getQueueSize()).toBe(1);
      expect(queue.getQueue()[0].url).toBe('/api/fail');
      expect(queue.getQueue()[0].retryCount).toBe(1);
    });

    it('should continue processing after a request fails', async () => {
      (useNetworkStore.getState as jest.Mock).mockReturnValue({
        isConnected: true,
        isInternetReachable: true,
      });
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const callOrder: string[] = [];
      (httpClient.post as jest.Mock).mockImplementation((url: string) => {
        callOrder.push(url);
        if (url === '/api/fail') {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({});
      });

      await queue.enqueue({
        method: 'POST',
        url: '/api/first',
      });
      await queue.enqueue({
        method: 'POST',
        url: '/api/fail',
      });
      await queue.enqueue({
        method: 'POST',
        url: '/api/third',
      });

      await queue.processQueue();

      // All requests should have been attempted
      expect(callOrder).toEqual(['/api/first', '/api/fail', '/api/third']);
      // Only failed request remains
      expect(queue.getQueueSize()).toBe(1);
      expect(queue.getQueue()[0].url).toBe('/api/fail');
    });
  });
});
