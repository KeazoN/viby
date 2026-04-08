/**
 * Game Screen (Modal)
 * 
 * Music trivia game session interface.
 * Placeholder; game UI can be filled in incrementally.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function GameScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Music Trivia</Text>
      <Text style={styles.subtitle}>Test your music knowledge</Text>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#999999',
  },
});
