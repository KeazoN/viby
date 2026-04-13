/**
 * ErrorBoundary Component
 * 
 * Catches React component errors and displays a user-friendly error screen
 * with retry functionality. Integrates with Sentry for error tracking.
 * 
 * Requirements:
 * - 16.1: Implement error boundaries to catch and display React component errors
 * - 16.2: Display user-friendly error screen with retry option
 * - 16.3: Integrate Sentry for crash reporting and error tracking
 */

import React, { Component, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { captureException } from '@viby/shared/monitoring';
import { analyticsTracker } from '@viby/shared/analytics';
import { ErrorScreen } from './ErrorScreen';

interface ErrorBoundaryProps {
  children: ReactNode;
  /**
   * Optional fallback component to render instead of default error screen
   */
  fallback?: (error: Error, resetError: () => void) => ReactNode;
  /**
   * Optional callback when an error is caught
   */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error to console in development
    if (__DEV__) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Send error to Sentry with React component context
    captureException(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });

    // Track crash in analytics
    analyticsTracker.error.trackCrash(
      error.message,
      errorInfo.componentStack || error.stack
    );

    // Call optional error callback
    this.props.onError?.(error, errorInfo);
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  override render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }

      // Default error screen
      return (
        <View style={styles.container}>
          <ErrorScreen
            error={this.state.error}
            onRetry={this.resetError}
          />
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
