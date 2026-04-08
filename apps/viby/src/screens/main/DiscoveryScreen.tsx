/**
 * Discovery Screen
 * 
 * Shows realtime listener feed and track clusters.
 * Discovery experience; iterate on layout and data as needed.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function DiscoveryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Discovery</Text>
      <Text style={styles.subtitle}>See who's listening right now</Text>
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
