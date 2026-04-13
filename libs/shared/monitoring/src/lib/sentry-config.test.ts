/**
 * Tests for Sentry Configuration
 * 
 * Validates sensitive data filtering and configuration
 */

import * as Sentry from '@sentry/react-native';
import {
  initializeSentry,
  setSentryUser,
  clearSentryUser,
  setSentryContext,
  addSentryBreadcrumb,
  captureException,
  captureMessage,
} from './sentry-config';

// Mock Sentry
jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  setUser: jest.fn(),
  setContext: jest.fn(),
  addBreadcrumb: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  withScope: jest.fn((callback) => {
    const scope = {
      setContext: jest.fn(),
      setTag: jest.fn(),
      setLevel: jest.fn(),
    };
    callback(scope);
  }),
  ReactNativeTracing: jest.fn(),
  ReactNavigationInstrumentation: jest.fn(),
}));

describe('Sentry Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initializeSentry', () => {
    it('should not initialize Sentry if DSN is not configured', () => {
      delete process.env.EXPO_PUBLIC_SENTRY_DSN;
      
      initializeSentry();
      
      expect(Sentry.init).not.toHaveBeenCalled();
    });

    it('should initialize Sentry with DSN', () => {
      process.env.EXPO_PUBLIC_SENTRY_DSN = 'https://test@sentry.io/123';
      
      initializeSentry();
      
      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          dsn: 'https://test@sentry.io/123',
        })
      );
    });

    it('should disable Sentry in development', () => {
      process.env.EXPO_PUBLIC_SENTRY_DSN = 'https://test@sentry.io/123';
      (global as any).__DEV__ = true;
      
      initializeSentry();
      
      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: false,
        })
      );
    });
  });

  describe('Sensitive Data Filtering', () => {
    it('should filter access tokens from request headers', () => {
      process.env.EXPO_PUBLIC_SENTRY_DSN = 'https://test@sentry.io/123';
      initializeSentry();
      
      const initCall = (Sentry.init as jest.Mock).mock.calls[0][0];
      const beforeSend = initCall.beforeSend;
      
      const event = {
        request: {
          headers: {
            authorization: 'Bearer secret-token',
            'content-type': 'application/json',
          },
        },
      };
      
      const filtered = beforeSend(event, {});
      
      expect(filtered.request.headers.authorization).toBe('[FILTERED]');
      expect(filtered.request.headers['content-type']).toBe('application/json');
    });

    it('should filter JWT tokens from strings', () => {
      process.env.EXPO_PUBLIC_SENTRY_DSN = 'https://test@sentry.io/123';
      initializeSentry();
      
      const initCall = (Sentry.init as jest.Mock).mock.calls[0][0];
      const beforeSend = initCall.beforeSend;
      
      const jwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      
      const event = {
        extra: {
          token: jwtToken,
        },
      };
      
      const filtered = beforeSend(event, {});
      
      expect(filtered.extra.token).toBe('[FILTERED_TOKEN]');
    });

    it('should filter passwords from extra context', () => {
      process.env.EXPO_PUBLIC_SENTRY_DSN = 'https://test@sentry.io/123';
      initializeSentry();
      
      const initCall = (Sentry.init as jest.Mock).mock.calls[0][0];
      const beforeSend = initCall.beforeSend;
      
      const event = {
        extra: {
          password: 'secret123',
          username: 'john',
        },
      };
      
      const filtered = beforeSend(event, {});
      
      expect(filtered.extra.password).toBe('[FILTERED]');
      expect(filtered.extra.username).toBe('john');
    });

    it('should filter refresh tokens', () => {
      process.env.EXPO_PUBLIC_SENTRY_DSN = 'https://test@sentry.io/123';
      initializeSentry();
      
      const initCall = (Sentry.init as jest.Mock).mock.calls[0][0];
      const beforeSend = initCall.beforeSend;
      
      const event = {
        extra: {
          refresh_token: 'secret-refresh-token',
          user_id: '123',
        },
      };
      
      const filtered = beforeSend(event, {});
      
      expect(filtered.extra.refresh_token).toBe('[FILTERED]');
      expect(filtered.extra.user_id).toBe('123');
    });

    it('should filter OAuth credentials', () => {
      process.env.EXPO_PUBLIC_SENTRY_DSN = 'https://test@sentry.io/123';
      initializeSentry();
      
      const initCall = (Sentry.init as jest.Mock).mock.calls[0][0];
      const beforeSend = initCall.beforeSend;
      
      const event = {
        extra: {
          oauth_token: 'secret-oauth-token',
          client_secret: 'secret-client-secret',
        },
      };
      
      const filtered = beforeSend(event, {});
      
      expect(filtered.extra.oauth_token).toBe('[FILTERED]');
      expect(filtered.extra.client_secret).toBe('[FILTERED]');
    });

    it('should filter nested sensitive data', () => {
      process.env.EXPO_PUBLIC_SENTRY_DSN = 'https://test@sentry.io/123';
      initializeSentry();
      
      const initCall = (Sentry.init as jest.Mock).mock.calls[0][0];
      const beforeSend = initCall.beforeSend;
      
      const event = {
        extra: {
          user: {
            id: '123',
            credentials: {
              password: 'secret',
              access_token: 'token',
            },
          },
        },
      };
      
      const filtered = beforeSend(event, {});
      
      expect(filtered.extra.user.id).toBe('123');
      expect(filtered.extra.user.credentials.password).toBe('[FILTERED]');
      expect(filtered.extra.user.credentials.access_token).toBe('[FILTERED]');
    });

    it('should filter sensitive data from breadcrumbs', () => {
      process.env.EXPO_PUBLIC_SENTRY_DSN = 'https://test@sentry.io/123';
      initializeSentry();
      
      const initCall = (Sentry.init as jest.Mock).mock.calls[0][0];
      const beforeSend = initCall.beforeSend;
      
      const event = {
        breadcrumbs: [
          {
            message: 'API call',
            data: {
              authorization: 'Bearer token',
              url: '/api/users',
            },
          },
        ],
      };
      
      const filtered = beforeSend(event, {});
      
      expect(filtered.breadcrumbs[0].data.authorization).toBe('[FILTERED]');
      expect(filtered.breadcrumbs[0].data.url).toBe('/api/users');
    });
  });

  describe('User Context', () => {
    it('should set user context', () => {
      setSentryUser('user-123', 'john_doe');
      
      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: 'user-123',
        username: 'john_doe',
      });
    });

    it('should clear user context', () => {
      clearSentryUser();
      
      expect(Sentry.setUser).toHaveBeenCalledWith(null);
    });
  });

  describe('Custom Context', () => {
    it('should set custom context with filtered data', () => {
      setSentryContext('api_request', {
        url: '/api/users',
        token: 'secret',
      });
      
      expect(Sentry.setContext).toHaveBeenCalledWith(
        'api_request',
        expect.objectContaining({
          url: '/api/users',
          token: '[FILTERED]',
        })
      );
    });
  });

  describe('Breadcrumbs', () => {
    it('should add breadcrumb with filtered data', () => {
      addSentryBreadcrumb('API call', 'http', 'info', {
        url: '/api/users',
        password: 'secret',
      });
      
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'API call',
          category: 'http',
          level: 'info',
          data: expect.objectContaining({
            url: '/api/users',
            password: '[FILTERED]',
          }),
        })
      );
    });
  });

  describe('Exception Capture', () => {
    it('should capture exception with context', () => {
      const error = new Error('Test error');
      
      captureException(error, { context: 'test' });
      
      expect(Sentry.withScope).toHaveBeenCalled();
      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });

    it('should capture exception without context', () => {
      const error = new Error('Test error');
      
      captureException(error);
      
      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });
  });

  describe('Message Capture', () => {
    it('should capture message with context', () => {
      captureMessage('Test message', 'warning', { context: 'test' });
      
      expect(Sentry.withScope).toHaveBeenCalled();
      expect(Sentry.captureMessage).toHaveBeenCalledWith('Test message', 'warning');
    });

    it('should capture message without context', () => {
      captureMessage('Test message');
      
      expect(Sentry.captureMessage).toHaveBeenCalledWith('Test message', 'info');
    });
  });
});
