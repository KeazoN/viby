import type { AxiosRequestConfig } from 'axios';

/**
 * Extended Axios request config with retry tracking
 */
export interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
  _retryCount?: number;
}

/**
 * HTTP client configuration options
 */
export interface HttpClientConfig {
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
  enableLogging?: boolean;
}

/**
 * Request log entry
 */
export interface RequestLog {
  method: string;
  url: string;
  timestamp: number;
  headers?: Record<string, string>;
  data?: any;
}

/**
 * Response log entry
 */
export interface ResponseLog {
  method: string;
  url: string;
  status: number;
  duration: number;
  timestamp: number;
  data?: any;
}

/**
 * Error log entry
 */
export interface ErrorLog {
  method: string;
  url: string;
  status?: number;
  message: string;
  duration: number;
  timestamp: number;
  retryCount?: number;
}
