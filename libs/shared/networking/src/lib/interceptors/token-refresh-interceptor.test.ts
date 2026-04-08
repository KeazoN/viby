import { TokenRefreshInterceptor } from './token-refresh-interceptor';
import { storageService } from '@viby/shared/storage';
import type { AxiosError, AxiosInstance } from 'axios';
import type { ExtendedAxiosRequestConfig } from '../types';

jest.mock('@viby/shared/storage', () => ({
  storageService: {
    getRefreshToken: jest.fn(),
    setAccessToken: jest.fn(),
    clearTokens: jest.fn(),
  },
}));

describe('TokenRefreshInterceptor', () => {
  let tokenRefreshInterceptor: TokenRefreshInterceptor;
  let mockAxiosInstance: jest.Mocked<AxiosInstance>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAxiosInstance = {
      post: jest.fn(),
      request: jest.fn(),
    } as any;

    tokenRefreshInterceptor = new TokenRefreshInterceptor(mockAxiosInstance);
  });

  describe('handleError', () => {
    it('should not handle non-401 errors', async () => {
      const mockConfig: ExtendedAxiosRequestConfig = {
        url: '/test',
        method: 'GET',
        headers: {},
      };

      const error = {
        config: mockConfig,
        response: { status: 500 },
        isAxiosError: true,
      } as AxiosError;

      await expect(tokenRefreshInterceptor.handleError(error)).rejects.toEqual(
        error
      );

      expect(mockAxiosInstance.post).not.toHaveBeenCalled();
    });

    it('should refresh token and retry request on 401', async () => {
      const mockConfig: ExtendedAxiosRequestConfig = {
        url: '/test',
        method: 'GET',
        headers: {},
      };

      const error = {
        config: mockConfig,
        response: { status: 401 },
        isAxiosError: true,
      } as AxiosError;

      const mockRefreshToken = 'refresh-token';
      const mockNewAccessToken = 'new-access-token';

      (storageService.getRefreshToken as jest.Mock).mockResolvedValue(
        mockRefreshToken
      );
      mockAxiosInstance.post.mockResolvedValue({
        data: { accessToken: mockNewAccessToken },
      });
      mockAxiosInstance.request.mockResolvedValue({ data: 'success' });

      await tokenRefreshInterceptor.handleError(error);

      expect(storageService.getRefreshToken).toHaveBeenCalled();
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/refresh', {
        refreshToken: mockRefreshToken,
      });
      expect(storageService.setAccessToken).toHaveBeenCalledWith(
        mockNewAccessToken
      );
      expect(mockConfig._retry).toBe(true);
      expect(mockConfig.headers?.Authorization).toBe(
        `Bearer ${mockNewAccessToken}`
      );
      expect(mockAxiosInstance.request).toHaveBeenCalledWith(mockConfig);
    });

    it('should not retry if already retried', async () => {
      const mockConfig: ExtendedAxiosRequestConfig = {
        url: '/test',
        method: 'GET',
        headers: {},
        _retry: true,
      };

      const error = {
        config: mockConfig,
        response: { status: 401 },
        isAxiosError: true,
      } as AxiosError;

      await expect(tokenRefreshInterceptor.handleError(error)).rejects.toEqual(
        error
      );

      expect(storageService.clearTokens).toHaveBeenCalled();
      expect(mockAxiosInstance.post).not.toHaveBeenCalled();
    });

    it('should not retry refresh endpoint itself', async () => {
      const mockConfig: ExtendedAxiosRequestConfig = {
        url: '/auth/refresh',
        method: 'POST',
        headers: {},
      };

      const error = {
        config: mockConfig,
        response: { status: 401 },
        isAxiosError: true,
      } as AxiosError;

      await expect(tokenRefreshInterceptor.handleError(error)).rejects.toEqual(
        error
      );

      expect(storageService.clearTokens).toHaveBeenCalled();
    });

    it('should clear tokens if refresh token is missing', async () => {
      const mockConfig: ExtendedAxiosRequestConfig = {
        url: '/test',
        method: 'GET',
        headers: {},
      };

      const error = {
        config: mockConfig,
        response: { status: 401 },
        isAxiosError: true,
      } as AxiosError;

      (storageService.getRefreshToken as jest.Mock).mockResolvedValue(null);

      await expect(
        tokenRefreshInterceptor.handleError(error)
      ).rejects.toThrow();

      expect(storageService.clearTokens).toHaveBeenCalled();
    });

    it('should clear tokens if refresh fails', async () => {
      const mockConfig: ExtendedAxiosRequestConfig = {
        url: '/test',
        method: 'GET',
        headers: {},
      };

      const error = {
        config: mockConfig,
        response: { status: 401 },
        isAxiosError: true,
      } as AxiosError;

      (storageService.getRefreshToken as jest.Mock).mockResolvedValue(
        'refresh-token'
      );
      mockAxiosInstance.post.mockRejectedValue(new Error('Refresh failed'));

      await expect(
        tokenRefreshInterceptor.handleError(error)
      ).rejects.toThrow();

      expect(storageService.clearTokens).toHaveBeenCalled();
    });

    it('should queue requests while refreshing', async () => {
      const mockConfig1: ExtendedAxiosRequestConfig = {
        url: '/test1',
        method: 'GET',
        headers: {},
      };

      const mockConfig2: ExtendedAxiosRequestConfig = {
        url: '/test2',
        method: 'GET',
        headers: {},
      };

      const error1 = {
        config: mockConfig1,
        response: { status: 401 },
        isAxiosError: true,
      } as AxiosError;

      const error2 = {
        config: mockConfig2,
        response: { status: 401 },
        isAxiosError: true,
      } as AxiosError;

      const mockRefreshToken = 'refresh-token';
      const mockNewAccessToken = 'new-access-token';

      (storageService.getRefreshToken as jest.Mock).mockResolvedValue(
        mockRefreshToken
      );

      // Delay the refresh response to simulate concurrent requests
      mockAxiosInstance.post.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve({ data: { accessToken: mockNewAccessToken } }),
              100
            )
          )
      );

      mockAxiosInstance.request.mockResolvedValue({ data: 'success' });

      // Start both requests concurrently
      const promise1 = tokenRefreshInterceptor.handleError(error1);
      const promise2 = tokenRefreshInterceptor.handleError(error2);

      await Promise.all([promise1, promise2]);

      // Refresh should only be called once
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);
      // Both requests should be retried
      expect(mockAxiosInstance.request).toHaveBeenCalledTimes(2);
    });
  });
});
