/**
 * Example components demonstrating animation presets
 * These examples show how to use the animation presets in real components
 */

import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
} from 'react-native-reanimated';
import { animationPresets, springConfigs, timingConfigs, getStaggerDelay } from './presets';

/**
 * Example: Fade in animation
 */
export function FadeInExample() {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = animationPresets.fadeIn();
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.box, animatedStyle]}>
      <Text style={styles.text}>Fade In</Text>
    </Animated.View>
  );
}

/**
 * Example: Slide in from right
 */
export function SlideInExample() {
  const translateX = useSharedValue(300);

  useEffect(() => {
    translateX.value = animationPresets.slideInRight(300);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={[styles.box, animatedStyle]}>
      <Text style={styles.text}>Slide In</Text>
    </Animated.View>
  );
}

/**
 * Example: Pulse animation
 */
export function PulseExample() {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = animationPresets.pulse(1.1);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.box, animatedStyle]}>
      <Text style={styles.text}>Pulse</Text>
    </Animated.View>
  );
}

/**
 * Example: Shake animation on button press
 */
export function ShakeExample() {
  const translateX = useSharedValue(0);

  const handlePress = () => {
    translateX.value = animationPresets.shake(10);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={[styles.box, animatedStyle]}>
        <Text style={styles.text}>Tap to Shake</Text>
      </Animated.View>
    </Pressable>
  );
}

/**
 * Example: Bounce animation
 */
export function BounceExample() {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = animationPresets.bounce();
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.box, animatedStyle]}>
      <Text style={styles.text}>Bounce</Text>
    </Animated.View>
  );
}

/**
 * Example: Slide and fade in
 */
export function SlideAndFadeExample() {
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

  return (
    <Animated.View style={[styles.box, animatedStyle]}>
      <Text style={styles.text}>Slide & Fade</Text>
    </Animated.View>
  );
}

/**
 * Example: Staggered list animation
 */
export function StaggeredListExample() {
  const items = ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'];

  return (
    <View style={styles.list}>
      {items.map((item, index) => (
        <StaggeredItem key={item} text={item} index={index} />
      ))}
    </View>
  );
}

function StaggeredItem({ text, index }: { text: string; index: number }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    const delay = getStaggerDelay(index, 100);
    const animations = animationPresets.slideAndFadeIn(20);
    
    opacity.value = withDelay(delay, animations.opacity);
    translateY.value = withDelay(delay, animations.translateY);
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.listItem, animatedStyle]}>
      <Text style={styles.text}>{text}</Text>
    </Animated.View>
  );
}

/**
 * Example: Custom spring configuration
 */
export function CustomSpringExample() {
  const scale = useSharedValue(0);

  useEffect(() => {
    // Using the bouncy spring config for a playful effect
    scale.value = animationPresets.bounce(springConfigs.bouncy);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.box, animatedStyle]}>
      <Text style={styles.text}>Custom Spring</Text>
    </Animated.View>
  );
}

/**
 * Example: Custom timing configuration
 */
export function CustomTimingExample() {
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Using slow timing for emphasis
    opacity.value = animationPresets.fadeIn(timingConfigs.slow);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.box, animatedStyle]}>
      <Text style={styles.text}>Slow Fade</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 150,
    height: 100,
    backgroundColor: '#1A1A24',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    padding: 10,
  },
  listItem: {
    backgroundColor: '#1A1A24',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
});
