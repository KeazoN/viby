import { RetryInterceptor } from './retry-interceptor';
import type { AxiosError, AxiosInstance } from 'axios';
import type { ExtendedAxiosRequestConfig } from '../types';

describe('RetryInterceptor', () => {
  let retryInterceptor: RetryInterceptor;
  let mockAxiosInstance: jest.Mocked<AxiosInstance>;

  beforeEach(() => {
    mockAxiosInstance = {
      request: jest.fn(),
    } as any;

    retryInterceptor = new RetryInterceptor(mockAxiosInstance, 3);
  });

  describe('handleError', () => {
    it('should retry on network error', async () => {
      const mockConfig: ExtendedAxiosRequestConfig = {
        url: '/test',
        method: 'GET',
      };

      const networkError = {
        config: mockConfig,
        message: 'Network Error',
        isAxiosError: true,
      } as AxiosError;

      mockAxiosInstance.request.mockResolvedValueOnce({ data: 'success' });

      await retryInterceptor.handleError(networkError);

      expect(mockConfig._retryCount).toBe(1);
      expect(mockAxiosInstance.request).toHaveBeenCalledWith(mockConfig);
    });

    it('should retry on 5xx server error', async () => {
      const mockConfig: ExtendedAxiosRequestConfig = {
        url: '/test',
        method: 'GET',
      };

      const serverError = {
        config: mockConfig,
        response: { status: 500 },
        isAxiosError: true,
      } as AxiosError;

      mockAxiosInstance.request.mockResolvedValueOnce({ data: 'success' });

      await retryInterceptor.handleError(serverError);

      expect(mockConfig._retryCount).toBe(1);
      expect(mockAxiosInstance.request).toHaveBeenCalledWith(mockConfig);
    });

    it('should not retry on 4xx client error', async () => {
      const mockConfig: ExtendedAxiosRequestConfig = {
        url: '/test',
        method: 'GET',
      };

      const clientError = {
        config: mockConfig,
        response: { status: 400 },
        isAxiosError: true,
      } as AxiosError;

      await expect(retryInterceptor.handleError(clientError)).rejects.toEqual(
        clientError
      );

      expect(mockAxiosInstance.request).not.toHaveBeenCalled();
    });

    it('should not retry on 401 error', async () => {
      const mockConfig: ExtendedAxiosRequestConfig = {
        url: '/test',
        method: 'GET',
      };

      const authError = {
        config: mockConfig,
        response: { status: 401 },
        isAxiosError: true,
      } as AxiosError;

      await expect(retryInterceptor.handleError(authError)).rejects.toEqual(
        authError
      );

      expect(mockAxiosInstance.request).not.toHaveBeenCalled();
    });

    it('should stop retrying after max retries', async () => {
      const mockConfig: ExtendedAxiosRequestConfig = {
        url: '/test',
        method: 'GET',
        _retryCount: 3,
      };

      const networkError = {
        config: mockConfig,
        message: 'Network Error',
        isAxiosError: true,
      } as AxiosError;

      await expect(retryInterceptor.handleError(networkError)).rejects.toEqual(
        networkError
      );

      expect(mockAxiosInstance.request).not.toHaveBeenCalled();
    });

    it('should use exponential backoff', async () => {
      const mockConfig: ExtendedAxiosRequestConfig = {
        url: '/test',
        method: 'GET',
      };

      const networkError = {
        config: mockConfig,
        message: 'Network Error',
        isAxiosError: true,
      } as AxiosError;

      const startTime = Date.now();
      mockAxiosInstance.request.mockResolvedValueOnce({ data: 'success' });

      await retryInterceptor.handleError(networkError);

      const duration = Date.now() - startTime;
      // First retry should wait ~1000ms
      expect(duration).toBeGreaterThanOrEqual(1000);
      expect(duration).toBeLessThan(2000);
    });

    it('should reject if config is missing', async () => {
      const error = {
        config: undefined,
        message: 'Error',
        isAxiosError: true,
      } as AxiosError;

      await expect(retryInterceptor.handleError(error)).rejects.toEqual(error);
    });
  });
});
