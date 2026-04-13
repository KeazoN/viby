/**
 * Error Types Tests
 */

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

describe('Error Types', () => {
  describe('NetworkError', () => {
    it('should create a network error with message', () => {
      const error = new NetworkError('Network failed');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(NetworkError);
      expect(error.name).toBe('NetworkError');
      expect(error.message).toBe('Network failed');
    });

    it('should include status code and request details', () => {
      const error = new NetworkError(
        'Request failed',
        500,
        'https://api.example.com/users',
        'GET'
      );
      
      expect(error.statusCode).toBe(500);
      expect(error.url).toBe('https://api.example.com/users');
      expect(error.method).toBe('GET');
    });
  });

  describe('AuthError', () => {
    it('should create an auth error with message', () => {
      const error = new AuthError('Authentication failed');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AuthError);
      expect(error.name).toBe('AuthError');
      expect(error.message).toBe('Authentication failed');
    });

    it('should include auth flow information', () => {
      const error = new AuthError('Token expired', 'refresh');
      
      expect(error.flow).toBe('refresh');
    });
  });

  describe('ApiError', () => {
    it('should create an API error with status code', () => {
      const error = new ApiError('Bad request', 400);
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiError);
      expect(error.name).toBe('ApiError');
      expect(error.message).toBe('Bad request');
      expect(error.statusCode).toBe(400);
    });

    it('should include request details and response data', () => {
      const responseData = { error: 'Invalid input' };
      const error = new ApiError(
        'Validation failed',
        422,
        'https://api.example.com/users',
        'POST',
        responseData
      );
      
      expect(error.url).toBe('https://api.example.com/users');
      expect(error.method).toBe('POST');
      expect(error.responseData).toEqual(responseData);
    });
  });

  describe('WebSocketError', () => {
    it('should create a WebSocket error with message', () => {
      const error = new WebSocketError('Connection failed');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(WebSocketError);
      expect(error.name).toBe('WebSocketError');
      expect(error.message).toBe('Connection failed');
    });

    it('should include error code and event', () => {
      const error = new WebSocketError('Disconnected', 'ECONNRESET', 'game:update');
      
      expect(error.code).toBe('ECONNRESET');
      expect(error.event).toBe('game:update');
    });
  });

  describe('ValidationError', () => {
    it('should create a validation error with message', () => {
      const error = new ValidationError('Validation failed');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Validation failed');
    });

    it('should include field-specific errors', () => {
      const fields = {
        email: 'Invalid email format',
        password: 'Password too short',
      };
      const error = new ValidationError('Form validation failed', fields);
      
      expect(error.fields).toEqual(fields);
    });
  });

  describe('StateError', () => {
    it('should create a state error with message', () => {
      const error = new StateError('State update failed');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(StateError);
      expect(error.name).toBe('StateError');
      expect(error.message).toBe('State update failed');
    });

    it('should include store and action information', () => {
      const error = new StateError('Invalid action', 'authStore', 'login');
      
      expect(error.store).toBe('authStore');
      expect(error.action).toBe('login');
    });
  });

  describe('NavigationError', () => {
    it('should create a navigation error with message', () => {
      const error = new NavigationError('Navigation failed');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(NavigationError);
      expect(error.name).toBe('NavigationError');
      expect(error.message).toBe('Navigation failed');
    });

    it('should include route information', () => {
      const error = new NavigationError('Route not found', '/profile');
      
      expect(error.route).toBe('/profile');
    });
  });

  describe('StorageError', () => {
    it('should create a storage error with message', () => {
      const error = new StorageError('Storage operation failed');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(StorageError);
      expect(error.name).toBe('StorageError');
      expect(error.message).toBe('Storage operation failed');
    });

    it('should include key information', () => {
      const error = new StorageError('Failed to save', 'user_token');
      
      expect(error.key).toBe('user_token');
    });
  });
});
