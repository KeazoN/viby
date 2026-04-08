/**
 * Visual Regression Tests for Text Component
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from '../Text';

describe('Text Visual Regression Tests', () => {
  it('should match snapshot for h1 variant', () => {
    const { toJSON } = render(<Text variant="h1">Heading 1</Text>);
    expect(toJSON()).toMatchSnapshot();
  });

  it('should match snapshot for h2 variant', () => {
    const { toJSON } = render(<Text variant="h2">Heading 2</Text>);
    expect(toJSON()).toMatchSnapshot();
  });

  it('should match snapshot for h3 variant', () => {
    const { toJSON } = render(<Text variant="h3">Heading 3</Text>);
    expect(toJSON()).toMatchSnapshot();
  });

  it('should match snapshot for h4 variant', () => {
    const { toJSON } = render(<Text variant="h4">Heading 4</Text>);
    expect(toJSON()).toMatchSnapshot();
  });

  it('should match snapshot for body variant', () => {
    const { toJSON } = render(<Text variant="body">Body text</Text>);
    expect(toJSON()).toMatchSnapshot();
  });

  it('should match snapshot for bodySmall variant', () => {
    const { toJSON } = render(<Text variant="bodySmall">Small body text</Text>);
    expect(toJSON()).toMatchSnapshot();
  });

  it('should match snapshot for caption variant', () => {
    const { toJSON } = render(<Text variant="caption">Caption text</Text>);
    expect(toJSON()).toMatchSnapshot();
  });

  it('should match snapshot for label variant', () => {
    const { toJSON } = render(<Text variant="label">Label Text</Text>);
    expect(toJSON()).toMatchSnapshot();
  });

  it('should match snapshot for primary color', () => {
    const { toJSON } = render(<Text color="primary">Primary color</Text>);
    expect(toJSON()).toMatchSnapshot();
  });

  it('should match snapshot for accent color', () => {
    const { toJSON } = render(<Text color="accent">Accent color</Text>);
    expect(toJSON()).toMatchSnapshot();
  });

  it('should match snapshot for error color', () => {
    const { toJSON } = render(<Text color="error">Error color</Text>);
    expect(toJSON()).toMatchSnapshot();
  });

  it('should match snapshot for center alignment', () => {
    const { toJSON } = render(<Text align="center">Center aligned</Text>);
    expect(toJSON()).toMatchSnapshot();
  });

  it('should match snapshot for bold weight', () => {
    const { toJSON } = render(<Text weight="bold">Bold text</Text>);
    expect(toJSON()).toMatchSnapshot();
  });
});
