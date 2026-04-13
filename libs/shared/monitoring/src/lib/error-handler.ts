/**
 * Global Error Handler
 * 
 * Provides centralized error handling with user-friendly messages,
 * Sentry logging, and appropriate recovery actions.
 * 
 * Requirements:
 * - 16.4: Log all Backend_API errors with request context
 * - 16.5: Show user-friendly error messages
 * - 16.8: Never log sensitive data
 */

import { captureException } from './sentry-config';
import { ErrorTracker } from './error-tracker';
import {
  NetworkError,
  AuthError,
  ApiError,
  WebSocketError,
  ValidationError,
  StateError,
  NavigationError,
  StorageError,
} from './error-types';
import { showToast } from './toast-service';

/**
 * Error message mappings for user-friendly display
 */
const ERROR_MESSAGES = {
  // Network errors
  NETWORK_OFFLINE: 'No internet connection. Please check your network.',
  NETWORK_TIMEOUT: 'Request timed out. Please try again.',
  NETWORK_GENERIC: 'Network error. Please check your connection.',
  
  // Auth errors
  AUTH_SESSION_EXPIRED: 'Session expired. Please log in again.',
  AUTH_FAILED: 'Authentication failed. Please log in again.',
  AUTH_UNAUTHORIZED: 'You are not authorized to perform this action.',
  
  // API errors
  API_SERVER_ERROR: 'Server error. Please try again later.',
  API_NOT_FOUND: 'The requested resource was not found.',
  API_BAD_REQUEST: 'Invalid request. Please check your input.',
  API_RATE_LIMIT: 'Too many requests. Please wait a moment.',
  
  // WebSocket errors
  WEBSOCKET_DISCONNECTED: 'Connection lost. Reconnecting...',
  WEBSOCKET_FAILED: 'Failed to connect. Please try again.',
  
  // Validation errors
  VALIDATION_FAILED: 'Please check your input and try again.',
  
  // Generic errors
  GENERIC_ERROR: 'An unexpected error occurred. Please try again.',
};

/**
 * Handle errors globally with appropriate logging and user feedback
 */
export function handleError(error: Error, context?: Record<string, any>): void {
  console.error('Error:', error);

  // Log to Sentry with context
  captureException(error);

  // Handle specific error types
  if (error instanceof NetworkError) {
    handleNetworkError(error);
  } else if (error instanceof AuthError) {
    handleAuthError(error);
  } else if (error instanceof ApiError) {
    handleApiError(error);
  } else if (error instanceof WebSocketError) {
    handleWebSocketError(error);
  } else if (error instanceof ValidationError) {
    handleValidationError(error);
  } else if (error instanceof StateError) {
    handleStateError(error);
  } else if (error instanceof NavigationError) {
    handleNavigationError(error);
  } else if (error instanceof StorageError) {
    handleStorageError(error);
  } else {
    // Generic error handling
    showToast(ERROR_MESSAGES.GENERIC_ERROR, 'error');
  }
}

/**
 * Handle network errors
 */
function handleNetworkError(error: NetworkError): void {
  ErrorTracker.trackApiError(error, {
    url: error.url || 'unknown',
    method: error.method || 'unknown',
    statusCode: error.statusCode,
  });

  if (error.statusCode === 401) {
    showToast(ERROR_MESSAGES.AUTH_SESSION_EXPIRED, 'error');
    // Note: Auth logout should be handled by the caller
  } else if (error.statusCode && error.statusCode >= 500) {
    showToast(ERROR_MESSAGES.API_SERVER_ERROR, 'error');
  } else if (error.statusCode === 0 || !error.statusCode) {
    showToast(ERROR_MESSAGES.NETWORK_OFFLINE, 'error');
  } else {
    showToast(ERROR_MESSAGES.NETWORK_GENERIC, 'error');
  }
}

/**
 * Handle authentication errors
 */
