import * as fc from 'fast-check';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OfflineQueue, QueuedRequest } from './offline-queue';
import { useNetworkStore } from './stores/network-store';
import { httpClient } from './http-client';

/**
 * Property-Based Tests for OfflineQueue
 * 
 * These tests use fast-check to verify properties hold across many generated inputs.
 */

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('./http-client');
jest.mock('./stores/network-store');

describe('OfflineQueue - Property-Based Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Arbitraries for generating test data
  const httpMethodArb = fc.constantFrom('GET', 'POST', 'PUT', 'PATCH', 'DELETE');
  const urlArb = fc.string({ minLength: 1, maxLength: 100 }).map(s => `/api/${s}`);
  const dataArb = fc.oneof(
    fc.constant(undefined),
    fc.record({
      id: fc.string(),
      value: fc.anything(),
    })
  );

  const queuedRequestArb = fc.record({
    method: httpMethodArb,
    url: urlArb,
    data: dataArb,
  });

  /**
   * Property 23: Offline Message Queuing
   * 
   * For any message sent while offline, the message should be added to the 
   * offline queue and sent when network connectivity is restored.
   */
  describe('Property 23: Offline Message Queuing', () => {
    it('should enqueue any request and persist to storage', async () => {
      await fc.assert(
        fc.asyncProperty(
          queuedRequestArb,
          async (request) => {
            // Setup
            (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
            const queue = new OfflineQueue();

            // Execute
            await queue.enqueue(request);

            // Verify: Request should be in queue
            expect(queue.getQueueSize()).toBe(1);

            // Verify: Should persist to AsyncStorage
            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
              '@viby:offline_queue',
              expect.any(String)
            );

            // Verify: Queued request should have required fields
            const queuedRequests = queue.getQueue();
            expect(queuedRequests[0]).toMatchObject({
              method: request.method,
              url: request.url,
              data: request.data,
            });
            expect(queuedRequests[0].id).toBeDefined();
            expect(queuedRequests[0].timestamp).toBeDefined();
            expect(queuedRequests[0].retryCount).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should process all queued requests when network is restored', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(queuedRequestArb, { minLength: 1, maxLength: 10 }),
          async (requests) => {
            // Setup: Network is online
            (useNetworkStore.getState as jest.Mock).mockReturnValue({
              isConnected: true,
              isInternetReachable: true,
            });
            (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
            (httpClient.get as jest.Mock).mockResolvedValue({});
            (httpClient.post as jest.Mock).mockResolvedValue({});
            (httpClient.put as jest.Mock).mockResolvedValue({});
            (httpClient.patch as jest.Mock).mockResolvedValue({});
            (httpClient.delete as jest.Mock).mockResolvedValue({});

            const queue = new OfflineQueue();

            // Enqueue all requests
            for (const request of requests) {
              await queue.enqueue(request);
            }

            expect(queue.getQueueSize()).toBe(requests.length);

            // Execute: Process queue
            await queue.processQueue();

            // Verify: All requests should be processed
            expect(queue.getQueueSize()).toBe(0);

            // Verify: Each request should have been executed
            for (const request of requests) {
              switch (request.method) {
                case 'GET':
                  expect(httpClient.get).toHaveBeenCalledWith(request.url);
                  break;
                case 'POST':
                  expect(httpClient.post).toHaveBeenCalledWith(request.url, request.data);
                  break;
                case 'PUT':
                  expect(httpClient.put).toHaveBeenCalledWith(request.url, request.data);
                  break;
                case 'PATCH':
                  expect(httpClient.patch).toHaveBeenCalledWith(request.url, request.data);
                  break;
                case 'DELETE':
                  expect(httpClient.delete).toHaveBeenCalledWith(request.url);
                  break;
              }
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should not process queue when offline', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(queuedRequestArb, { minLength: 1, maxLength: 5 }),
          async (requests) => {
            // Setup: Network is offline
            (useNetworkStore.getState as jest.Mock).mockReturnValue({
              isConnected: false,
              isInternetReachable: false,
            });
            (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

            const queue = new OfflineQueue();

            // Enqueue all requests
            for (const request of requests) {
              await queue.enqueue(request);
            }

            const initialSize = queue.getQueueSize();

            // Execute: Try to process queue
            await queue.processQueue();

            // Verify: Queue should remain unchanged
            expect(queue.getQueueSize()).toBe(initialSize);
            expect(httpClient.get).not.toHaveBeenCalled();
            expect(httpClient.post).not.toHaveBeenCalled();
            expect(httpClient.put).not.toHaveBeenCalled();
            expect(httpClient.patch).not.toHaveBeenCalled();
            expect(httpClient.delete).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should retry failed requests up to MAX_RETRY times', async () => {
      await fc.assert(
        fc.asyncProperty(
          queuedRequestArb,
          async (request) => {
            // Setup: Network is online but requests fail
            (useNetworkStore.getState as jest.Mock).mockReturnValue({
              isConnected: true,
              isInternetReachable: true,
            });
            (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

            // Mock all HTTP methods to fail
            const error = new Error('Network error');
            (httpClient.get as jest.Mock).mockRejectedValue(error);
            (httpClient.post as jest.Mock).mockRejectedValue(error);
            (httpClient.put as jest.Mock).mockRejectedValue(error);
            (httpClient.patch as jest.Mock).mockRejectedValue(error);
            (httpClient.delete as jest.Mock).mockRejectedValue(error);

            const queue = new OfflineQueue();

            // Enqueue request
            await queue.enqueue(request);

            // Process queue 4 times (initial + 3 retries)
            for (let i = 0; i < 4; i++) {
              await queue.processQueue();
            }

            // Verify: After 4 attempts (initial + 3 retries), queue should be empty
            expect(queue.getQueueSize()).toBe(0);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should maintain queue order during processing', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(queuedRequestArb, { minLength: 2, maxLength: 10 }),
          async (requests) => {
            // Setup: Network is online
            (useNetworkStore.getState as jest.Mock).mockReturnValue({
              isConnected: true,
              isInternetReachable: true,
            });
            (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

            // Track execution order
            const executionOrder: string[] = [];

            (httpClient.get as jest.Mock).mockImplementation((url: string) => {
              executionOrder.push(url);
              return Promise.resolve({});
            });
            (httpClient.post as jest.Mock).mockImplementation((url: string) => {
              executionOrder.push(url);
              return Promise.resolve({});
            });
            (httpClient.put as jest.Mock).mockImplementation((url: string) => {
              executionOrder.push(url);
              return Promise.resolve({});
            });
            (httpClient.patch as jest.Mock).mockImplementation((url: string) => {
              executionOrder.push(url);
              return Promise.resolve({});
            });
            (httpClient.delete as jest.Mock).mockImplementation((url: string) => {
              executionOrder.push(url);
              return Promise.resolve({});
            });

            const queue = new OfflineQueue();

            // Enqueue all requests
            for (const request of requests) {
              await queue.enqueue(request);
            }

            // Execute: Process queue
            await queue.processQueue();

            // Verify: Execution order should match enqueue order
            const expectedOrder = requests.map(r => r.url);
            expect(executionOrder).toEqual(expectedOrder);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle concurrent enqueue operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(queuedRequestArb, { minLength: 2, maxLength: 10 }),
          async (requests) => {
            // Setup
            (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
            const queue = new OfflineQueue();

            // Execute: Enqueue all requests concurrently
            await Promise.all(
              requests.map(request => queue.enqueue(request))
            );

            // Verify: All requests should be in queue
            expect(queue.getQueueSize()).toBe(requests.length);

            // Verify: Each request should have unique ID
            const queuedRequests = queue.getQueue();
            const ids = queuedRequests.map(r => r.id);
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(requests.length);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should restore queue from storage on init', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(queuedRequestArb, { minLength: 1, maxLength: 10 }),
          async (requests) => {
            // Setup: Create persisted queue data
            const persistedQueue: QueuedRequest[] = requests.map((req, index) => ({
              id: `${Date.now()}-${index}`,
              method: req.method,
              url: req.url,
              data: req.data,
              timestamp: Date.now(),
              retryCount: 0,
            }));

            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
              JSON.stringify(persistedQueue)
            );

            const queue = new OfflineQueue();

            // Execute: Initialize queue
            await queue.init();

            // Verify: Queue should be restored
            expect(queue.getQueueSize()).toBe(requests.length);

            const restoredQueue = queue.getQueue();
            for (let i = 0; i < requests.length; i++) {
              expect(restoredQueue[i]).toMatchObject({
                method: requests[i].method,
                url: requests[i].url,
                data: requests[i].data,
              });
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should clear all queued requests', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(queuedRequestArb, { minLength: 1, maxLength: 10 }),
          async (requests) => {
            // Setup
            (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
            (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
            const queue = new OfflineQueue();

            // Enqueue all requests
            for (const request of requests) {
              await queue.enqueue(request);
            }

            expect(queue.getQueueSize()).toBeGreaterThan(0);

            // Execute: Clear queue
            await queue.clear();

            // Verify: Queue should be empty
            expect(queue.getQueueSize()).toBe(0);
            expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@viby:offline_queue');
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle partial failures during queue processing', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(queuedRequestArb, { minLength: 3, maxLength: 10 }),
          fc.integer({ min: 0, max: 2 }), // Index of request that will fail
          async (requests, failIndex) => {
            // Ensure we have enough requests
            fc.pre(requests.length > failIndex);

            // Setup: Network is online
            (useNetworkStore.getState as jest.Mock).mockReturnValue({
              isConnected: true,
              isInternetReachable: true,
            });
            (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

            let callCount = 0;
            const mockImplementation = () => {
              const currentCall = callCount++;
              if (currentCall === failIndex) {
                return Promise.reject(new Error('Network error'));
              }
              return Promise.resolve({});
            };

            (httpClient.get as jest.Mock).mockImplementation(mockImplementation);
            (httpClient.post as jest.Mock).mockImplementation(mockImplementation);
            (httpClient.put as jest.Mock).mockImplementation(mockImplementation);
            (httpClient.patch as jest.Mock).mockImplementation(mockImplementation);
            (httpClient.delete as jest.Mock).mockImplementation(mockImplementation);

            const queue = new OfflineQueue();

            // Enqueue all requests
            for (const request of requests) {
              await queue.enqueue(request);
            }

            // Execute: Process queue
            await queue.processQueue();

            // Verify: Failed request should still be in queue (with retryCount = 1)
            expect(queue.getQueueSize()).toBe(1);
            expect(queue.getQueue()[0].retryCount).toBe(1);
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should queue messages while offline and send them when connectivity is restored', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(queuedRequestArb, { minLength: 1, maxLength: 10 }),
          async (requests) => {
            // Setup: Start offline
            (useNetworkStore.getState as jest.Mock).mockReturnValue({
              isConnected: false,
              isInternetReachable: false,
            });
            (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
            (httpClient.get as jest.Mock).mockResolvedValue({});
            (httpClient.post as jest.Mock).mockResolvedValue({});
            (httpClient.put as jest.Mock).mockResolvedValue({});
            (httpClient.patch as jest.Mock).mockResolvedValue({});
            (httpClient.delete as jest.Mock).mockResolvedValue({});

            const queue = new OfflineQueue();

            // Phase 1: Enqueue requests while offline
            for (const request of requests) {
              await queue.enqueue(request);
            }

            // Verify: All requests should be queued
            expect(queue.getQueueSize()).toBe(requests.length);

            // Verify: Processing should not happen while offline
            await queue.processQueue();
            expect(queue.getQueueSize()).toBe(requests.length);
            expect(httpClient.get).not.toHaveBeenCalled();
            expect(httpClient.post).not.toHaveBeenCalled();

            // Phase 2: Connectivity is restored
            (useNetworkStore.getState as jest.Mock).mockReturnValue({
              isConnected: true,
              isInternetReachable: true,
            });

            // Execute: Process queue now that we're online
            await queue.processQueue();

            // Verify: All requests should be processed and queue should be empty
            expect(queue.getQueueSize()).toBe(0);

            // Verify: Each request should have been executed
            for (const request of requests) {
              switch (request.method) {
                case 'GET':
                  expect(httpClient.get).toHaveBeenCalledWith(request.url);
                  break;
                case 'POST':
                  expect(httpClient.post).toHaveBeenCalledWith(request.url, request.data);
                  break;
                case 'PUT':
                  expect(httpClient.put).toHaveBeenCalledWith(request.url, request.data);
                  break;
                case 'PATCH':
                  expect(httpClient.patch).toHaveBeenCalledWith(request.url, request.data);
                  break;
                case 'DELETE':
                  expect(httpClient.delete).toHaveBeenCalledWith(request.url);
                  break;
              }
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should persist queued requests across app restarts', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(queuedRequestArb, { minLength: 1, maxLength: 10 }),
          async (requests) => {
            // Setup: Network is offline
            (useNetworkStore.getState as jest.Mock).mockReturnValue({
              isConnected: false,
              isInternetReachable: false,
            });

            let persistedData: string | null = null;
            (AsyncStorage.setItem as jest.Mock).mockImplementation(async (key: string, value: string) => {
              persistedData = value;
            });
            (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) => {
              return persistedData;
            });

            // Phase 1: First app session - enqueue requests
            const queue1 = new OfflineQueue();
            await queue1.init();

            for (const request of requests) {
              await queue1.enqueue(request);
            }

            expect(queue1.getQueueSize()).toBe(requests.length);

            // Phase 2: Simulate app restart - create new queue instance
            const queue2 = new OfflineQueue();
            await queue2.init();

            // Verify: Queue should be restored from storage
            expect(queue2.getQueueSize()).toBe(requests.length);

            const restoredQueue = queue2.getQueue();
            for (let i = 0; i < requests.length; i++) {
              expect(restoredQueue[i]).toMatchObject({
                method: requests[i].method,
                url: requests[i].url,
                data: requests[i].data,
              });
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
