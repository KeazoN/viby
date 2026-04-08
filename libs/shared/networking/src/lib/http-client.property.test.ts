import * as fc from 'fast-check';
import { HttpClient } from './http-client';
import { storageService } from '@viby/shared/storage';
import axios, { AxiosError } from 'axios';
import type { ExtendedAxiosRequestConfig } from './types';

/**
 * Property-Based Tests for HttpClient
 * 
 * These tests use fast-check to verify properties hold across many generated inputs.
 */

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock storage service
jest.mock('@viby/shared/storage', () => ({
  storageService: {
    getAccessToken: jest.fn(),
    getRefreshToken: jest.fn(),
    setAccessToken: jest.fn(),
    clearTokens: jest.fn(),
  },
}));

describe('HttpClient - Property-Based Tests', () => {
  let mockAxiosInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock axios instance
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: {
          use: jest.fn((onFulfilled) => {
            // Store the interceptor for testing
            mockAxiosInstance._requestInterceptors =
              mockAxiosInstance._requestInterceptors || [];
            mockAxiosInstance._requestInterceptors.push(onFulfilled);
            return mockAxiosInstance._requestInterceptors.length - 1;
          }),
        },
        response: {
          use: jest.fn((onFulfilled, onRejected) => {
            // Store the interceptor for testing
            mockAxiosInstance._responseInterceptors =
              mockAxiosInstance._responseInterceptors || [];
            mockAxiosInstance._responseInterceptors.push({
              onFulfilled,
              onRejected,
            });
            return mockAxiosInstance._responseInterceptors.length - 1;
          }),
        },
      },
      _requestInterceptors: [],
      _responseInterceptors: [],
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
  });

  /**
   * Property 3: Authorization Header Presence
   * 
   * For any authenticated API request, the HTTP client should include an 
   * Authorization header with a Bearer token.
   */
  describe('Property 3: Authorization Header Presence', () => {
    it('should include Authorization header with Bearer token for any authenticated request', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate JWT-like tokens
          fc.string({ minLength: 20, maxLength: 500 }),
          // Generate various HTTP methods
          fc.constantFrom('get', 'post', 'put', 'patch', 'delete'),
          // Generate API endpoints
          fc.string({ minLength: 1, maxLength: 100 }).map(s => `/${s}`),
          async (token, method, endpoint) => {
            // Setup: Mock storage to return the token
            (storageService.getAccessToken as jest.Mock).mockResolvedValue(token);

            // Create a new HTTP client
            const httpClient = new HttpClient({
              baseURL: 'http://test-api.com',
              enableLogging: false,
            });

            // Get the auth interceptor (second request interceptor)
            const authInterceptor = mockAxiosInstance._requestInterceptors[1];
            expect(authInterceptor).toBeDefined();

            // Create a mock request config
            const mockConfig: ExtendedAxiosRequestConfig = {
              url: endpoint,
              method: method.toUpperCase(),
              headers: {},
            };

            // Apply the auth interceptor
            const interceptedConfig = await authInterceptor(mockConfig);

            // Verify: Authorization header should be present with Bearer token
            expect(interceptedConfig.headers).toBeDefined();
            expect(interceptedConfig.headers.Authorization).toBe(`Bearer ${token}`);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not include Authorization header when no token is available', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('get', 'post', 'put', 'patch', 'delete'),
          fc.string({ minLength: 1, maxLength: 100 }).map(s => `/${s}`),
          async (method, endpoint) => {
            // Setup: Mock storage to return null (no token)
            (storageService.getAccessToken as jest.Mock).mockResolvedValue(null);

            // Create a new HTTP client
            const httpClient = new HttpClient({
              baseURL: 'http://test-api.com',
              enableLogging: false,
            });

            // Get the auth interceptor
            const authInterceptor = mockAxiosInstance._requestInterceptors[1];

            // Create a mock request config
            const mockConfig: ExtendedAxiosRequestConfig = {
              url: endpoint,
              method: method.toUpperCase(),
              headers: {},
            };

            // Apply the auth interceptor
            const interceptedConfig = await authInterceptor(mockConfig);

            // Verify: Authorization header should not be present
            expect(interceptedConfig.headers.Authorization).toBeUndefined();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 5: Retry with Exponential Backoff
   * 
   * For any API request that fails with a retryable error, the retry delays 
   * should follow exponential backoff pattern (1s, 2s, 4s) up to 3 attempts.
   */
  describe('Property 5: Retry with Exponential Backoff', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should retry with exponential backoff for network errors', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate API endpoints
          fc.string({ minLength: 1, maxLength: 100 }).map(s => `/${s}`),
          // Generate max retries (1-3)
          fc.integer({ min: 1, max: 3 }),
          async (endpoint, maxRetries) => {
            // Create HTTP client with specific max retries
            const httpClient = new HttpClient({
              baseURL: 'http://test-api.com',
              maxRetries,
              enableLogging: false,
            });

            // Get the retry interceptor (last response interceptor)
            const retryInterceptor =
              mockAxiosInstance._responseInterceptors[
                mockAxiosInstance._responseInterceptors.length - 1
              ];
            expect(retryInterceptor).toBeDefined();

            // Track retry delays
            const delays: number[] = [];
            const originalSetTimeout = global.setTimeout;

            // Mock setTimeout to capture delays
            jest.spyOn(global, 'setTimeout').mockImplementation(((
              callback: any,
              delay: number
            ) => {
              delays.push(delay);
              return originalSetTimeout(callback, 0) as any;
            }) as any);

            // Create a network error
            const mockConfig: ExtendedAxiosRequestConfig = {
              url: endpoint,
              method: 'GET',
              headers: {},
            };

            const networkError: Partial<AxiosError> = {
              config: mockConfig,
              message: 'Network Error',
              code: 'ECONNABORTED',
            };

            // Mock axios to keep failing
            mockAxiosInstance.mockRejectedValue(networkError);

            // Attempt to handle the error (will retry)
            try {
              await retryInterceptor.onRejected(networkError);
            } catch (error) {
              // Expected to fail after retries
            }

            // Fast-forward all timers
            jest.runAllTimers();

            // Verify: Delays should follow exponential backoff
            // Expected delays: 1000ms, 2000ms, 4000ms (for 3 retries)
            expect(delays.length).toBeLessThanOrEqual(maxRetries);
            
            for (let i = 0; i < delays.length; i++) {
              const expectedDelay = Math.min(1000 * Math.pow(2, i), 30000);
              expect(delays[i]).toBe(expectedDelay);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should retry with exponential backoff for 5xx server errors', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate 5xx status codes
          fc.integer({ min: 500, max: 599 }),
          // Generate API endpoints
          fc.string({ minLength: 1, maxLength: 100 }).map(s => `/${s}`),
          async (statusCode, endpoint) => {
            // Create HTTP client
            const httpClient = new HttpClient({
              baseURL: 'http://test-api.com',
              maxRetries: 3,
              enableLogging: false,
            });

            // Get the retry interceptor
            const retryInterceptor =
              mockAxiosInstance._responseInterceptors[
                mockAxiosInstance._responseInterceptors.length - 1
              ];

            // Track retry delays
            const delays: number[] = [];
            const originalSetTimeout = global.setTimeout;

            jest.spyOn(global, 'setTimeout').mockImplementation(((
              callback: any,
              delay: number
            ) => {
              delays.push(delay);
              return originalSetTimeout(callback, 0) as any;
            }) as any);

            // Create a 5xx error
            const mockConfig: ExtendedAxiosRequestConfig = {
              url: endpoint,
              method: 'GET',
              headers: {},
            };

            const serverError: Partial<AxiosError> = {
              config: mockConfig,
              response: {
                status: statusCode,
                data: {},
                statusText: 'Server Error',
                headers: {},
                config: mockConfig as any,
              },
              message: 'Server Error',
            };

            // Mock axios to keep failing
            mockAxiosInstance.mockRejectedValue(serverError);

            // Attempt to handle the error
            try {
              await retryInterceptor.onRejected(serverError);
            } catch (error) {
              // Expected to fail after retries
            }

            jest.runAllTimers();

            // Verify: Should have attempted retries with exponential backoff
            expect(delays.length).toBeGreaterThan(0);
            expect(delays.length).toBeLessThanOrEqual(3);

            // Verify exponential backoff pattern
            for (let i = 0; i < delays.length; i++) {
              const expectedDelay = Math.min(1000 * Math.pow(2, i), 30000);
              expect(delays[i]).toBe(expectedDelay);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should not retry 4xx client errors (except 401)', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate 4xx status codes excluding 401
          fc.integer({ min: 400, max: 499 }).filter(code => code !== 401),
          fc.string({ minLength: 1, maxLength: 100 }).map(s => `/${s}`),
          async (statusCode, endpoint) => {
            // Create HTTP client
            const httpClient = new HttpClient({
              baseURL: 'http://test-api.com',
              maxRetries: 3,
              enableLogging: false,
            });

            // Get the retry interceptor
            const retryInterceptor =
              mockAxiosInstance._responseInterceptors[
                mockAxiosInstance._responseInterceptors.length - 1
              ];

            // Track retry attempts
            let retryAttempts = 0;
            jest.spyOn(global, 'setTimeout').mockImplementation(((
              callback: any,
              delay: number
            ) => {
              retryAttempts++;
              return setTimeout(callback, 0) as any;
            }) as any);

            // Create a 4xx error
            const mockConfig: ExtendedAxiosRequestConfig = {
              url: endpoint,
              method: 'GET',
              headers: {},
            };

            const clientError: Partial<AxiosError> = {
              config: mockConfig,
              response: {
                status: statusCode,
                data: {},
                statusText: 'Client Error',
                headers: {},
                config: mockConfig as any,
              },
              message: 'Client Error',
            };

            // Attempt to handle the error
            try {
              await retryInterceptor.onRejected(clientError);
            } catch (error) {
              // Expected to fail immediately
            }

            jest.runAllTimers();

            // Verify: Should not retry 4xx errors
            expect(retryAttempts).toBe(0);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 24: Token Refresh on 401
   * 
   * For any API request that returns 401 Unauthorized, the Auth_Module should 
   * attempt token refresh before retrying the original request.
   */
  describe('Property 24: Token Refresh on 401', () => {
    it('should attempt token refresh on 401 error for any endpoint', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate API endpoints (excluding /auth/refresh)
          fc.string({ minLength: 1, maxLength: 100 })
            .filter(s => !s.includes('auth/refresh'))
            .map(s => `/${s}`),
          // Generate old and new tokens
          fc.string({ minLength: 20, maxLength: 500 }),
          fc.string({ minLength: 20, maxLength: 500 }),
          fc.string({ minLength: 20, maxLength: 500 }),
          async (endpoint, oldAccessToken, newAccessToken, refreshToken) => {
            // Ensure tokens are different
            fc.pre(oldAccessToken !== newAccessToken);

            // Setup: Mock storage
            (storageService.getRefreshToken as jest.Mock).mockResolvedValue(refreshToken);
            (storageService.setAccessToken as jest.Mock).mockResolvedValue(undefined);

            // Create HTTP client
            const httpClient = new HttpClient({
              baseURL: 'http://test-api.com',
              enableLogging: false,
            });

            // Get the token refresh interceptor (second response interceptor)
            const tokenRefreshInterceptor =
              mockAxiosInstance._responseInterceptors[1];
            expect(tokenRefreshInterceptor).toBeDefined();

            // Create a 401 error
            const mockConfig: ExtendedAxiosRequestConfig = {
              url: endpoint,
              method: 'GET',
              headers: {
                Authorization: `Bearer ${oldAccessToken}`,
              },
            };

            const unauthorizedError: Partial<AxiosError> = {
              config: mockConfig,
              response: {
                status: 401,
                data: { message: 'Unauthorized' },
                statusText: 'Unauthorized',
                headers: {},
                config: mockConfig as any,
              },
              message: 'Unauthorized',
            };

            // Mock the refresh endpoint to return new token
            mockAxiosInstance.post.mockResolvedValueOnce({
              data: { accessToken: newAccessToken },
            });

            // Mock the retry of original request to succeed
            mockAxiosInstance.mockResolvedValueOnce({
              data: { success: true },
            });

            // Handle the 401 error
            await tokenRefreshInterceptor.onRejected(unauthorizedError);

            // Verify: Should have called refresh endpoint
            expect(mockAxiosInstance.post).toHaveBeenCalledWith(
              '/auth/refresh',
              { refreshToken }
            );

            // Verify: Should have stored the new access token
            expect(storageService.setAccessToken).toHaveBeenCalledWith(newAccessToken);

            // Verify: Should have retried the original request with new token
            expect(mockAxiosInstance).toHaveBeenCalledWith(
              expect.objectContaining({
                url: endpoint,
                headers: expect.objectContaining({
                  Authorization: `Bearer ${newAccessToken}`,
                }),
              })
            );
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should clear tokens if refresh fails', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 })
            .filter(s => !s.includes('auth/refresh'))
            .map(s => `/${s}`),
          fc.string({ minLength: 20, maxLength: 500 }),
          async (endpoint, accessToken) => {
            // Setup: Mock storage with no refresh token
            (storageService.getRefreshToken as jest.Mock).mockResolvedValue(null);
            (storageService.clearTokens as jest.Mock).mockResolvedValue(undefined);

            // Create HTTP client
            const httpClient = new HttpClient({
              baseURL: 'http://test-api.com',
              enableLogging: false,
            });

            // Get the token refresh interceptor
            const tokenRefreshInterceptor =
              mockAxiosInstance._responseInterceptors[1];

            // Create a 401 error
            const mockConfig: ExtendedAxiosRequestConfig = {
              url: endpoint,
              method: 'GET',
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            };

            const unauthorizedError: Partial<AxiosError> = {
              config: mockConfig,
              response: {
                status: 401,
                data: { message: 'Unauthorized' },
                statusText: 'Unauthorized',
                headers: {},
                config: mockConfig as any,
              },
              message: 'Unauthorized',
            };

            // Handle the 401 error
            try {
              await tokenRefreshInterceptor.onRejected(unauthorizedError);
            } catch (error) {
              // Expected to fail
            }

            // Verify: Should have cleared tokens
            expect(storageService.clearTokens).toHaveBeenCalled();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should not retry /auth/refresh endpoint itself on 401', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 20, maxLength: 500 }),
          fc.string({ minLength: 20, maxLength: 500 }),
          async (accessToken, refreshToken) => {
            // Setup: Mock storage
            (storageService.clearTokens as jest.Mock).mockResolvedValue(undefined);

            // Create HTTP client
            const httpClient = new HttpClient({
              baseURL: 'http://test-api.com',
              enableLogging: false,
            });

            // Get the token refresh interceptor
            const tokenRefreshInterceptor =
              mockAxiosInstance._responseInterceptors[1];

            // Create a 401 error for the refresh endpoint itself
            const mockConfig: ExtendedAxiosRequestConfig = {
              url: '/auth/refresh',
              method: 'POST',
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
              data: { refreshToken },
            };

            const unauthorizedError: Partial<AxiosError> = {
              config: mockConfig,
              response: {
                status: 401,
                data: { message: 'Unauthorized' },
                statusText: 'Unauthorized',
                headers: {},
                config: mockConfig as any,
              },
              message: 'Unauthorized',
            };

            // Handle the 401 error
            try {
              await tokenRefreshInterceptor.onRejected(unauthorizedError);
            } catch (error) {
              // Expected to fail
            }

            // Verify: Should have cleared tokens
            expect(storageService.clearTokens).toHaveBeenCalled();

            // Verify: Should NOT have called post again (no retry)
            expect(mockAxiosInstance.post).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
