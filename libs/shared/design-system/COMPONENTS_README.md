# Design System Base Components

This document describes the base components created for the Viby design system.

## Components

### Button

A versatile button component with multiple variants, sizes, and states.

**Props:**
- `variant`: 'primary' | 'secondary' | 'ghost' (default: 'primary')
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `disabled`: boolean (default: false)
- `loading`: boolean (default: false)
- `fullWidth`: boolean (default: false)
- `onPress`: () => void (required)
- `accessibilityLabel`: string (optional)

**Features:**
- Primary variant with gradient background
- Secondary variant with border
- Ghost variant with transparent background
- Loading state with activity indicator
- Disabled state with visual feedback
- Accessibility support with proper roles and states
- Minimum touch target size (44x44 points)

**Usage:**
```tsx
import { Button } from '@viby/shared/design-system';

<Button variant="primary" size="md" onPress={handlePress}>
  Click Me
</Button>

<Button variant="secondary" loading onPress={handleSubmit}>
  Submit
</Button>
```

### Text

A typography component with predefined variants and styling options.

**Props:**
- `variant`: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'bodySmall' | 'caption' | 'label' (default: 'body')
- `color`: 'primary' | 'secondary' | 'tertiary' | 'disabled' | 'accent' | 'error' | 'success' (default: 'primary')
- `weight`: 'regular' | 'medium' | 'semibold' | 'bold' (optional)
- `align`: 'left' | 'center' | 'right' (default: 'left')
- All standard React Native TextProps

**Features:**
- Predefined typography variants with consistent sizing
- Color variants for different contexts
- Font weight options
- Text alignment support
- Extends React Native Text component

**Usage:**
```tsx
import { Text } from '@viby/shared/design-system';

<Text variant="h1" color="primary">
  Heading
</Text>

<Text variant="body" color="secondary" align="center">
  Body text
</Text>

<Text variant="label" color="accent">
  Label Text
</Text>
```

### Input

A text input component with label, validation states, and helper text.

**Props:**
- `label`: string (optional)
- `error`: string (optional)
- `helperText`: string (optional)
- `state`: 'default' | 'error' | 'success' (default: 'default')
- `fullWidth`: boolean (default: false)
- `containerStyle`: ViewStyle (optional)
- All standard React Native TextInputProps

**Features:**
- Optional label with uppercase styling
- Error message display
- Helper text support
- Validation states with color-coded borders
- Focus state with accent color border
- Minimum touch target size (44 points)
- Accessibility support with live regions for errors

**Usage:**
```tsx
import { Input } from '@viby/shared/design-system';

<Input
  label="Email"
  placeholder="Enter your email"
  error="Invalid email address"
  fullWidth
/>

<Input
  label="Password"
  secureTextEntry
  helperText="Must be at least 8 characters"
/>
```

### Card

A container component with consistent styling and optional interactivity.

**Props:**
- `variant`: 'default' | 'elevated' | 'glow' (default: 'default')
- `glowColor`: 'cyan' | 'magenta' (default: 'cyan', only for glow variant)
- `onPress`: () => void (optional, makes card touchable)
- `padding`: keyof typeof spacing (default: 4)
- `style`: ViewStyle (optional)
- `accessibilityLabel`: string (optional)

**Features:**
- Default variant with flat background
- Elevated variant with shadow
- Glow variant with colored shadow effect
- Optional touch interaction
- Customizable padding
- Accessibility support when touchable

**Usage:**
```tsx
import { Card } from '@viby/shared/design-system';

<Card variant="default">
  <Text>Card content</Text>
</Card>

<Card variant="elevated" onPress={handlePress}>
  <Text>Touchable card</Text>
</Card>

<Card variant="glow" glowColor="cyan" padding={6}>
  <Text>Glowing card</Text>
</Card>
```

## Design Tokens

All components use design tokens from the token system:

- **Colors**: Background, accent, text, status colors
- **Typography**: Font families, sizes, line heights, letter spacing
- **Spacing**: Consistent spacing scale (0-24)
- **Border Radius**: Rounded corner values
- **Shadows**: Elevation and glow effects

## Accessibility

All components follow WCAG AA accessibility standards:

- Minimum touch target size of 44x44 points
- Proper accessibility roles and labels
- Keyboard navigation support (where applicable)
- Screen reader support with descriptive labels
- Color contrast ratios meeting WCAG AA standards
- Accessibility state indicators (disabled, selected, etc.)

## TypeScript Support

All components are fully typed with TypeScript:

- Exported TypeScript interfaces for all props
- Type-safe design token usage
- IntelliSense support in IDEs
- Compile-time type checking

## Exports

All components and their types are exported from the design system:

```typescript
import {
  Button,
  ButtonProps,
  Text,
  TextProps,
  Input,
  InputProps,
  Card,
  CardProps,
} from '@viby/shared/design-system';
```

## Testing

Unit tests are provided for all components covering:

- Rendering with different props
- User interactions (press, focus, blur)
- Accessibility features
- Variant and size options
- Loading and disabled states

Note: Tests require proper React Native testing environment setup with @testing-library/react-native.

## Next Steps

Future enhancements may include:

- Additional components (Avatar, Badge, Modal, Toast)
- Animation presets for transitions
- Theme switching support
- Storybook integration for visual testing
- Additional accessibility features
