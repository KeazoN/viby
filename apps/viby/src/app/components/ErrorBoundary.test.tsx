/**
 * ErrorBoundary Component Tests
 * 
 * Tests error boundary functionality including:
 * - Error catching and display
 * - Retry functionality
 * - Custom fallback rendering
 * - Error callback invocation
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { ErrorBoundary } from './ErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <Text>No error</Text>;
};

// Suppress console.error for cleaner test output
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <Text>Test content</Text>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeTruthy();
  });

  it('catches errors and displays error screen', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should display error screen with title
    expect(screen.getByText(/Something went wrong/i)).toBeTruthy();
  });

  it('displays retry button when error is caught', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should display retry button
    expect(screen.getByText('Try Again')).toBeTruthy();
  });

  it('resets error state when retry button is pressed', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Error screen should be displayed
    expect(screen.getByText(/Something went wrong/i)).toBeTruthy();

    // Press retry button
    const retryButton = screen.getByText('Try Again');
    fireEvent.press(retryButton);

    // Re-render with no error
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    // Should display normal content
    expect(screen.getByText('No error')).toBeTruthy();
  });

  it('calls onError callback when error is caught', () => {
    const onError = jest.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // onError callback should be called with error and errorInfo
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('renders custom fallback when provided', () => {
    const customFallback = (error: Error, resetError: () => void) => (
      <View>
        <Text>Custom error: {error.message}</Text>
        <Text onPress={resetError}>Custom retry</Text>
      </View>
    );

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should display custom fallback
    expect(screen.getByText('Custom error: Test error')).toBeTruthy();
    expect(screen.getByText('Custom retry')).toBeTruthy();
  });

  it('passes error object to custom fallback', () => {
    const customFallback = jest.fn((error: Error) => (
      <Text>Error: {error.message}</Text>
    ));

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Custom fallback should be called with error and resetError function
    expect(customFallback).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Test error' }),
      expect.any(Function)
    );
  });

  it('allows retry with custom fallback', () => {
    const customFallback = (error: Error, resetError: () => void) => (
      <View>
        <Text>Error occurred</Text>
        <Text testID="custom-retry" onPress={resetError}>
          Retry
        </Text>
      </View>
    );

    const { rerender } = render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Press custom retry button
    const retryButton = screen.getByTestId('custom-retry');
    fireEvent.press(retryButton);

    // Re-render with no error
    rerender(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    // Should display normal content
    expect(screen.getByText('No error')).toBeTruthy();
  });

  it('handles multiple errors correctly', () => {
    const onError = jest.fn();

    const { rerender } = render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // First error
    expect(onError).toHaveBeenCalledTimes(1);

    // Reset and throw again
    const retryButton = screen.getByText('Try Again');
    fireEvent.press(retryButton);

    rerender(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Second error
    expect(onError).toHaveBeenCalledTimes(2);
  });
});
