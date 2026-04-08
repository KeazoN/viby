/**
 * Visual Regression Tests for Card Component
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { View } from 'react-native';
import { Card } from '../Card';
import { Text } from '../Text';

describe('Card Visual Regression Tests', () => {
  it('should match snapshot for default variant', () => {
    const { toJSON } = render(
      <Card variant="default">
        <Text>Default Card Content</Text>
      </Card>
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('should match snapshot for elevated variant', () => {
    const { toJSON } = render(
      <Card variant="elevated">
        <Text>Elevated Card Content</Text>
      </Card>
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('should match snapshot for glow variant with cyan', () => {
    const { toJSON } = render(
      <Card variant="glow" glowColor="cyan">
        <Text>Glow Card Content</Text>
      </Card>
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('should match snapshot for glow variant with magenta', () => {
    const { toJSON } = render(
      <Card variant="glow" glowColor="magenta">
        <Text>Glow Card Content</Text>
      </Card>
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('should match snapshot with custom padding', () => {
    const { toJSON } = render(
      <Card padding={8}>
        <Text>Custom Padding Card</Text>
      </Card>
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('should match snapshot for touchable card', () => {
    const { toJSON } = render(
      <Card onPress={() => {}}>
        <Text>Touchable Card</Text>
      </Card>
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
