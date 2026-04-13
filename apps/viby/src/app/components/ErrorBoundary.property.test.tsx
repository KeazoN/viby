/**
 * ErrorBoundary Property-Based Tests
 * 
 * Property tests for error boundary behavior using fast-check.
 * These tests verify universal properties hold across many generated inputs.
 */

import * as fc from 'fast-check';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ErrorBoundary } from './ErrorBoundary';

// Component that throws an error based on props
const ThrowError = ({ shouldThrow, errorMessage }: { shouldThrow: boolean; errorMessage?: string }) => {
  if (shouldThrow) {
    throw new Error(errorMessage || 'Test error');
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

describe('ErrorBoundary - Property Tests', () => {
  /**
   * Property 29: Error Boundary Display
   * 
   * Universal Property: For any React component error caught by error boundary,
   * a user-friendly error screen with retry option should be displayed.
   * 
   * **Validates: Requirements 16.2**
   */
  describe('Property 29: Error Boundary Display', () => {
    it('should display user-friendly error screen for any error message', () => {
      fc.assert(
        fc.property(
          // Generate various error messages
          fc.string({ minLength: 1, maxLength: 200 }),
          (errorMessage) => {
            const { unmount } = render(
              <ErrorBoundary>
                <ThrowError shouldThrow={true} errorMessage={errorMessage} />
              </ErrorBoundary>
            );

            // Should display user-friendly error screen
            expect(screen.getByText(/Something went wrong/i)).toBeTruthy();
            
            // Should NOT display the raw error message to users (only in dev mode)
            // The error screen should be user-friendly, not technical
            
            unmount();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should always display retry button when error is caught', () => {
      fc.assert(
        fc.property(
          // Generate various error messages
          fc.string({ minLength: 1, maxLength: 200 }),
          (errorMessage) => {
            const { unmount } = render(
              <ErrorBoundary>
                <ThrowError shouldThrow={true} errorMessage={errorMessage} />
              </ErrorBoundary>
            );

            // Should always display retry button
            const retryButton = screen.getByText('Try Again');
            expect(retryButton).toBeTruthy();
            
            unmount();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should reset error state when retry is pressed for any error', () => {
      fc.assert(
        fc.property(
          // Generate various error messages
          fc.string({ minLength: 1, maxLength: 200 }),
          (errorMessage) => {
            const { rerender, unmount } = render(
              <ErrorBoundary>
                <ThrowError shouldThrow={true} errorMessage={errorMessage} />
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
                <ThrowError shouldThrow={false} errorMessage={errorMessage} />
              </ErrorBoundary>
            );

            // Should display normal content after retry
            expect(screen.getByText('No error')).toBeTruthy();
            
            unmount();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle multiple consecutive errors with retry', () => {
      fc.assert(
        fc.property(
          // Generate array of error messages
          fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 2, maxLength: 5 }),
          (errorMessages) => {
            let currentErrorIndex = 0;
            
            const { rerender, unmount } = render(
              <ErrorBoundary>
                <ThrowError shouldThrow={true} errorMessage={errorMessages[currentErrorIndex]} />
              </ErrorBoundary>
            );

            // For each error message, verify error screen and retry functionality
            for (let i = 0; i < errorMessages.length; i++) {
              // Error screen should be displayed
              expect(screen.getByText(/Something went wrong/i)).toBeTruthy();
              expect(screen.getByText('Try Again')).toBeTruthy();

              // Press retry button
              const retryButton = screen.getByText('Try Again');
              fireEvent.press(retryButton);

              // Move to next error or success
              currentErrorIndex++;
              const shouldThrow = currentErrorIndex < errorMessages.length;
              
              rerender(
                <ErrorBoundary>
                  <ThrowError 
                    shouldThrow={shouldThrow} 
                    errorMessage={shouldThrow ? errorMessages[currentErrorIndex] : undefined} 
                  />
                </ErrorBoundary>
              );

              if (!shouldThrow) {
                // Last retry should show normal content
                expect(screen.getByText('No error')).toBeTruthy();
              }
            }
            
            unmount();
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should invoke onError callback for any error', () => {
      fc.assert(
        fc.property(
          // Generate various error messages
          fc.string({ minLength: 1, maxLength: 200 }),
          (errorMessage) => {
            const onError = jest.fn();

            const { unmount } = render(
              <ErrorBoundary onError={onError}>
                <ThrowError shouldThrow={true} errorMessage={errorMessage} />
              </ErrorBoundary>
            );

            // onError callback should be called with error and errorInfo
            expect(onError).toHaveBeenCalledTimes(1);
            expect(onError).toHaveBeenCalledWith(
              expect.objectContaining({ message: errorMessage }),
              expect.objectContaining({
                componentStack: expect.any(String),
              })
            );
            
            unmount();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should render custom fallback with retry for any error', () => {
      fc.assert(
        fc.property(
          // Generate various error messages
          fc.string({ minLength: 1, maxLength: 200 }),
          (errorMessage) => {
            const customFallback = (error: Error, resetError: () => void) => (
              <Text testID="custom-error" onPress={resetError}>
                Custom error handler
              </Text>
            );

            const { rerender, unmount } = render(
              <ErrorBoundary fallback={customFallback}>
                <ThrowError shouldThrow={true} errorMessage={errorMessage} />
              </ErrorBoundary>
            );

            // Should display custom fallback
            expect(screen.getByTestId('custom-error')).toBeTruthy();

            // Press custom retry
            const customRetry = screen.getByTestId('custom-error');
            fireEvent.press(customRetry);

            // Re-render with no error
            rerender(
              <ErrorBoundary fallback={customFallback}>
                <ThrowError shouldThrow={false} errorMessage={errorMessage} />
              </ErrorBoundary>
            );

            // Should display normal content
            expect(screen.getByText('No error')).toBeTruthy();
            
            unmount();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should maintain error boundary isolation across multiple instances', () => {
      fc.assert(
        fc.property(
          // Generate two different error messages
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          (errorMessage1, errorMessage2) => {
            const { unmount } = render(
              <>
                <ErrorBoundary>
                  <ThrowError shouldThrow={true} errorMessage={errorMessage1} />
                </ErrorBoundary>
                <ErrorBoundary>
                  <ThrowError shouldThrow={true} errorMessage={errorMessage2} />
                </ErrorBoundary>
              </>
            );

            // Both error boundaries should display error screens independently
            const errorScreens = screen.getAllByText(/Something went wrong/i);
            expect(errorScreens).toHaveLength(2);

            // Both should have retry buttons
            const retryButtons = screen.getAllByText('Try Again');
            expect(retryButtons).toHaveLength(2);
            
            unmount();
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should handle errors with special characters in messages', () => {
      fc.assert(
        fc.property(
          // Generate error messages with special characters
          fc.string({ minLength: 1, maxLength: 200 }),
          fc.constantFrom('!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '<', '>', '/', '\\'),
          (baseMessage, specialChar) => {
            const errorMessage = `${baseMessage}${specialChar}${baseMessage}`;
            
            const { unmount } = render(
              <ErrorBoundary>
                <ThrowError shouldThrow={true} errorMessage={errorMessage} />
              </ErrorBoundary>
            );

            // Should still display user-friendly error screen
            expect(screen.getByText(/Something went wrong/i)).toBeTruthy();
            expect(screen.getByText('Try Again')).toBeTruthy();
            
            unmount();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should preserve retry functionality after multiple error-retry cycles', () => {
      fc.assert(
        fc.property(
          // Generate number of error-retry cycles
          fc.integer({ min: 1, max: 5 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          (cycles, errorMessage) => {
            const { rerender, unmount } = render(
              <ErrorBoundary>
                <ThrowError shouldThrow={true} errorMessage={errorMessage} />
              </ErrorBoundary>
            );

            // Perform multiple error-retry cycles
            for (let i = 0; i < cycles; i++) {
              // Verify error screen is displayed
              expect(screen.getByText(/Something went wrong/i)).toBeTruthy();
              
              // Press retry
              const retryButton = screen.getByText('Try Again');
              fireEvent.press(retryButton);

              // Re-render with error again (except last cycle)
              const shouldThrow = i < cycles - 1;
              rerender(
                <ErrorBoundary>
                  <ThrowError shouldThrow={shouldThrow} errorMessage={errorMessage} />
                </ErrorBoundary>
              );
            }

            // After all cycles, should show normal content
            expect(screen.getByText('No error')).toBeTruthy();
            
            unmount();
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
