import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-native';
import { View } from 'react-native';
import { Input } from './Input';
import { Text } from './Text';

const meta = {
  title: 'Components/Input',
  component: Input,
  argTypes: {
    state: {
      control: { type: 'select' },
      options: ['default', 'error', 'success'],
    },
    fullWidth: {
      control: { type: 'boolean' },
    },
  },
  args: {
    state: 'default',
    fullWidth: false,
  },
  decorators: [
    (Story) => (
      <View style={{ padding: 16 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Email',
    placeholder: 'Enter your email',
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Password',
    placeholder: 'Enter your password',
    helperText: 'Must be at least 8 characters',
    secureTextEntry: true,
  },
};

export const WithError: Story = {
  args: {
    label: 'Email',
    placeholder: 'Enter your email',
    error: 'Invalid email address',
    value: 'invalid-email',
  },
};

export const SuccessState: Story = {
  args: {
    label: 'Username',
    placeholder: 'Enter username',
    state: 'success',
    value: 'john_doe',
  },
};

export const FullWidth: Story = {
  args: {
    label: 'Full Name',
    placeholder: 'Enter your full name',
    fullWidth: true,
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled Input',
    placeholder: 'This input is disabled',
    value: 'Cannot edit',
    editable: false,
  },
};

export const Multiline: Story = {
  args: {
    label: 'Bio',
    placeholder: 'Tell us about yourself',
    multiline: true,
    numberOfLines: 4,
  },
};

export const Interactive: Story = {
  render: () => {
    const [value, setValue] = useState('');
    const [error, setError] = useState('');

    const handleChange = (text: string) => {
      setValue(text);
      if (text.length > 0 && text.length < 3) {
        setError('Must be at least 3 characters');
      } else {
        setError('');
      }
    };

    return (
      <Input
        label="Username"
        placeholder="Enter username"
        value={value}
        onChangeText={handleChange}
        error={error}
        fullWidth
      />
    );
  },
};

export const AllStates: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      <Text variant="h3" color="primary">Input States</Text>
      
      <Input
        label="Default State"
        placeholder="Enter text"
      />
      
      <Input
        label="With Helper Text"
        placeholder="Enter text"
        helperText="This is helper text"
      />
      
      <Input
        label="Error State"
        placeholder="Enter text"
        error="This field is required"
      />
      
      <Input
        label="Success State"
        placeholder="Enter text"
        state="success"
        value="Valid input"
      />
      
      <Input
        label="Disabled"
        placeholder="Disabled input"
        value="Cannot edit"
        editable={false}
      />
      
      <Input
        label="Full Width"
        placeholder="Full width input"
        fullWidth
      />
    </View>
  ),
};
