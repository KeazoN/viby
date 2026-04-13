/**
 * ErrorScreen Component Tests
 * 
 * Tests the error screen UI including:
 * - Error message display
 * - Retry button functionality
 * - Accessibility
 * - Development mode error details
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ErrorScreen } from './ErrorScreen';

describe('ErrorScreen', () => {
  const mockError = new Error('Test error message');
  const mockOnRetry = jest.fn();

  beforeEach(() => {
    mockOnRetry.mockClear();
  });

  it('renders error screen with title', () => {
    render(<ErrorScreen error={mockError} onRetry={mockOnRetry} />);

    expect(screen.getByText(/Something went wrong/i)).toBeTruthy();
  });

  it('renders error icon', () => {
    render(<ErrorScreen error={mockError} onRetry={mockOnRetry} />);

    expect(screen.getByText('⚠️')).toBeTruthy();
  });

  it('renders user-friendly description', () => {
    render(<ErrorScreen error={mockError} onRetry={mockOnRetry} />);

    expect(
      screen.getByText(/We encountered an unexpected error/i)
    ).toBeTruthy();
  });

  it('renders retry button', () => {
    render(<ErrorScreen error={mockError} onRetry={mockOnRetry} />);

    const retryButton = screen.getByText('Try Again');
    expect(retryButton).toBeTruthy();
  });

  it('calls onRetry when retry button is pressed', () => {
    render(<ErrorScreen error={mockError} onRetry={mockOnRetry} />);

    const retryButton = screen.getByText('Try Again');
    fireEvent.press(retryButton);

    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  it('renders help text', () => {
    render(<ErrorScreen error={mockError} onRetry={mockOnRetry} />);

    expect(
      screen.getByText(/If the problem persists/i)
    ).toBeTruthy();
  });

  it('has accessible retry button', () => {
    render(<ErrorScreen error={mockError} onRetry={mockOnRetry} />);

    const retryButton = screen.getByLabelText('Retry and reload the app');
    expect(retryButton).toBeTruthy();
  });

  it('displays error message in development mode', () => {
    // Mock __DEV__ to be true
    const originalDev = global.__DEV__;
    global.__DEV__ = true;

    render(<ErrorScreen error={mockError} onRetry={mockOnRetry} />);

    expect(screen.getByText('Test error message')).toBeTruthy();

    // Restore original value
    global.__DEV__ = originalDev;
  });

  it('displays error stack trace in development mode', () => {
    // Mock __DEV__ to be true
    const originalDev = global.__DEV__;
    global.__DEV__ = true;

    const errorWithStack = new Error('Test error');
    errorWithStack.stack = 'Error: Test error\n    at TestComponent';

    render(<ErrorScreen error={errorWithStack} onRetry={mockOnRetry} />);

    expect(screen.getByText(/at TestComponent/)).toBeTruthy();

    // Restore original value
    global.__DEV__ = originalDev;
  });

  it('does not display error details in production mode', () => {
    // Mock __DEV__ to be false
    const originalDev = global.__DEV__;
    global.__DEV__ = false;

    render(<ErrorScreen error={mockError} onRetry={mockOnRetry} />);

    // Error details card should not be present
    expect(screen.queryByText('Error Details (Dev Only)')).toBeNull();
    expect(screen.queryByText('Test error message')).toBeNull();

    // Restore original value
    global.__DEV__ = originalDev;
  });

  it('handles errors without stack trace', () => {
    const originalDev = global.__DEV__;
    global.__DEV__ = true;

    const errorWithoutStack = new Error('Test error');
    errorWithoutStack.stack = undefined;

    render(<ErrorScreen error={errorWithoutStack} onRetry={mockOnRetry} />);

    // Should still render error message
    expect(screen.getByText('Test error')).toBeTruthy();

    global.__DEV__ = originalDev;
  });

  it('renders scrollable content', () => {
    const { UNSAFE_getByType } = render(
      <ErrorScreen error={mockError} onRetry={mockOnRetry} />
    );

    // Should have ScrollView for scrollable content
    const scrollView = UNSAFE_getByType(require('react-native').ScrollView);
    expect(scrollView).toBeTruthy();
  });
});
