import type { AxiosError, AxiosInstance } from 'axios';
import type { ExtendedAxiosRequestConfig } from '../types';

/**
 * Retry interceptor that handles network errors and 5xx errors with exponential backoff
 */
export class RetryInterceptor {
  private readonly maxRetries: number;

  constructor(
    private axiosInstance: AxiosInstance,
    maxRetries = 3
  ) {
    this.maxRetries = maxRetries;
  }

  /**
   * Handle errors with retry logic for network and 5xx errors
   */
  async handleError(error: AxiosError): Promise<any> {
    const config = error.config as ExtendedAxiosRequestConfig;

    if (!config) {
      return Promise.reject(error);
    }

    // Initialize retry count
    if (config._retryCount === undefined) {
      config._retryCount = 0;
    }

    // Check if we should retry
    const shouldRetry = this.shouldRetryRequest(error, config);

    if (!shouldRetry) {
      return Promise.reject(error);
    }

    // Increment retry count
    config._retryCount += 1;

    // Calculate exponential backoff delay
    const delay = this.calculateBackoffDelay(config._retryCount);

    // Wait before retrying
    await this.sleep(delay);

    // Retry the request
    return this.axiosInstance(config);
  }

  /**
   * Determine if the request should be retried
   */
  private shouldRetryRequest(
    error: AxiosError,
    config: ExtendedAxiosRequestConfig
  ): boolean {
    // Don't retry if max retries reached
    if ((config._retryCount ?? 0) >= this.maxRetries) {
      return false;
    }

    // Don't retry if it's a 401 (handled by token refresh interceptor)
    if (error.response?.status === 401) {
      return false;
    }

    // Retry on network errors
    if (
      error.code === 'ECONNABORTED' ||
      error.message === 'Network Error' ||
      !error.response
    ) {
      return true;
    }

    // Retry on 5xx server errors
    if (error.response?.status && error.response.status >= 500) {
      return true;
    }

    // Don't retry 4xx client errors (except 401)
    return false;
  }

  /**
   * Calculate exponential backoff delay
   * Formula: min(1000 * 2^retryCount, 30000)
   */
  private calculateBackoffDelay(retryCount: number): number {
    const baseDelay = 1000;
    const maxDelay = 30000;
    const delay = baseDelay * Math.pow(2, retryCount - 1);
    return Math.min(delay, maxDelay);
  }

  /**
   * Sleep for the specified duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
