import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { Preview } from '@storybook/react-native';

// Decorator to provide consistent background and padding
const withBackground = (Story: any) => (
  <View style={styles.container}>
    <Story />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    padding: 16,
    justifyContent: 'center',
  },
});

export const decorators = [withBackground];

export const parameters: Preview['parameters'] = {
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
};
