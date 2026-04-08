import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from './Button';

describe('Button', () => {
  it('renders with children text', () => {
    const { getByText } = render(<Button onPress={() => {}}>Click me</Button>);
    expect(getByText('Click me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByRole } = render(<Button onPress={onPress}>Press</Button>);
    
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <Button onPress={onPress} disabled>
        Disabled
      </Button>
    );
    
    fireEvent.press(getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows loading indicator when loading', () => {
    const { getByRole, queryByText } = render(
      <Button onPress={() => {}} loading>
        Submit
      </Button>
    );
    
    expect(getByRole('button')).toBeTruthy();
    expect(queryByText('Submit')).toBeNull();
  });

  it('renders primary variant by default', () => {
    const { getByRole } = render(<Button onPress={() => {}}>Primary</Button>);
    expect(getByRole('button')).toBeTruthy();
  });

  it('renders secondary variant', () => {
    const { getByRole } = render(
      <Button onPress={() => {}} variant="secondary">
        Secondary
      </Button>
    );
    expect(getByRole('button')).toBeTruthy();
  });

  it('renders ghost variant', () => {
    const { getByRole } = render(
      <Button onPress={() => {}} variant="ghost">
        Ghost
      </Button>
    );
    expect(getByRole('button')).toBeTruthy();
  });

  it('renders different sizes', () => {
    const { rerender, getByRole } = render(
      <Button onPress={() => {}} size="sm">
        Small
      </Button>
    );
    expect(getByRole('button')).toBeTruthy();

    rerender(
      <Button onPress={() => {}} size="md">
        Medium
      </Button>
    );
    expect(getByRole('button')).toBeTruthy();

    rerender(
      <Button onPress={() => {}} size="lg">
        Large
      </Button>
    );
    expect(getByRole('button')).toBeTruthy();
  });

  it('supports accessibility label', () => {
    const { getByLabelText } = render(
      <Button onPress={() => {}} accessibilityLabel="Submit form">
        Submit
      </Button>
    );
    expect(getByLabelText('Submit form')).toBeTruthy();
  });

  it('has correct accessibility state when disabled', () => {
    const { getByRole } = render(
      <Button onPress={() => {}} disabled>
        Disabled
      </Button>
    );
    const button = getByRole('button');
    expect(button.props.accessibilityState.disabled).toBe(true);
  });
});