function handleAuthError(error: AuthError): void {
  ErrorTracker.trackAuthError(error, {
    flow: error.flow || 'login',
  });

  if (error.message.toLowerCase().includes('unauthorized')) {
    showToast(ERROR_MESSAGES.AUTH_UNAUTHORIZED, 'error');
  } else if (error.message.toLowerCase().includes('expired')) {
    showToast(ERROR_MESSAGES.AUTH_SESSION_EXPIRED, 'error');
  } else {
    showToast(ERROR_MESSAGES.AUTH_FAILED, 'error');
  }
}

/**
 * Handle API errors
 */
function handleApiError(error: ApiError): void {
  ErrorTracker.trackApiError(error, {
    url: error.url || 'unknown',
    method: error.method || 'unknown',
    statusCode: error.statusCode,
  });

  if (error.statusCode === 401) {
    showToast(ERROR_MESSAGES.AUTH_SESSION_EXPIRED, 'error');
  } else if (error.statusCode === 403) {
    showToast(ERROR_MESSAGES.AUTH_UNAUTHORIZED, 'error');
  } else if (error.statusCode === 404) {
    showToast(ERROR_MESSAGES.API_NOT_FOUND, 'error');
  } else if (error.statusCode === 400) {
    showToast(ERROR_MESSAGES.API_BAD_REQUEST, 'error');
  } else if (error.statusCode === 429) {
    showToast(ERROR_MESSAGES.API_RATE_LIMIT, 'warning');
  } else if (error.statusCode >= 500) {
    showToast(ERROR_MESSAGES.API_SERVER_ERROR, 'error');
  } else {
    showToast(error.message || ERROR_MESSAGES.GENERIC_ERROR, 'error');
  }
}

/**
 * Handle WebSocket errors
 */
function handleWebSocketError(error: WebSocketError): void {
  ErrorTracker.trackWebSocketError(error, {
    event: error.event,
    connectionStatus: 'disconnected',
  });

  if (error.message.toLowerCase().includes('disconnect')) {
    showToast(ERROR_MESSAGES.WEBSOCKET_DISCONNECTED, 'warning');
  } else {
    showToast(ERROR_MESSAGES.WEBSOCKET_FAILED, 'error');
  }
}

/**
 * Handle validation errors
 */
function handleValidationError(error: ValidationError): void {
  // Show specific field errors if available
  if (error.fields && Object.keys(error.fields).length > 0) {
    const firstFieldError = Object.values(error.fields)[0];
    showToast(firstFieldError, 'error');
  } else {
    showToast(error.message || ERROR_MESSAGES.VALIDATION_FAILED, 'error');
  }
}

/**
 * Handle state management errors
 */
function handleStateError(error: StateError): void {
  ErrorTracker.trackStateError(error, {
    store: error.store || 'unknown',
    action: error.action,
  });

  showToast(ERROR_MESSAGES.GENERIC_ERROR, 'error');
}

/**
 * Handle navigation errors
 */
function handleNavigationError(error: NavigationError): void {
  ErrorTracker.trackNavigationError(error, {
    route: error.route,
  });

  showToast(ERROR_MESSAGES.GENERIC_ERROR, 'error');
}

/**
 * Handle storage errors
 */
function handleStorageError(error: StorageError): void {
  console.error('Storage error:', error);
  captureException(error);

  showToast('Failed to save data. Please try again.', 'error');
}

/**
 * Create a network error from an axios error or fetch error
 */
export function createNetworkError(
  error: any,
  url?: string,
  method?: string
): NetworkError {
  const statusCode = error.response?.status || error.status || 0;
  const message = error.message || 'Network request failed';
  
  return new NetworkError(message, statusCode, url, method);
}

/**
 * Create an API error from a response
 */
export function createApiError(
  statusCode: number,
  message: string,
  url?: string,
  method?: string,
  responseData?: any
): ApiError {
  return new ApiError(message, statusCode, url, method, responseData);
}
