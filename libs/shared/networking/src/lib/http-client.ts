import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import {
  authRequestInterceptor,
  TokenRefreshInterceptor,
  RetryInterceptor,
  LoggingInterceptor,
} from './interceptors';
import type { HttpClientConfig } from './types';

/**
 * HttpClient provides a configured Axios instance with:
 * - Automatic auth token injection
 * - Token refresh on 401 errors
 * - Retry logic with exponential backoff for network/5xx errors
 * - Request/response logging
 */
export class HttpClient {
  private client: AxiosInstance;
  private tokenRefreshInterceptor: TokenRefreshInterceptor;
  private retryInterceptor: RetryInterceptor;
  private loggingInterceptor: LoggingInterceptor;

  constructor(config: HttpClientConfig = {}) {
    const {
      baseURL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
      timeout = 10000,
      maxRetries = 3,
      enableLogging = __DEV__,
    } = config;

    // Create Axios instance
    this.client = axios.create({
      baseURL,
      timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Initialize interceptors
    this.tokenRefreshInterceptor = new TokenRefreshInterceptor(this.client);
    this.retryInterceptor = new RetryInterceptor(this.client, maxRetries);
    this.loggingInterceptor = new LoggingInterceptor(enableLogging);

    this.setupInterceptors();
  }

  /**
   * Setup all request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptors (executed in order)
    
    // 1. Logging interceptor - log outgoing requests
    this.client.interceptors.request.use(
      (config) => this.loggingInterceptor.logRequest(config),
      (error) => Promise.reject(error)
    );

    // 2. Auth interceptor - inject access token
    this.client.interceptors.request.use(
      authRequestInterceptor,
      (error) => Promise.reject(error)
    );

    // Response interceptors (executed in reverse order)
    
    // 1. Logging interceptor - log responses and errors
    this.client.interceptors.response.use(
      (response) => this.loggingInterceptor.logResponse(response),
      (error) => {
        this.loggingInterceptor.logError(error);
        return Promise.reject(error);
      }
    );

    // 2. Token refresh interceptor - handle 401 errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => this.tokenRefreshInterceptor.handleError(error)
    );

    // 3. Retry interceptor - handle network/5xx errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => this.retryInterceptor.handleError(error)
    );
  }

  /**
   * GET request
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  /**
   * POST request
   */
  async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  /**
   * PUT request
   */
  async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  /**
   * PATCH request
   */
  async patch<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  /**
   * DELETE request
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  /**
   * Get the underlying Axios instance for advanced usage
   */
  getAxiosInstance(): AxiosInstance {
    return this.client;
  }
}

// Export singleton instance
export const httpClient = new HttpClient();
