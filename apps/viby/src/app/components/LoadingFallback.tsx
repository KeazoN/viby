/**
 * Loading Fallback Component
 * 
 * Displays a loading indicator while lazy-loaded components are being loaded.
 * Used with React.Suspense for code splitting.
 */

import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export function LoadingFallback() {
  return (
    <View style={styles.container} testID="loading-container">
      <ActivityIndicator size="large" color="#00ff88" testID="loading-indicator" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0a0a',
  },
});
