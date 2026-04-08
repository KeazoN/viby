import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native';
import { View } from 'react-native';
import { Card } from './Card';
import { Text } from './Text';

const meta = {
  title: 'Components/Card',
  component: Card,
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'elevated', 'glow'],
    },
    glowColor: {
      control: { type: 'select' },
      options: ['cyan', 'magenta'],
    },
    padding: {
      control: { type: 'select' },
      options: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24],
    },
  },
  args: {
    variant: 'default',
    glowColor: 'cyan',
    padding: 4,
  },
  decorators: [
    (Story) => (
      <View style={{ padding: 16 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: 'default',
    children: (
      <View>
        <Text variant="h4" color="primary">Default Card</Text>
        <Text variant="body" color="secondary" style={{ marginTop: 8 }}>
          This is a default card with flat background.
        </Text>
      </View>
    ),
  },
};

export const Elevated: Story = {
  args: {
    variant: 'elevated',
    children: (
      <View>
        <Text variant="h4" color="primary">Elevated Card</Text>
        <Text variant="body" color="secondary" style={{ marginTop: 8 }}>
          This card has a shadow for elevation effect.
        </Text>
      </View>
    ),
  },
};

export const GlowCyan: Story = {
  args: {
    variant: 'glow',
    glowColor: 'cyan',
    children: (
      <View>
        <Text variant="h4" color="primary">Glow Card (Cyan)</Text>
        <Text variant="body" color="secondary" style={{ marginTop: 8 }}>
          This card has a cyan glow effect.
        </Text>
      </View>
    ),
  },
};

export const GlowMagenta: Story = {
  args: {
    variant: 'glow',
    glowColor: 'magenta',
    children: (
      <View>
        <Text variant="h4" color="primary">Glow Card (Magenta)</Text>
        <Text variant="body" color="secondary" style={{ marginTop: 8 }}>
          This card has a magenta glow effect.
        </Text>
      </View>
    ),
  },
};

export const Touchable: Story = {
  args: {
    variant: 'elevated',
    onPress: () => console.log('Card pressed'),
    children: (
      <View>
        <Text variant="h4" color="primary">Touchable Card</Text>
        <Text variant="body" color="secondary" style={{ marginTop: 8 }}>
          Tap this card to trigger an action.
        </Text>
      </View>
    ),
  },
};

export const CustomPadding: Story = {
  args: {
    variant: 'default',
    padding: 8,
    children: (
      <View>
        <Text variant="h4" color="primary">Custom Padding</Text>
        <Text variant="body" color="secondary" style={{ marginTop: 8 }}>
          This card has custom padding (8).
        </Text>
      </View>
    ),
  },
};

export const AllVariants: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      <Text variant="h3" color="primary">Card Variants</Text>
      
      <Card variant="default">
        <Text variant="h4" color="primary">Default</Text>
        <Text variant="body" color="secondary" style={{ marginTop: 4 }}>
          Flat background card
        </Text>
      </Card>
      
      <Card variant="elevated">
        <Text variant="h4" color="primary">Elevated</Text>
        <Text variant="body" color="secondary" style={{ marginTop: 4 }}>
          Card with shadow
        </Text>
      </Card>
      
      <Card variant="glow" glowColor="cyan">
        <Text variant="h4" color="primary">Glow (Cyan)</Text>
        <Text variant="body" color="secondary" style={{ marginTop: 4 }}>
          Card with cyan glow
        </Text>
      </Card>
      
      <Card variant="glow" glowColor="magenta">
        <Text variant="h4" color="primary">Glow (Magenta)</Text>
        <Text variant="body" color="secondary" style={{ marginTop: 4 }}>
          Card with magenta glow
        </Text>
      </Card>
      
      <Card variant="elevated" onPress={() => console.log('Pressed')}>
        <Text variant="h4" color="primary">Touchable</Text>
        <Text variant="body" color="secondary" style={{ marginTop: 4 }}>
          Tap to interact
        </Text>
      </Card>
    </View>
  ),
};
