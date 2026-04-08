/**
 * Visual Regression Tests for Input Component
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { Input } from '../Input';

describe('Input Visual Regression Tests', () => {
  it('should match snapshot for default state', () => {
    const { toJSON } = render(
      <Input label="Email" placeholder="Enter your email" />
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('should match snapshot with helper text', () => {
    const { toJSON } = render(
      <Input
        label="Password"
        placeholder="Enter password"
        helperText="Must be at least 8 characters"
      />
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('should match snapshot with error', () => {
    const { toJSON } = render(
      <Input
        label="Email"
        placeholder="Enter email"
        error="Invalid email address"
      />
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('should match snapshot for success state', () => {
    const { toJSON } = render(
      <Input
        label="Username"
        placeholder="Enter username"
        state="success"
        value="john_doe"
      />
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('should match snapshot for disabled state', () => {
    const { toJSON } = render(
      <Input
        label="Disabled"
        placeholder="Cannot edit"
        value="Disabled value"
        editable={false}
      />
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('should match snapshot for full width', () => {
    const { toJSON } = render(
      <Input label="Full Width" placeholder="Full width input" fullWidth />
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
