/**
 * Custom Error Types
 * 
 * Provides specific error classes for different error scenarios
 * to enable better error handling and user messaging.
 * 
 * Requirements:
 * - 16.4: Log all Backend_API errors with request context
 * - 16.5: Show user-friendly error messages
 */

/**
 * Network-related errors (connectivity, timeouts, etc.)
 */
export class NetworkError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public url?: string,
    public method?: string
  ) {
    super(message);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Authentication and authorization errors
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public flow?: 'login' | 'logout' | 'refresh' | 'oauth'
  ) {
    super(message);
    this.name = 'AuthError';
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

/**
 * API-specific errors (4xx, 5xx responses)
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public url?: string,
    public method?: string,
    public responseData?: any
  ) {
    super(message);
    this.name = 'ApiError';
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * WebSocket connection and communication errors
 */
export class WebSocketError extends Error {
  constructor(
    message: string,
    public code?: string,
    public event?: string
  ) {
    super(message);
    this.name = 'WebSocketError';
    Object.setPrototypeOf(this, WebSocketError.prototype);
  }
}

/**
 * Validation errors (form inputs, data validation)
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public fields?: Record<string, string>
  ) {
    super(message);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * State management errors
 */
export class StateError extends Error {
  constructor(
    message: string,
    public store?: string,
    public action?: string
  ) {
    super(message);
    this.name = 'StateError';
    Object.setPrototypeOf(this, StateError.prototype);
  }
}

/**
 * Navigation errors
 */
export class NavigationError extends Error {
  constructor(
    message: string,
    public route?: string
  ) {
    super(message);
    this.name = 'NavigationError';
    Object.setPrototypeOf(this, NavigationError.prototype);
  }
}

/**
 * Storage errors (local storage, secure storage)
 */
export class StorageError extends Error {
  constructor(
    message: string,
    public key?: string
  ) {
    super(message);
    this.name = 'StorageError';
    Object.setPrototypeOf(this, StorageError.prototype);
  }
}
