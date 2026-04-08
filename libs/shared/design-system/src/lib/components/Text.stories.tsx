import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native';
import { View } from 'react-native';
import { Text } from './Text';

const meta = {
  title: 'Components/Text',
  component: Text,
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['h1', 'h2', 'h3', 'h4', 'body', 'bodySmall', 'caption', 'label'],
    },
    color: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'tertiary', 'disabled', 'accent', 'error', 'success'],
    },
    weight: {
      control: { type: 'select' },
      options: ['regular', 'medium', 'semibold', 'bold'],
    },
    align: {
      control: { type: 'select' },
      options: ['left', 'center', 'right'],
    },
  },
  args: {
    variant: 'body',
    color: 'primary',
    align: 'left',
  },
  decorators: [
    (Story) => (
      <View style={{ padding: 16 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof Text>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Heading1: Story = {
  args: {
    variant: 'h1',
    children: 'Heading 1',
  },
};

export const Heading2: Story = {
  args: {
    variant: 'h2',
    children: 'Heading 2',
  },
};

export const Heading3: Story = {
  args: {
    variant: 'h3',
    children: 'Heading 3',
  },
};

export const Heading4: Story = {
  args: {
    variant: 'h4',
    children: 'Heading 4',
  },
};

export const Body: Story = {
  args: {
    variant: 'body',
    children: 'This is body text. It is used for regular content and paragraphs.',
  },
};

export const BodySmall: Story = {
  args: {
    variant: 'bodySmall',
    children: 'This is small body text. It is used for secondary content.',
  },
};

export const Caption: Story = {
  args: {
    variant: 'caption',
    children: 'This is caption text. It is used for small annotations.',
  },
};

export const Label: Story = {
  args: {
    variant: 'label',
    children: 'Label Text',
  },
};

export const ColorPrimary: Story = {
  args: {
    color: 'primary',
    children: 'Primary color text',
  },
};

export const ColorSecondary: Story = {
  args: {
    color: 'secondary',
    children: 'Secondary color text',
  },
};

export const ColorAccent: Story = {
  args: {
    color: 'accent',
    children: 'Accent color text',
  },
};

export const ColorError: Story = {
  args: {
    color: 'error',
    children: 'Error color text',
  },
};

export const ColorSuccess: Story = {
  args: {
    color: 'success',
    children: 'Success color text',
  },
};

export const AlignCenter: Story = {
  args: {
    align: 'center',
    children: 'Center aligned text',
  },
};

export const AlignRight: Story = {
  args: {
    align: 'right',
    children: 'Right aligned text',
  },
};

export const CustomWeight: Story = {
  args: {
    variant: 'body',
    weight: 'bold',
    children: 'Bold weight text',
  },
};

export const AllVariants: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <Text variant="h1" color="primary">Heading 1</Text>
      <Text variant="h2" color="primary">Heading 2</Text>
      <Text variant="h3" color="primary">Heading 3</Text>
      <Text variant="h4" color="primary">Heading 4</Text>
      <Text variant="body" color="primary">Body text - regular content</Text>
      <Text variant="bodySmall" color="secondary">Body small - secondary content</Text>
      <Text variant="caption" color="tertiary">Caption - small annotations</Text>
      <Text variant="label" color="accent">Label Text</Text>
    </View>
  ),
};

export const AllColors: Story = {
  render: () => (
    <View style={{ gap: 8 }}>
      <Text variant="h4" color="primary">Text Colors</Text>
      <Text color="primary">Primary color</Text>
      <Text color="secondary">Secondary color</Text>
      <Text color="tertiary">Tertiary color</Text>
      <Text color="disabled">Disabled color</Text>
      <Text color="accent">Accent color</Text>
      <Text color="error">Error color</Text>
      <Text color="success">Success color</Text>
    </View>
  ),
};

export const AllAlignments: Story = {
  render: () => (
    <View style={{ gap: 8 }}>
      <Text variant="h4" color="primary">Text Alignments</Text>
      <Text align="left">Left aligned text</Text>
      <Text align="center">Center aligned text</Text>
      <Text align="right">Right aligned text</Text>
    </View>
  ),
};

export const AllWeights: Story = {
  render: () => (
    <View style={{ gap: 8 }}>
      <Text variant="h4" color="primary">Font Weights</Text>
      <Text weight="regular">Regular weight</Text>
      <Text weight="medium">Medium weight</Text>
      <Text weight="semibold">Semibold weight</Text>
      <Text weight="bold">Bold weight</Text>
    </View>
  ),
};
