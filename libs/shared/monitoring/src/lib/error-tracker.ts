/**
 * Error Tracker Utility
 * 
 * Provides convenient methods for tracking different types of errors
 * with appropriate context and categorization.
 * 
 * Requirements:
 * - 16.4: Log all Backend_API errors with request context
 * - 16.8: Never log sensitive data
 */

import * as Sentry from '@sentry/react-native';
import { addSentryBreadcrumb, captureException, setSentryContext } from './sentry-config';

export class ErrorTracker {
  /**
   * Track API errors with request context
   */
  static trackApiError(
    error: Error,
    context: {
      url: string;
      method: string;
      statusCode?: number;
      responseTime?: number;
    }
  ): void {
    addSentryBreadcrumb(
      `API Error: ${context.method} ${context.url}`,
      'api',
      'error',
      {
        statusCode: context.statusCode,
        responseTime: context.responseTime,
      }
    );

    setSentryContext('api_request', {
      url: context.url,
      method: context.method,
      statusCode: context.statusCode,
      responseTime: context.responseTime,
    });

    Sentry.withScope(scope => {
      scope.setTag('error_type', 'api_error');
      scope.setTag('http_status', context.statusCode?.toString() || 'unknown');
      captureException(error);
    });
  }

  /**
   * Track WebSocket errors
   */
  static trackWebSocketError(
    error: Error,
    context: {
      event?: string;
      connectionStatus: string;
      reconnectAttempts?: number;
    }
  ): void {
    addSentryBreadcrumb(
      `WebSocket Error: ${context.event || 'connection'}`,
      'websocket',
      'error',
      {
        connectionStatus: context.connectionStatus,
        reconnectAttempts: context.reconnectAttempts,
      }
    );

    setSentryContext('websocket', {
      event: context.event,
      connectionStatus: context.connectionStatus,
      reconnectAttempts: context.reconnectAttempts,
    });

    Sentry.withScope(scope => {
      scope.setTag('error_type', 'websocket_error');
      scope.setTag('connection_status', context.connectionStatus);
      captureException(error);
    });
  }

  /**
   * Track navigation errors
   */
  static trackNavigationError(
    error: Error,
    context: {
      route?: string;
      params?: Record<string, any>;
    }
  ): void {
    addSentryBreadcrumb(
      `Navigation Error: ${context.route || 'unknown'}`,
      'navigation',
      'error'
    );

    setSentryContext('navigation', {
      route: context.route,
      // Don't include params as they might contain sensitive data
    });

    Sentry.withScope(scope => {
      scope.setTag('error_type', 'navigation_error');
      captureException(error);
    });
  }

  /**
   * Track state management errors
   */
  static trackStateError(
    error: Error,
    context: {
      store: string;
      action?: string;
    }
  ): void {
    addSentryBreadcrumb(
      `State Error: ${context.store}`,
      'state',
      'error',
      {
        action: context.action,
      }
    );

    setSentryContext('state', {
      store: context.store,
      action: context.action,
    });

    Sentry.withScope(scope => {
      scope.setTag('error_type', 'state_error');
      scope.setTag('store', context.store);
      captureException(error);
    });
  }

  /**
   * Track authentication errors
   */
  static trackAuthError(
    error: Error,
    context: {
      flow: 'login' | 'logout' | 'refresh' | 'oauth';
      provider?: string;
    }
  ): void {
    addSentryBreadcrumb(
      `Auth Error: ${context.flow}`,
      'auth',
      'error',
      {
        provider: context.provider,
      }
    );

    setSentryContext('auth', {
      flow: context.flow,
      provider: context.provider,
    });

    Sentry.withScope(scope => {
      scope.setTag('error_type', 'auth_error');
      scope.setTag('auth_flow', context.flow);
      captureException(error);
    });
  }

  /**
   * Track game session errors
   */
  static trackGameError(
    error: Error,
    context: {
      roomId?: string;
      round?: number;
      action?: string;
    }
  ): void {
    addSentryBreadcrumb(
      `Game Error: ${context.action || 'unknown'}`,
      'game',
      'error',
      {
        round: context.round,
      }
    );

    setSentryContext('game', {
      // Don't include roomId as it might be sensitive
      round: context.round,
      action: context.action,
    });

    Sentry.withScope(scope => {
      scope.setTag('error_type', 'game_error');
      captureException(error);
    });
  }

  /**
   * Track chat errors
   */
  static trackChatError(
    error: Error,
    context: {
      roomId?: string;
      action?: string;
    }
  ): void {
    addSentryBreadcrumb(
      `Chat Error: ${context.action || 'unknown'}`,
      'chat',
      'error'
    );

    setSentryContext('chat', {
      // Don't include roomId as it might be sensitive
      action: context.action,
    });

    Sentry.withScope(scope => {
      scope.setTag('error_type', 'chat_error');
      captureException(error);
    });
  }

  /**
   * Track performance issues
   */
  static trackPerformanceIssue(
    message: string,
    context: {
      metric: string;
      value: number;
      threshold: number;
    }
  ): void {
    addSentryBreadcrumb(
      `Performance Issue: ${message}`,
      'performance',
      'warning',
      {
        metric: context.metric,
        value: context.value,
        threshold: context.threshold,
      }
    );

    Sentry.withScope(scope => {
      scope.setTag('issue_type', 'performance');
      scope.setTag('metric', context.metric);
      scope.setLevel('warning');
      Sentry.captureMessage(message, 'warning');
    });
  }
}
