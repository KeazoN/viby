/**
 * Sentry Configuration
 * 
 * Configures Sentry SDK for error tracking with:
 * - Sensitive data filtering (tokens, passwords, PII)
 * - Environment-specific settings
 * - Custom error context
 * 
 * Requirements:
 * - 16.3: Integrate Sentry for crash reporting and error tracking
 * - 16.4: Log all Backend_API errors with request context
 * - 16.8: Never log sensitive data including tokens, passwords, or personal information
 * - 17.6: Never log JWT tokens, refresh tokens, or OAuth credentials
 */

import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

/**
 * Sensitive data patterns to filter from error reports
 */
const SENSITIVE_PATTERNS = [
  // Tokens
  /access[_-]?token/i,
  /refresh[_-]?token/i,
  /jwt/i,
  /bearer/i,
  /authorization/i,
  /api[_-]?key/i,
  
  // Passwords
  /password/i,
  /passwd/i,
  /pwd/i,
  
  // OAuth
  /oauth/i,
  /client[_-]?secret/i,
  /code/i, // OAuth authorization code
  
  // Personal Information
  /email/i,
  /phone/i,
  /ssn/i,
  /credit[_-]?card/i,
  /card[_-]?number/i,
];

/**
 * Check if a key contains sensitive data
 */
function isSensitiveKey(key: string): boolean {
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
}

/**
 * Recursively filter sensitive data from objects
 */
function filterSensitiveData(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    // Check if the string looks like a JWT token
    if (data.split('.').length === 3 && data.length > 100) {
      return '[FILTERED_TOKEN]';
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => filterSensitiveData(item));
  }

  if (typeof data === 'object') {
    const filtered: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (isSensitiveKey(key)) {
        filtered[key] = '[FILTERED]';
      } else {
        filtered[key] = filterSensitiveData(value);
      }
    }
    return filtered;
  }

  return data;
}

/**
 * Initialize Sentry SDK
 */
export function initializeSentry(): void {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  
  // Skip initialization if DSN is not configured
  if (!dsn) {
    if (__DEV__) {
      console.warn('Sentry DSN not configured. Error tracking is disabled.');
    }
    return;
  }

  Sentry.init({
    dsn,
    
    // Environment configuration
    environment: process.env.EXPO_PUBLIC_ENV || 'development',
    release: Constants.expoConfig?.version || '1.0.0',
    dist: Constants.expoConfig?.android?.versionCode?.toString() || 
          Constants.expoConfig?.ios?.buildNumber || 
          '1',
    
    // Enable debug mode in development
    debug: __DEV__,
    
    // Disable in development to avoid noise
    enabled: !__DEV__,
    
    // Sample rate for performance monitoring
    tracesSampleRate: __DEV__ ? 0 : 0.2, // 20% in production
    
    // Filter sensitive data before sending to Sentry
    beforeSend(event, hint) {
      // Filter request data
      if (event.request) {
        event.request.headers = filterSensitiveData(event.request.headers);
        event.request.cookies = '[FILTERED]';
        event.request.data = filterSensitiveData(event.request.data);
        
        // Filter query string
        if (event.request.query_string) {
          event.request.query_string = filterSensitiveData(event.request.query_string);
        }
      }

      // Filter extra context
      if (event.extra) {
        event.extra = filterSensitiveData(event.extra);
      }

      // Filter contexts
      if (event.contexts) {
        event.contexts = filterSensitiveData(event.contexts);
      }

      // Filter breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(breadcrumb => ({
          ...breadcrumb,
          data: filterSensitiveData(breadcrumb.data),
        }));
      }

      // Filter exception values
      if (event.exception?.values) {
        event.exception.values = event.exception.values.map(exception => ({
          ...exception,
          value: exception.value ? filterSensitiveData(exception.value) : exception.value,
        }));
      }

      return event;
    },
    
    // Ignore specific errors
    ignoreErrors: [
      // Network errors that are expected
      'Network request failed',
      'Network Error',
      'Failed to fetch',
      
      // Cancelled requests
      'Request aborted',
      'AbortError',
      
      // User navigation errors
      'Navigation cancelled',
    ],
    
    // Integrations
    integrations: [
      new Sentry.ReactNativeTracing({
        // Trace navigation
        routingInstrumentation: new Sentry.ReactNavigationInstrumentation(),
        
        // Trace network requests
        tracingOrigins: ['localhost', /^\//],
        
        // Don't trace sensitive endpoints
        shouldCreateSpanForRequest: (url) => {
          // Don't trace auth endpoints
          if (url.includes('/auth/') || url.includes('/oauth/')) {
            return false;
          }
          return true;
        },
      }),
    ],
  });
}

/**
 * Set user context for error tracking
 * Note: Only non-sensitive user data should be included
 */
export function setSentryUser(userId: string, username?: string): void {
  Sentry.setUser({
    id: userId,
    username: username,
    // Do NOT include email, phone, or other PII
  });
}

/**
 * Clear user context (e.g., on logout)
 */
export function clearSentryUser(): void {
  Sentry.setUser(null);
}

/**
 * Add custom context to error reports
 */
export function setSentryContext(key: string, context: Record<string, any>): void {
  Sentry.setContext(key, filterSensitiveData(context));
}

/**
 * Add breadcrumb for debugging
 */
export function addSentryBreadcrumb(
  message: string,
  category: string,
  level: Sentry.SeverityLevel = 'info',
  data?: Record<string, any>
): void {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data: data ? filterSensitiveData(data) : undefined,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Capture exception manually
 */
export function captureException(error: Error, context?: Record<string, any>): void {
  if (context) {
    Sentry.withScope(scope => {
      scope.setContext('custom', filterSensitiveData(context));
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
}

/**
 * Capture message manually
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, any>
): void {
  if (context) {
    Sentry.withScope(scope => {
      scope.setContext('custom', filterSensitiveData(context));
      Sentry.captureMessage(message, level);
    });
  } else {
    Sentry.captureMessage(message, level);
  }
}

/**
 * Get Sentry routing instrumentation for React Navigation
 */
export function getSentryRoutingInstrumentation(): Sentry.ReactNavigationInstrumentation {
  return new Sentry.ReactNavigationInstrumentation();
}
