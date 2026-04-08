import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Input } from './Input';

describe('Input', () => {
  it('renders with placeholder', () => {
    const { getByPlaceholderText } = render(
      <Input placeholder="Enter text" />
    );
    expect(getByPlaceholderText('Enter text')).toBeTruthy();
  });

  it('renders with label', () => {
    const { getByText } = render(<Input label="Username" />);
    expect(getByText('USERNAME')).toBeTruthy(); // Label is uppercase
  });

  it('renders with error message', () => {
    const { getByText } = render(<Input error="This field is required" />);
    expect(getByText('This field is required')).toBeTruthy();
  });

  it('renders with helper text', () => {
    const { getByText } = render(<Input helperText="Enter your email address" />);
    expect(getByText('Enter your email address')).toBeTruthy();
  });

  it('calls onChangeText when text changes', () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <Input placeholder="Type here" onChangeText={onChangeText} />
    );
    
    fireEvent.changeText(getByPlaceholderText('Type here'), 'Hello');
    expect(onChangeText).toHaveBeenCalledWith('Hello');
  });

  it('handles focus and blur events', () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    const { getByPlaceholderText } = render(
      <Input placeholder="Focus me" onFocus={onFocus} onBlur={onBlur} />
    );
    
    const input = getByPlaceholderText('Focus me');
    fireEvent(input, 'focus');
    expect(onFocus).toHaveBeenCalled();
    
    fireEvent(input, 'blur');
    expect(onBlur).toHaveBeenCalled();
  });

  it('shows error state when error prop is provided', () => {
    const { getByText } = render(
      <Input label="Email" error="Invalid email" />
    );
    expect(getByText('Invalid email')).toBeTruthy();
  });

  it('supports different validation states', () => {
    const { rerender, getByPlaceholderText } = render(
      <Input placeholder="Input" state="default" />
    );
    expect(getByPlaceholderText('Input')).toBeTruthy();

    rerender(<Input placeholder="Input" state="error" />);
    expect(getByPlaceholderText('Input')).toBeTruthy();

    rerender(<Input placeholder="Input" state="success" />);
    expect(getByPlaceholderText('Input')).toBeTruthy();
  });

  it('supports accessibility label from label prop', () => {
    const { getByLabelText } = render(<Input label="Password" />);
    expect(getByLabelText('Password')).toBeTruthy();
  });

  it('has minimum touch target size', () => {
    const { getByPlaceholderText } = render(
      <Input placeholder="Touch target" />
    );
    const input = getByPlaceholderText('Touch target');
    expect(input.props.style).toMatchObject(
      expect.objectContaining({ minHeight: 44 })
    );
  });

  it('supports secure text entry', () => {
    const { getByPlaceholderText } = render(
      <Input placeholder="Password" secureTextEntry />
    );
    const input = getByPlaceholderText('Password');
    expect(input.props.secureTextEntry).toBe(true);
  });
});
