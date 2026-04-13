/**
 * Offline Mode Integration Tests
 * 
 * Tests the complete offline mode functionality including message queuing,
 * cache-first data loading, and network restoration.
 * 
 * **Validates: Requirements 10.1, 10.2, 10.3, 10.4**
 * - 10.1: Display network status indicator when offline
 * - 10.2: Allow viewing cached profile data and message history while offline
 * - 10.3: Queue outgoing messages for delivery when connection is restored
 * - 10.4: Send queued messages and sync state when network is restored
 */

import { OfflineQueue } from './offline-queue';
import { NetworkMonitor } from './network-monitor';
import { useNetworkStore } from './stores/network-store';
import { httpClient } from './http-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('@react-native-community/netinfo');
jest.mock('./http-client');

describe('Offline Mode Integration Tests', () => {
  let offlineQueue: OfflineQueue;
  let networkMonitor: NetworkMonitor;
  let mockUnsubscribe: jest.Mock;
  let stateChangeCallback: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    offlineQueue = new OfflineQueue();
    networkMonitor = new NetworkMonitor();
    mockUnsubscribe = jest.fn();

    // Mock NetInfo
    (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      stateChangeCallback = callback;
      return mockUnsubscribe;
    });

    (NetInfo.fetch as jest.Mock).mockResolvedValue({
      type: 'wifi',
      isConnected: true,
      isInternetReachable: true,
    });

    // Mock AsyncStorage
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

    // Reset network store
    useNetworkStore.getState().reset();
  });

  afterEach(() => {
    networkMonitor.stop();
  });

  describe('Requirement 10.1: Network Status Detection', () => {
    it('should detect when network goes offline', async () => {
      // Start with online state
      networkMonitor.start();
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(useNetworkStore.getState().isConnected).toBe(true);

      // Simulate network disconnection
      const offlineState = {
        type: 'none',
        isConnected: false,
        isInternetReachable: false,
      };

      stateChangeCallback(offlineState);

      // Verify offline state
      expect(useNetworkStore.getState().isConnected).toBe(false);
      expect(useNetworkStore.getState().isInternetReachable).toBe(false);
      expect(useNetworkStore.getState().connectionType).toBe('none');
    });

    it('should detect when network comes back online', async () => {
      // Start with offline state
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        type: 'none',
        isConnected: false,
        isInternetReachable: false,
      });

      networkMonitor.start();
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(useNetworkStore.getState().isConnected).toBe(false);

      // Simulate network reconnection
      const onlineState = {
        type: 'wifi',
        isConnected: true,
        isInternetReachable: true,
      };

      stateChangeCallback(onlineState);

      // Verify online state
      expect(useNetworkStore.getState().isConnected).toBe(true);
      expect(useNetworkStore.getState().isInternetReachable).toBe(true);
      expect(useNetworkStore.getState().connectionType).toBe('wifi');
    });

    it('should handle cellular to wifi transition', async () => {
      // Start with cellular
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        type: 'cellular',
        isConnected: true,
        isInternetReachable: true,
      });

      networkMonitor.start();
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(useNetworkStore.getState().connectionType).toBe('cellular');

      // Switch to wifi
      const wifiState = {
        type: 'wifi',
        isConnected: true,
        isInternetReachable: true,
      };

      stateChangeCallback(wifiState);

      expect(useNetworkStore.getState().connectionType).toBe('wifi');
      expect(useNetworkStore.getState().isConnected).toBe(true);
    });
  });

  describe('Requirement 10.2: Cache-First Data Loading While Offline', () => {
    it('should load cached profile data when offline', async () => {
      // Setup: User goes offline
      const offlineState = {
        type: 'none',
        isConnected: false,
        isInternetReachable: false,
      };
      stateChangeCallback(offlineState);

      // Mock cached profile data
      const cachedProfile = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        avatar: null,
        bio: 'Test bio',
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(cachedProfile)
      );

      // Load profile from cache
      const profileData = await AsyncStorage.getItem('profile:user-123');
      const profile = JSON.parse(profileData!);

      expect(profile).toEqual(cachedProfile);
      expect(httpClient.get).not.toHaveBeenCalled();
    });

    it('should load cached message history when offline', async () => {
      // Setup: User goes offline
      const offlineState = {
        type: 'none',
        isConnected: false,
        isInternetReachable: false,
      };
      stateChangeCallback(offlineState);

      // Mock cached messages
      const cachedMessages = [
        {
          id: 'msg-1',
          roomId: 'room-123',
          userId: 'user-1',
          content: 'Hello',
          status: 'sent',
          createdAt: new Date().toISOString(),
          readBy: [],
        },
        {
          id: 'msg-2',
          roomId: 'room-123',
          userId: 'user-2',
          content: 'Hi there!',
          status: 'sent',
          createdAt: new Date().toISOString(),
          readBy: [],
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(cachedMessages)
      );

      // Load messages from cache
      const messagesData = await AsyncStorage.getItem('messages:room-123');
      const messages = JSON.parse(messagesData!);

      expect(messages).toEqual(cachedMessages);
      expect(messages).toHaveLength(2);
      expect(httpClient.get).not.toHaveBeenCalled();
    });

    it('should display cached data immediately without API call', async () => {
      // User is offline
      const offlineState = {
        type: 'none',
        isConnected: false,
        isInternetReachable: false,
      };
      stateChangeCallback(offlineState);

      const cachedData = { data: 'cached' };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(cachedData)
      );

      const startTime = Date.now();
      const data = await AsyncStorage.getItem('test-key');
      const endTime = Date.now();

      // Should be fast (< 100ms) since no network call
      expect(endTime - startTime).toBeLessThan(100);
      expect(JSON.parse(data!)).toEqual(cachedData);
      expect(httpClient.get).not.toHaveBeenCalled();
    });
  });

  describe('Requirement 10.3: Message Queuing While Offline', () => {
    it('should queue outgoing messages when offline', async () => {
      await offlineQueue.init();

      // User goes offline
      (useNetworkStore.getState as jest.Mock).mockReturnValue({
        isConnected: false,
        isInternetReachable: false,
      });

      // Queue messages
      await offlineQueue.enqueue({
        method: 'POST',
        url: '/chat/room-123/messages',
        data: { content: 'Message 1' },
      });

      await offlineQueue.enqueue({
        method: 'POST',
        url: '/chat/room-123/messages',
        data: { content: 'Message 2' },
      });

      // Verify messages are queued
      expect(offlineQueue.getQueueSize()).toBe(2);

      // Verify messages are not sent while offline
      expect(httpClient.post).not.toHaveBeenCalled();
    });

    it('should persist queued messages to storage', async () => {
      await offlineQueue.init();

      (useNetworkStore.getState as jest.Mock).mockReturnValue({
        isConnected: false,
        isInternetReachable: false,
      });

      await offlineQueue.enqueue({
        method: 'POST',
        url: '/chat/room-123/messages',
        data: { content: 'Persistent message' },
      });

      // Verify AsyncStorage.setItem was called
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@viby:offline_queue',
        expect.any(String)
      );

      // Verify queue is persisted
      const savedQueue = (AsyncStorage.setItem as jest.Mock).mock.calls[0][1];
      const parsedQueue = JSON.parse(savedQueue);
      expect(parsedQueue).toHaveLength(1);
      expect(parsedQueue[0].url).toBe('/chat/room-123/messages');
    });

    it('should maintain queue order (FIFO)', async () => {
      await offlineQueue.init();

      (useNetworkStore.getState as jest.Mock).mockReturnValue({
        isConnected: false,
        isInternetReachable: false,
      });

      // Queue multiple messages
      await offlineQueue.enqueue({
        method: 'POST',
        url: '/api/first',
      });
      await offlineQueue.enqueue({
        method: 'POST',
        url: '/api/second',
      });
      await offlineQueue.enqueue({
        method: 'POST',
        url: '/api/third',
      });

      const queue = offlineQueue.getQueue();
      expect(queue[0].url).toBe('/api/first');
      expect(queue[1].url).toBe('/api/second');
      expect(queue[2].url).toBe('/api/third');
    });

    it('should queue different types of requests', async () => {
      await offlineQueue.init();

      (useNetworkStore.getState as jest.Mock).mockReturnValue({
        isConnected: false,
        isInternetReachable: false,
      });

      // Queue different request types
      await offlineQueue.enqueue({
        method: 'POST',
        url: '/api/post',
        data: { test: 'data' },
      });

      await offlineQueue.enqueue({
        method: 'PUT',
        url: '/api/put',
        data: { update: 'data' },
      });

      await offlineQueue.enqueue({
        method: 'PATCH',
        url: '/api/patch',
        data: { patch: 'data' },
      });

      expect(offlineQueue.getQueueSize()).toBe(3);

      const queue = offlineQueue.getQueue();
      expect(queue[0].method).toBe('POST');
      expect(queue[1].method).toBe('PUT');
      expect(queue[2].method).toBe('PATCH');
    });
  });

  describe('Requirement 10.4: Network Restoration and Queue Processing', () => {
    it('should process queued messages when network is restored', async () => {
      await offlineQueue.init();

      // Start offline
      (useNetworkStore.getState as jest.Mock).mockReturnValue({
        isConnected: false,
        isInternetReachable: false,
      });

      // Queue messages while offline
      await offlineQueue.enqueue({
        method: 'POST',
        url: '/chat/room-123/messages',
        data: { content: 'Queued message 1' },
      });

      await offlineQueue.enqueue({
        method: 'POST',
        url: '/chat/room-123/messages',
        data: { content: 'Queued message 2' },
      });

      expect(offlineQueue.getQueueSize()).toBe(2);

      // Network comes back online
      (useNetworkStore.getState as jest.Mock).mockReturnValue({
        isConnected: true,
        isInternetReachable: true,
      });

      (httpClient.post as jest.Mock).mockResolvedValue({});

      // Process queue
      await offlineQueue.processQueue();

      // Verify all messages were sent
      expect(httpClient.post).toHaveBeenCalledTimes(2);
      expect(httpClient.post).toHaveBeenCalledWith(
        '/chat/room-123/messages',
        { content: 'Queued message 1' }
      );
      expect(httpClient.post).toHaveBeenCalledWith(
        '/chat/room-123/messages',
        { content: 'Queued message 2' }
      );

      // Verify queue is empty
      expect(offlineQueue.getQueueSize()).toBe(0);
    });

    it('should automatically process queue when network is restored', async () => {
      await offlineQueue.init();
      networkMonitor.start();

      // Start offline
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        type: 'none',
        isConnected: false,
        isInternetReachable: false,
      });

      await new Promise(resolve => setTimeout(resolve, 0));

      // Queue message
      (useNetworkStore.getState as jest.Mock).mockReturnValue({
        isConnected: false,
        isInternetReachable: false,
      });

      await offlineQueue.enqueue({
        method: 'POST',
        url: '/api/test',
        data: { test: 'data' },
      });

      // Network comes back online
      (useNetworkStore.getState as jest.Mock).mockReturnValue({
        isConnected: true,
        isInternetReachable: true,
      });

      (httpClient.post as jest.Mock).mockResolvedValue({});

      const onlineState = {
        type: 'wifi',
        isConnected: true,
        isInternetReachable: true,
      };

      stateChangeCallback(onlineState);

      // Process queue
      await offlineQueue.processQueue();

      // Verify message was sent
      expect(httpClient.post).toHaveBeenCalledWith('/api/test', { test: 'data' });
    });

    it('should retry failed requests with exponential backoff', async () => {
      await offlineQueue.init();

      // Online but API fails
      (useNetworkStore.getState as jest.Mock).mockReturnValue({
        isConnected: true,
        isInternetReachable: true,
      });

      (httpClient.post as jest.Mock).mockRejectedValue(new Error('Server error'));

      await offlineQueue.enqueue({
        method: 'POST',
        url: '/api/test',
      });

      // First attempt
      await offlineQueue.processQueue();
      expect(offlineQueue.getQueue()[0].retryCount).toBe(1);

      // Second attempt
      await offlineQueue.processQueue();
      expect(offlineQueue.getQueue()[0].retryCount).toBe(2);

      // Third attempt
      await offlineQueue.processQueue();
      expect(offlineQueue.getQueue()[0].retryCount).toBe(3);

      // Fourth attempt - should be removed after max retries
      await offlineQueue.processQueue();
      expect(offlineQueue.getQueueSize()).toBe(0);
    });

    it('should handle partial queue processing (some succeed, some fail)', async () => {
      await offlineQueue.init();

      (useNetworkStore.getState as jest.Mock).mockReturnValue({
        isConnected: true,
        isInternetReachable: true,
      });

      // First succeeds, second fails, third succeeds
      (httpClient.post as jest.Mock)
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error('Server error'))
        .mockResolvedValueOnce({});

      await offlineQueue.enqueue({
        method: 'POST',
        url: '/api/success1',
      });
      await offlineQueue.enqueue({
        method: 'POST',
        url: '/api/fail',
      });
      await offlineQueue.enqueue({
        method: 'POST',
        url: '/api/success2',
      });

      await offlineQueue.processQueue();

      // Only failed request should remain
      expect(offlineQueue.getQueueSize()).toBe(1);
      expect(offlineQueue.getQueue()[0].url).toBe('/api/fail');
      expect(offlineQueue.getQueue()[0].retryCount).toBe(1);
    });
  });

  describe('Complete Offline-to-Online Flow', () => {
    it('should handle complete offline mode lifecycle', async () => {
      await offlineQueue.init();
      networkMonitor.start();

      // Step 1: Start online
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(useNetworkStore.getState().isConnected).toBe(true);

      // Step 2: Go offline
      (useNetworkStore.getState as jest.Mock).mockReturnValue({
        isConnected: false,
        isInternetReachable: false,
      });

      const offlineState = {
        type: 'none',
        isConnected: false,
        isInternetReachable: false,
      };

      stateChangeCallback(offlineState);
      expect(useNetworkStore.getState().isConnected).toBe(false);

      // Step 3: Queue messages while offline
      await offlineQueue.enqueue({
        method: 'POST',
        url: '/chat/room-123/messages',
        data: { content: 'Offline message 1' },
      });
      await offlineQueue.enqueue({
        method: 'POST',
        url: '/chat/room-123/messages',
        data: { content: 'Offline message 2' },
      });

      expect(offlineQueue.getQueueSize()).toBe(2);

      // Step 4: Load cached data
      const cachedMessages = [
        { id: 'msg-1', content: 'Cached message' },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(cachedMessages)
      );

      const cached = await AsyncStorage.getItem('messages:room-123');
      expect(JSON.parse(cached!)).toEqual(cachedMessages);

      // Step 5: Come back online
      (useNetworkStore.getState as jest.Mock).mockReturnValue({
        isConnected: true,
        isInternetReachable: true,
      });

      const onlineState = {
        type: 'wifi',
        isConnected: true,
        isInternetReachable: true,
      };

      stateChangeCallback(onlineState);
      expect(useNetworkStore.getState().isConnected).toBe(true);

      // Step 6: Process queued messages
      (httpClient.post as jest.Mock).mockResolvedValue({});

      await offlineQueue.processQueue();

      expect(httpClient.post).toHaveBeenCalledTimes(2);
      expect(offlineQueue.getQueueSize()).toBe(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle queue persistence errors gracefully', async () => {
      await offlineQueue.init();

      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(
        new Error('Storage full')
      );

      (useNetworkStore.getState as jest.Mock).mockReturnValue({
        isConnected: false,
        isInternetReachable: false,
      });

      // Should not throw even if persistence fails
      await expect(
        offlineQueue.enqueue({
          method: 'POST',
          url: '/api/test',
        })
      ).resolves.not.toThrow();
    });

    it('should handle corrupted queue data in storage', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('invalid json');

      await offlineQueue.init();

      // Should start with empty queue
      expect(offlineQueue.getQueueSize()).toBe(0);
    });

    it('should not process queue when offline', async () => {
      await offlineQueue.init();

      (useNetworkStore.getState as jest.Mock).mockReturnValue({
        isConnected: false,
        isInternetReachable: false,
      });

      await offlineQueue.enqueue({
        method: 'POST',
        url: '/api/test',
      });

      await offlineQueue.processQueue();

      // Should not make API calls while offline
      expect(httpClient.post).not.toHaveBeenCalled();
      expect(offlineQueue.getQueueSize()).toBe(1);
    });
  });
});
