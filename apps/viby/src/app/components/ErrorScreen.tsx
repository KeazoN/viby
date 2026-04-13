/**
 * ErrorScreen Component
 * 
 * User-friendly error screen displayed when ErrorBoundary catches an error.
 * Provides retry functionality and helpful error information.
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, colors, spacing } from '@viby/shared/design-system';

interface ErrorScreenProps {
  error: Error;
  onRetry: () => void;
}

export function ErrorScreen({ error, onRetry }: ErrorScreenProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Error Icon */}
          <View style={styles.iconContainer}>
            <Text variant="h1" color="error" align="center">
              ⚠️
            </Text>
          </View>

          {/* Error Title */}
          <Text variant="h2" align="center" style={styles.title}>
            Oops! Something went wrong
          </Text>

          {/* Error Description */}
          <Text variant="body" color="secondary" align="center" style={styles.description}>
            We encountered an unexpected error. Don't worry, your data is safe. Try refreshing the app to continue.
          </Text>

          {/* Error Details Card (only in development) */}
          {__DEV__ && (
            <Card variant="elevated" padding={4} style={styles.errorCard}>
              <Text variant="label" color="error" style={styles.errorLabel}>
                Error Details (Dev Only)
              </Text>
              <Text variant="bodySmall" color="secondary" style={styles.errorMessage}>
                {error.message}
              </Text>
              {error.stack && (
                <ScrollView
                  style={styles.stackContainer}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator
                >
                  <Text variant="caption" color="tertiary" style={styles.stackTrace}>
                    {error.stack}
                  </Text>
                </ScrollView>
              )}
            </Card>
          )}

          {/* Retry Button */}
          <Button
            variant="primary"
            size="lg"
            onPress={onRetry}
            fullWidth
            accessibilityLabel="Retry and reload the app"
          >
            Try Again
          </Button>

          {/* Help Text */}
          <Text variant="caption" color="tertiary" align="center" style={styles.helpText}>
            If the problem persists, try restarting the app or contact support.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[8],
  },
  content: {
    alignItems: 'center',
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  iconContainer: {
    marginBottom: spacing[6],
  },
  title: {
    marginBottom: spacing[4],
  },
  description: {
    marginBottom: spacing[8],
  },
  errorCard: {
    width: '100%',
    marginBottom: spacing[6],
  },
  errorLabel: {
    marginBottom: spacing[2],
  },
  errorMessage: {
    marginBottom: spacing[3],
  },
  stackContainer: {
    maxHeight: 200,
    marginTop: spacing[2],
  },
  stackTrace: {
    fontFamily: 'monospace',
  },
  helpText: {
    marginTop: spacing[4],
  },
});
