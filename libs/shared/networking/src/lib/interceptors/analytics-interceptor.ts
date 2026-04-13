/**
 * Analytics Interceptor
 * 
 * Tracks API request performance metrics and error rates
 * Implements requirements 23.2 and 23.3
 */

import type { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { analyticsService, AnalyticsEvent } from '@viby/shared/analytics';

interface RequestMetadata {
  startTime: number;
  url: string;
  method: string;
}

// Store request metadata keyed by request config
const requestMetadataMap = new WeakMap<AxiosRequestConfig, RequestMetadata>();

/**
 * Analytics request interceptor
 * Records request start time for performance tracking
 */
export function analyticsRequestInterceptor(
  config: AxiosRequestConfig
): AxiosRequestConfig {
  const metadata: RequestMetadata = {
    startTime: Date.now(),
    url: config.url || 'unknown',
    method: (config.method || 'get').toUpperCase(),
  };

  requestMetadataMap.set(config, metadata);

  return config;
}

/**
 * Analytics response interceptor
 * Tracks successful API requests with response time
 */
export function analyticsResponseInterceptor(
  response: AxiosResponse
): AxiosResponse {
  const metadata = requestMetadataMap.get(response.config);

  if (metadata) {
    const responseTime = Date.now() - metadata.startTime;

    // Track API request performance
    analyticsService.trackEvent(AnalyticsEvent.API_REQUEST, {
      url: metadata.url,
      method: metadata.method,
      status_code: response.status,
      response_time_ms: responseTime,
      success: true,
    });

    // Warn about slow requests
    if (responseTime > 3000) {
      console.warn(`Slow API request: ${metadata.method} ${metadata.url} took ${responseTime}ms`);
    }
  }

  return response;
}

/**
 * Analytics error interceptor
 * Tracks failed API requests and error rates
 */
export function analyticsErrorInterceptor(error: AxiosError): Promise<AxiosError> {
  const metadata = requestMetadataMap.get(error.config as AxiosRequestConfig);

  if (metadata) {
    const responseTime = Date.now() - metadata.startTime;
    const statusCode = error.response?.status || 0;

    // Track API error
    analyticsService.trackEvent(AnalyticsEvent.API_ERROR, {
      url: metadata.url,
      method: metadata.method,
      status_code: statusCode,
      response_time_ms: responseTime,
      error_type: statusCode === 0 ? 'network' : 'http',
      success: false,
    });
  }

  return Promise.reject(error);
}
