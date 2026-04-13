/**
 * Tests for ErrorTracker
 * 
 * Validates error tracking with appropriate context
 */

import * as Sentry from '@sentry/react-native';
import { ErrorTracker } from './error-tracker';

// Mock Sentry
jest.mock('@sentry/react-native', () => ({
  withScope: jest.fn((callback) => {
    const scope = {
      setContext: jest.fn(),
      setTag: jest.fn(),
      setLevel: jest.fn(),
    };
    callback(scope);
  }),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
}));

jest.mock('./sentry-config', () => ({
  addSentryBreadcrumb: jest.fn(),
  setSentryContext: jest.fn(),
  captureException: jest.fn(),
}));

describe('ErrorTracker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('trackApiError', () => {
    it('should track API error with context', () => {
      const error = new Error('API Error');
      
      ErrorTracker.trackApiError(error, {
        url: '/api/users',
        method: 'GET',
        statusCode: 500,
        responseTime: 1234,
      });
      
      expect(Sentry.withScope).toHaveBeenCalled();
    });
  });

  describe('trackWebSocketError', () => {
    it('should track WebSocket error with context', () => {
      const error = new Error('WebSocket Error');
      
      ErrorTracker.trackWebSocketError(error, {
        event: 'game:start',
        connectionStatus: 'disconnected',
        reconnectAttempts: 3,
      });
      
      expect(Sentry.withScope).toHaveBeenCalled();
    });
  });

  describe('trackNavigationError', () => {
    it('should track navigation error with context', () => {
      const error = new Error('Navigation Error');
      
      ErrorTracker.trackNavigationError(error, {
        route: '/profile',
        params: { userId: '123' },
      });
      
      expect(Sentry.withScope).toHaveBeenCalled();
    });
  });

  describe('trackStateError', () => {
    it('should track state error with context', () => {
      const error = new Error('State Error');
      
      ErrorTracker.trackStateError(error, {
        store: 'auth',
        action: 'login',
      });
      
      expect(Sentry.withScope).toHaveBeenCalled();
    });
  });

  describe('trackAuthError', () => {
    it('should track auth error with context', () => {
      const error = new Error('Auth Error');
      
      ErrorTracker.trackAuthError(error, {
        flow: 'login',
        provider: 'spotify',
      });
      
      expect(Sentry.withScope).toHaveBeenCalled();
    });
  });

  describe('trackGameError', () => {
    it('should track game error with context', () => {
      const error = new Error('Game Error');
      
      ErrorTracker.trackGameError(error, {
        roomId: 'room-123',
        round: 3,
        action: 'submit_answer',
      });
      
      expect(Sentry.withScope).toHaveBeenCalled();
    });
  });

  describe('trackChatError', () => {
    it('should track chat error with context', () => {
      const error = new Error('Chat Error');
      
      ErrorTracker.trackChatError(error, {
        roomId: 'room-123',
        action: 'send_message',
      });
      
      expect(Sentry.withScope).toHaveBeenCalled();
    });
  });

  describe('trackPerformanceIssue', () => {
    it('should track performance issue', () => {
      ErrorTracker.trackPerformanceIssue('Slow API response', {
        metric: 'api_response_time',
        value: 5000,
        threshold: 2000,
      });
      
      expect(Sentry.withScope).toHaveBeenCalled();
      expect(Sentry.captureMessage).toHaveBeenCalledWith('Slow API response', 'warning');
    });
  });
});
