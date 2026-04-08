import type { AxiosError, AxiosInstance } from 'axios';
import { storageService } from '@viby/shared/storage';
import type { ExtendedAxiosRequestConfig } from '../types';

/**
 * Token refresh interceptor that handles 401 errors by refreshing the access token
 * and retrying the original request
 */
export class TokenRefreshInterceptor {
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor(private axiosInstance: AxiosInstance) {}

  /**
   * Handle 401 errors by refreshing the token and retrying the request
   */
  async handleError(error: AxiosError): Promise<any> {
    const originalRequest = error.config as ExtendedAxiosRequestConfig;

    // Only handle 401 errors
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Don't retry if already retried or if it's the refresh endpoint itself
    if (originalRequest._retry || originalRequest.url?.includes('/auth/refresh')) {
      // Token refresh failed - clear tokens and reject
      await storageService.clearTokens();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // If already refreshing, queue this request
    if (this.isRefreshing) {
      return new Promise((resolve) => {
        this.refreshSubscribers.push((token: string) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          resolve(this.axiosInstance(originalRequest));
        });
      });
    }

    this.isRefreshing = true;

    try {
      const refreshToken = await storageService.getRefreshToken();
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // Call refresh endpoint
      const response = await this.axiosInstance.post('/auth/refresh', {
        refreshToken,
      });

      const { accessToken } = response.data;

      // Store new access token
      await storageService.setAccessToken(accessToken);

      // Notify all queued requests
      this.refreshSubscribers.forEach((callback) => callback(accessToken));
      this.refreshSubscribers = [];

      // Retry original request with new token
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      }
      
      return this.axiosInstance(originalRequest);
    } catch (refreshError) {
      // Refresh failed - clear tokens and reject all queued requests
      await storageService.clearTokens();
      this.refreshSubscribers = [];
      return Promise.reject(refreshError);
    } finally {
      this.isRefreshing = false;
    }
  }
}
