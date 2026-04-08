/**
 * Match Screen (Modal)
 * 
 * Displays match notification with user profile preview.
 * Placeholder; match flow UI can be expanded later.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function MatchScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>It's a Match!</Text>
      <Text style={styles.subtitle}>You both love the same music</Text>
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00ff88',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#999999',
  },
});
