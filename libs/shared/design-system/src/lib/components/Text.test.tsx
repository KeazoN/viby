import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from './Text';

describe('Text', () => {
  it('renders with children text', () => {
    const { getByText } = render(<Text>Hello World</Text>);
    expect(getByText('Hello World')).toBeTruthy();
  });

  it('renders different variants', () => {
    const variants: Array<'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'bodySmall' | 'caption' | 'label'> = [
      'h1',
      'h2',
      'h3',
      'h4',
      'body',
      'bodySmall',
      'caption',
      'label',
    ];

    variants.forEach((variant) => {
      const { getByText } = render(<Text variant={variant}>Text</Text>);
      expect(getByText('Text')).toBeTruthy();
    });
  });

  it('renders different colors', () => {
    const colors: Array<'primary' | 'secondary' | 'tertiary' | 'disabled' | 'accent' | 'error' | 'success'> = [
      'primary',
      'secondary',
      'tertiary',
      'disabled',
      'accent',
      'error',
      'success',
    ];

    colors.forEach((color) => {
      const { getByText } = render(<Text color={color}>Text</Text>);
      expect(getByText('Text')).toBeTruthy();
    });
  });

  it('renders different weights', () => {
    const weights: Array<'regular' | 'medium' | 'semibold' | 'bold'> = [
      'regular',
      'medium',
      'semibold',
      'bold',
    ];

    weights.forEach((weight) => {
      const { getByText } = render(<Text weight={weight}>Text</Text>);
      expect(getByText('Text')).toBeTruthy();
    });
  });

  it('renders different alignments', () => {
    const alignments: Array<'left' | 'center' | 'right'> = ['left', 'center', 'right'];

    alignments.forEach((align) => {
      const { getByText } = render(<Text align={align}>Text</Text>);
      expect(getByText('Text')).toBeTruthy();
    });
  });

  it('accepts custom style prop', () => {
    const { getByText } = render(
      <Text style={{ marginTop: 10 }}>Styled Text</Text>
    );
    expect(getByText('Styled Text')).toBeTruthy();
  });

  it('passes through additional TextProps', () => {
    const { getByText } = render(
      <Text numberOfLines={1} ellipsizeMode="tail">
        Long text that should be truncated
      </Text>
    );
    expect(getByText('Long text that should be truncated')).toBeTruthy();
  });
});
