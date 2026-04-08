import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text as RNText } from 'react-native';
import { Card } from './Card';

describe('Card', () => {
  it('renders with children', () => {
    const { getByText } = render(
      <Card>
        <RNText>Card Content</RNText>
      </Card>
    );
    expect(getByText('Card Content')).toBeTruthy();
  });

  it('renders as touchable when onPress is provided', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <Card onPress={onPress}>
        <RNText>Touchable Card</RNText>
      </Card>
    );
    
    const card = getByRole('button');
    fireEvent.press(card);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders as non-touchable when onPress is not provided', () => {
    const { queryByRole } = render(
      <Card>
        <RNText>Static Card</RNText>
      </Card>
    );
    
    expect(queryByRole('button')).toBeNull();
  });

  it('renders different variants', () => {
    const { rerender, getByText } = render(
      <Card variant="default">
        <RNText>Default</RNText>
      </Card>
    );
    expect(getByText('Default')).toBeTruthy();

    rerender(
      <Card variant="elevated">
        <RNText>Elevated</RNText>
      </Card>
    );
    expect(getByText('Elevated')).toBeTruthy();

    rerender(
      <Card variant="glow">
        <RNText>Glow</RNText>
      </Card>
    );
    expect(getByText('Glow')).toBeTruthy();
  });

  it('renders different glow colors', () => {
    const { rerender, getByText } = render(
      <Card variant="glow" glowColor="cyan">
        <RNText>Cyan Glow</RNText>
      </Card>
    );
    expect(getByText('Cyan Glow')).toBeTruthy();

    rerender(
      <Card variant="glow" glowColor="magenta">
        <RNText>Magenta Glow</RNText>
      </Card>
    );
    expect(getByText('Magenta Glow')).toBeTruthy();
  });

  it('supports custom padding', () => {
    const { getByText } = render(
      <Card padding={8}>
        <RNText>Custom Padding</RNText>
      </Card>
    );
    expect(getByText('Custom Padding')).toBeTruthy();
  });

  it('accepts custom style prop', () => {
    const { getByText } = render(
      <Card style={{ marginTop: 20 }}>
        <RNText>Styled Card</RNText>
      </Card>
    );
    expect(getByText('Styled Card')).toBeTruthy();
  });

  it('supports accessibility label', () => {
    const { getByLabelText } = render(
      <Card onPress={() => {}} accessibilityLabel="Product card">
        <RNText>Product</RNText>
      </Card>
    );
    expect(getByLabelText('Product card')).toBeTruthy();
  });
});
