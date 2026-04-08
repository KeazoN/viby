# Animation Presets

Animation presets for the Viby design system using React Native Reanimated 3.

## Overview

This module provides ready-to-use animation configurations and presets that support the dark theme with neon accents aesthetic. All animations are optimized for 60 FPS performance on both iOS and Android.

## Installation

The animation presets are part of the `@viby/shared/design-system` package and are automatically available when you import from the design system.

```typescript
import { animationPresets, springConfigs, timingConfigs } from '@viby/shared/design-system';
```

## Spring Configurations

Spring animations provide natural, physics-based motion. Use these for interactive elements and smooth transitions.

### Available Configurations

- **default**: Balanced damping and stiffness for most UI interactions
- **gentle**: Smooth, slow motion for large elements or subtle animations
- **bouncy**: Energetic, playful motion for attention-grabbing elements
- **stiff**: Quick, snappy motion for small elements or quick feedback
- **slow**: Deliberate, smooth motion for large modals or screen transitions

### Example

```typescript
import { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { springConfigs } from '@viby/shared/design-system';

const scale = useSharedValue(0);

// Animate with bouncy spring
scale.value = withSpring(1, springConfigs.bouncy);
```

## Timing Configurations

Timing animations provide precise, controlled motion. Use these for predictable transitions and loading states.

### Available Configurations

- **fast**: 150ms for micro-interactions and quick feedback
- **normal**: 300ms for standard UI transitions
- **slow**: 500ms for emphasis or complex animations
- **linear**: No easing for continuous animations or loading indicators
- **easeIn**: Acceleration for elements entering the screen
- **easeOut**: Deceleration for elements exiting the screen
- **easeInOut**: Smooth acceleration and deceleration

### Example

```typescript
import { useSharedValue } from 'react-native-reanimated';
import { timingConfigs } from '@viby/shared/design-system';

const opacity = useSharedValue(0);

// Animate with fast timing
opacity.value = withTiming(1, timingConfigs.fast);
```

## Animation Presets

Ready-to-use animation functions for common UI patterns.

### Fade Animations

#### fadeIn()

Animates opacity from 0 to 1.

```typescript
import { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import { animationPresets } from '@viby/shared/design-system';

function FadeInComponent() {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = animationPresets.fadeIn();
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.View style={animatedStyle}>Content</Animated.View>;
}
```

#### fadeOut()

Animates opacity from 1 to 0.

```typescript
const opacity = useSharedValue(1);

const handleDismiss = () => {
  opacity.value = animationPresets.fadeOut();
};
```

### Slide Animations

#### slideInRight(screenWidth, config?)

Animates translateX from screen width to 0.

```typescript
import { useWindowDimensions } from 'react-native';

const { width } = useWindowDimensions();
const translateX = useSharedValue(width);

useEffect(() => {
  translateX.value = animationPresets.slideInRight(width);
}, []);

const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ translateX: translateX.value }],
}));
```

#### slideInLeft(screenWidth, config?)

Animates translateX from negative screen width to 0.

#### slideInTop(screenHeight, config?)

Animates translateY from negative screen height to 0.

#### slideInBottom(screenHeight, config?)

Animates translateY from screen height to 0.

### Scale Animations

#### pulse(scale?, config?)

Scales element up and down in a loop. Perfect for attention-grabbing elements.

```typescript
const scale = useSharedValue(1);

useEffect(() => {
  scale.value = animationPresets.pulse(1.1);
}, []);

const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: scale.value }],
}));
```

#### bounce(config?)

Scales element with a bouncy effect.

```typescript
const scale = useSharedValue(0);

useEffect(() => {
  scale.value = animationPresets.bounce();
}, []);
```

#### scaleIn(config?)

Scales element from 0 to 1.

#### scaleOut(config?)

Scales element from 1 to 0.

### Feedback Animations

#### shake(distance?, config?)

Moves element left and right rapidly. Great for error feedback.

```typescript
const translateX = useSharedValue(0);

const handleError = () => {
  translateX.value = animationPresets.shake(10);
};

const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ translateX: translateX.value }],
}));
```

#### rotate(duration?)

Rotates element 360 degrees continuously.

```typescript
const rotation = useSharedValue(0);

useEffect(() => {
  rotation.value = animationPresets.rotate(1000);
}, []);

const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ rotate: `${rotation.value}deg` }],
}));
```

### Combined Animations

#### slideAndFadeIn(distance?, config?)

Combines slide and fade for a smooth entrance. Returns both translateY and opacity values.

```typescript
const translateY = useSharedValue(20);
const opacity = useSharedValue(0);

useEffect(() => {
  const animations = animationPresets.slideAndFadeIn(20);
  translateY.value = animations.translateY;
  opacity.value = animations.opacity;
}, []);

const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ translateY: translateY.value }],
  opacity: opacity.value,
}));
```

#### slideAndFadeOut(distance?, config?)

Combines slide and fade for a smooth exit.

## Staggered Animations

Use `getStaggerDelay()` to create staggered animations for lists or multiple elements.

```typescript
import { getStaggerDelay } from '@viby/shared/design-system';

function StaggeredList({ items }) {
  return items.map((item, index) => (
    <AnimatedItem key={item.id} delay={getStaggerDelay(index, 50)} />
  ));
}

function AnimatedItem({ delay }) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, animationPresets.fadeIn());
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.View style={animatedStyle}>Item</Animated.View>;
}
```

## Complete Example

Here's a complete example showing a card that slides in and fades in when mounted:

```typescript
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
} from 'react-native-reanimated';
import { animationPresets } from '@viby/shared/design-system';

export function AnimatedCard({ children, delay = 0 }) {
  const translateY = useSharedValue(20);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const animations = animationPresets.slideAndFadeIn(20);
    
    translateY.value = withDelay(delay, animations.translateY);
    opacity.value = withDelay(delay, animations.opacity);
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#1A1A24',
  },
});
```

## Best Practices

1. **Use spring animations for interactive elements**: Buttons, toggles, and user-triggered actions feel more natural with spring physics.

2. **Use timing animations for transitions**: Screen transitions and loading states work better with predictable timing.

3. **Keep animations under 500ms**: Longer animations can feel sluggish and hurt perceived performance.

4. **Use staggered animations sparingly**: Too many staggered elements can be distracting.

5. **Test on real devices**: Animations may perform differently on actual hardware vs simulators.

6. **Respect reduced motion preferences**: Consider implementing reduced motion support for accessibility.

## Performance Tips

- Use `useAnimatedStyle` instead of `Animated.timing` for better performance
- Avoid animating layout properties (width, height) when possible
- Use `transform` and `opacity` for the best performance
- Keep the number of concurrent animations reasonable (< 10)
- Use `runOnJS` sparingly as it can cause performance issues

## Accessibility

Consider users with motion sensitivity:

```typescript
import { AccessibilityInfo } from 'react-native';

const [reduceMotion, setReduceMotion] = useState(false);

useEffect(() => {
  AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
}, []);

// Use instant transitions if reduce motion is enabled
const duration = reduceMotion ? 0 : timingConfigs.normal.duration;
```

## Related

- [Design Tokens](../tokens/README.md)
- [React Native Reanimated Documentation](https://docs.swmansion.com/react-native-reanimated/)
