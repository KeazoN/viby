/**
 * OAuth Callback Screen
 * 
 * Handles OAuth callback and token exchange.
 * OAuth callback handling; extend for provider-specific edge cases.
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

export function OAuthCallbackScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#00ff88" />
      <Text style={styles.text}>Authenticating...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#ffffff',
  },
});
