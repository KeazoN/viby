/**
 * Visual Regression Tests for Button Component
 * 
 * These tests capture snapshots of the Button component in various states
 * and compare them against baseline images to detect visual regressions.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { Button } from '../Button';
import { imageSnapshotOptions } from './setup';

describe('Button Visual Regression Tests', () => {
  it('should match snapshot for primary variant', () => {
    const { toJSON } = render(
      <Button variant="primary" onPress={() => {}}>
        Primary Button
      </Button>
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('should match snapshot for secondary variant', () => {
    const { toJSON } = render(
      <Button variant="secondary" onPress={() => {}}>
        Secondary Button
      </Button>
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('should match snapshot for ghost variant', () => {
    const { toJSON } = render(
      <Button variant="ghost" onPress={() => {}}>
        Ghost Button
      </Button>
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('should match snapshot for small size', () => {
    const { toJSON } = render(
      <Button size="sm" onPress={() => {}}>
        Small Button
      </Button>
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('should match snapshot for medium size', () => {
    const { toJSON } = render(
      <Button size="md" onPress={() => {}}>
        Medium Button
      </Button>
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('should match snapshot for large size', () => {
    const { toJSON } = render(
      <Button size="lg" onPress={() => {}}>
        Large Button
      </Button>
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('should match snapshot for disabled state', () => {
    const { toJSON } = render(
      <Button disabled onPress={() => {}}>
        Disabled Button
      </Button>
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('should match snapshot for loading state', () => {
    const { toJSON } = render(
      <Button loading onPress={() => {}}>
        Loading Button
      </Button>
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('should match snapshot for full width', () => {
    const { toJSON } = render(
      <Button fullWidth onPress={() => {}}>
        Full Width Button
      </Button>
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
