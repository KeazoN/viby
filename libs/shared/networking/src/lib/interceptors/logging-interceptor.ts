import type {
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from 'axios';
import type { RequestLog, ResponseLog, ErrorLog } from '../types';
import { ErrorTracker, addSentryBreadcrumb } from '@viby/shared/monitoring';

/**
 * Logging interceptor that logs requests, responses, and errors
 * Integrates with Sentry for error tracking
 */
export class LoggingInterceptor {
  private requestTimestamps = new Map<string, number>();

  constructor(private enableLogging = true) {}

  /**
   * Log outgoing requests
   */
  logRequest(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
    if (!this.enableLogging) {
      return config;
    }

    const requestId = this.generateRequestId(config);
    const timestamp = Date.now();
    this.requestTimestamps.set(requestId, timestamp);

    const log: RequestLog = {
      method: config.method?.toUpperCase() || 'GET',
      url: this.buildFullUrl(config),
      timestamp,
      headers: this.sanitizeHeaders(config.headers),
      data: config.data,
    };

    console.log('[HTTP Request]', log);

    // Add breadcrumb to Sentry
    addSentryBreadcrumb(
      `${log.method} ${log.url}`,
      'http',
      'info'
    );

    return config;
  }

  /**
   * Log successful responses
   */
  logResponse(response: AxiosResponse): AxiosResponse {
    if (!this.enableLogging) {
      return response;
    }

    const requestId = this.generateRequestId(response.config);
    const startTime = this.requestTimestamps.get(requestId) || Date.now();
    const duration = Date.now() - startTime;
    this.requestTimestamps.delete(requestId);

    const log: ResponseLog = {
      method: response.config.method?.toUpperCase() || 'GET',
      url: this.buildFullUrl(response.config),
      status: response.status,
      duration,
      timestamp: Date.now(),
      data: response.data,
    };

    console.log('[HTTP Response]', log);

    return response;
  }

  /**
   * Log errors
   */
  logError(error: AxiosError): void {
    if (!this.enableLogging) {
      return;
    }

    const config = error.config;
    if (!config) {
      console.error('[HTTP Error]', error.message);
      return;
    }

    const requestId = this.generateRequestId(config);
    const startTime = this.requestTimestamps.get(requestId) || Date.now();
    const duration = Date.now() - startTime;
    this.requestTimestamps.delete(requestId);

    const log: ErrorLog = {
      method: config.method?.toUpperCase() || 'GET',
      url: this.buildFullUrl(config),
      status: error.response?.status,
      message: error.message,
      duration,
      timestamp: Date.now(),
      retryCount: (config as any)._retryCount,
    };

    console.error('[HTTP Error]', log);

    // Track API errors in Sentry (only for 5xx errors and network errors)
    if (!error.response || (error.response.status >= 500 && error.response.status < 600)) {
      ErrorTracker.trackApiError(error as Error, {
        url: log.url,
        method: log.method,
        statusCode: log.status,
        responseTime: duration,
      });
    }
  }

  /**
   * Generate a unique request ID for tracking
   */
  private generateRequestId(config: InternalAxiosRequestConfig): string {
    return `${config.method}-${config.url}-${Date.now()}`;
  }

  /**
   * Build full URL from config
   */
  private buildFullUrl(config: InternalAxiosRequestConfig): string {
    const baseURL = config.baseURL || '';
    const url = config.url || '';
    return `${baseURL}${url}`;
  }

  /**
   * Sanitize headers to remove sensitive information
   */
  private sanitizeHeaders(
    headers: any
  ): Record<string, string> | undefined {
    if (!headers) {
      return undefined;
    }

    const sanitized: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(headers)) {
      // Mask authorization tokens
      if (key.toLowerCase() === 'authorization') {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = String(value);
      }
    }

    return sanitized;
  }
}
