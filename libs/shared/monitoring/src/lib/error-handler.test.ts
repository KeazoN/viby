/**
 * Error Handler Tests
 */

import {
  handleError,
  createNetworkError,
  createApiError,
} from './error-handler';
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
import { captureException } from './sentry-config';
import { ErrorTracker } from './error-tracker';
import { showToast } from './toast-service';

// Mock dependencies
jest.mock('./sentry-config');
jest.mock('./error-tracker');
jest.mock('./toast-service');

describe('Error Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.error in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('handleError', () => {
    it('should log error to console and Sentry', () => {
      const error = new Error('Test error');
      handleError(error);

      expect(console.error).toHaveBeenCalledWith('Error:', error);
      expect(captureException).toHaveBeenCalledWith(error);
    });

    it('should handle NetworkError with 401 status', () => {
      const error = new NetworkError('Unauthorized', 401);
      handleError(error);

      expect(ErrorTracker.trackApiError).toHaveBeenCalled();
      expect(showToast).toHaveBeenCalledWith(
        'Session expired. Please log in again.',
        'error'
      );
    });

    it('should handle NetworkError with 500 status', () => {
      const error = new NetworkError('Server error', 500);
      handleError(error);

      expect(showToast).toHaveBeenCalledWith(
        'Server error. Please try again later.',
        'error'
      );
    });

    it('should handle NetworkError with no status (offline)', () => {
      const error = new NetworkError('Network failed', 0);
      handleError(error);

      expect(showToast).toHaveBeenCalledWith(
        'No internet connection. Please check your network.',
        'error'
      );
    });

    it('should handle AuthError', () => {
      const error = new AuthError('Authentication failed', 'login');
      handleError(error);

      expect(ErrorTracker.trackAuthError).toHaveBeenCalledWith(error, {
        flow: 'login',
      });
      expect(showToast).toHaveBeenCalledWith(
        'Authentication failed. Please log in again.',
        'error'
      );
    });

    it('should handle AuthError with expired message', () => {
      const error = new AuthError('Token expired', 'refresh');
      handleError(error);

      expect(showToast).toHaveBeenCalledWith(
        'Session expired. Please log in again.',
        'error'
      );
    });

    it('should handle ApiError with 404 status', () => {
      const error = new ApiError('Not found', 404);
      handleError(error);

      expect(ErrorTracker.trackApiError).toHaveBeenCalled();
      expect(showToast).toHaveBeenCalledWith(
        'The requested resource was not found.',
        'error'
      );
    });

    it('should handle ApiError with 400 status', () => {
      const error = new ApiError('Bad request', 400);
      handleError(error);

      expect(showToast).toHaveBeenCalledWith(
        'Invalid request. Please check your input.',
        'error'
      );
    });

    it('should handle ApiError with 429 status', () => {
      const error = new ApiError('Rate limit exceeded', 429);
      handleError(error);

      expect(showToast).toHaveBeenCalledWith(
        'Too many requests. Please wait a moment.',
        'warning'
      );
    });

    it('should handle WebSocketError', () => {
      const error = new WebSocketError('Connection lost', 'DISCONNECT');
      handleError(error);

      expect(ErrorTracker.trackWebSocketError).toHaveBeenCalledWith(error, {
        event: undefined,
        connectionStatus: 'disconnected',
      });
      expect(showToast).toHaveBeenCalledWith(
        'Connection lost. Reconnecting...',
        'warning'
      );
    });

    it('should handle ValidationError with field errors', () => {
      const error = new ValidationError('Validation failed', {
        email: 'Invalid email format',
        password: 'Password too short',
      });
      handleError(error);

      expect(showToast).toHaveBeenCalledWith('Invalid email format', 'error');
    });

    it('should handle ValidationError without field errors', () => {
      const error = new ValidationError('Form is invalid');
      handleError(error);

      expect(showToast).toHaveBeenCalledWith('Form is invalid', 'error');
    });

    it('should handle StateError', () => {
      const error = new StateError('State update failed', 'authStore', 'login');
      handleError(error);

      expect(ErrorTracker.trackStateError).toHaveBeenCalledWith(error, {
        store: 'authStore',
        action: 'login',
      });
      expect(showToast).toHaveBeenCalledWith(
        'An unexpected error occurred. Please try again.',
        'error'
      );
    });

    it('should handle NavigationError', () => {
      const error = new NavigationError('Route not found', '/profile');
      handleError(error);

      expect(ErrorTracker.trackNavigationError).toHaveBeenCalledWith(error, {
        route: '/profile',
      });
      expect(showToast).toHaveBeenCalledWith(
        'An unexpected error occurred. Please try again.',
        'error'
      );
    });

    it('should handle StorageError', () => {
      const error = new StorageError('Failed to save', 'user_token');
      handleError(error);

      expect(captureException).toHaveBeenCalledWith(error);
      expect(showToast).toHaveBeenCalledWith(
        'Failed to save data. Please try again.',
        'error'
      );
    });

    it('should handle generic Error', () => {
      const error = new Error('Unknown error');
      handleError(error);

      expect(showToast).toHaveBeenCalledWith(
        'An unexpected error occurred. Please try again.',
        'error'
      );
    });
  });

  describe('createNetworkError', () => {
    it('should create NetworkError from axios error', () => {
      const axiosError = {
        response: { status: 500 },
        message: 'Request failed',
      };

      const error = createNetworkError(
        axiosError,
        'https://api.example.com/users',
        'GET'
      );

      expect(error).toBeInstanceOf(NetworkError);
      expect(error.statusCode).toBe(500);
      expect(error.url).toBe('https://api.example.com/users');
      expect(error.method).toBe('GET');
      expect(error.message).toBe('Request failed');
    });

    it('should create NetworkError with default status code', () => {
      const fetchError = {
        message: 'Network request failed',
      };

      const error = createNetworkError(fetchError);

      expect(error).toBeInstanceOf(NetworkError);
      expect(error.statusCode).toBe(0);
      expect(error.message).toBe('Network request failed');
    });
  });

  describe('createApiError', () => {
    it('should create ApiError with all parameters', () => {
      const responseData = { error: 'Invalid input' };
      const error = createApiError(
        422,
        'Validation failed',
        'https://api.example.com/users',
        'POST',
        responseData
      );

      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(422);
      expect(error.message).toBe('Validation failed');
      expect(error.url).toBe('https://api.example.com/users');
      expect(error.method).toBe('POST');
      expect(error.responseData).toEqual(responseData);
    });

    it('should create ApiError with minimal parameters', () => {
      const error = createApiError(404, 'Not found');

      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Not found');
    });
  });
});
