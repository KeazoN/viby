/**
 * Animation presets for the Viby design system
 * Using React Native Reanimated 3 for smooth, performant animations
 * 
 */

import {
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import type { WithSpringConfig, WithTimingConfig } from 'react-native-reanimated';

/**
 * Spring animation configurations
 * Used for natural, physics-based animations
 */
export const springConfigs = {
  /**
   * Default spring - balanced damping and stiffness
   * Use for most UI interactions
   */
  default: {
    damping: 15,
    stiffness: 150,
    mass: 1,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 2,
  } as WithSpringConfig,

  /**
   * Gentle spring - smooth, slow motion
   * Use for large elements or subtle animations
   */
  gentle: {
    damping: 20,
    stiffness: 100,
    mass: 1,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 2,
  } as WithSpringConfig,

  /**
   * Bouncy spring - energetic, playful motion
   * Use for attention-grabbing elements or game interactions
   */
  bouncy: {
    damping: 10,
    stiffness: 200,
    mass: 1,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 2,
  } as WithSpringConfig,

  /**
   * Stiff spring - quick, snappy motion
   * Use for small elements or quick feedback
   */
  stiff: {
    damping: 18,
    stiffness: 250,
    mass: 0.8,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 2,
  } as WithSpringConfig,

  /**
   * Slow spring - deliberate, smooth motion
   * Use for large modals or screen transitions
   */
  slow: {
    damping: 25,
    stiffness: 80,
    mass: 1.2,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 2,
  } as WithSpringConfig,
} as const;

/**
 * Timing animation configurations
 * Used for precise, controlled animations
 */
export const timingConfigs = {
  /**
   * Fast timing - 150ms
   * Use for micro-interactions and quick feedback
   */
  fast: {
    duration: 150,
    easing: Easing.out(Easing.ease),
  } as WithTimingConfig,

  /**
   * Normal timing - 300ms
   * Use for standard UI transitions
   */
  normal: {
    duration: 300,
    easing: Easing.out(Easing.ease),
  } as WithTimingConfig,

  /**
   * Slow timing - 500ms
   * Use for emphasis or complex animations
   */
  slow: {
    duration: 500,
    easing: Easing.out(Easing.ease),
  } as WithTimingConfig,

  /**
   * Linear timing - no easing
   * Use for continuous animations or loading indicators
   */
  linear: {
    duration: 300,
    easing: Easing.linear,
  } as WithTimingConfig,

  /**
   * Ease in - acceleration
   * Use for elements entering the screen
   */
  easeIn: {
    duration: 300,
    easing: Easing.in(Easing.ease),
  } as WithTimingConfig,

  /**
   * Ease out - deceleration
   * Use for elements exiting the screen
   */
  easeOut: {
    duration: 300,
    easing: Easing.out(Easing.ease),
  } as WithTimingConfig,

  /**
   * Ease in-out - smooth acceleration and deceleration
   * Use for smooth transitions
   */
  easeInOut: {
    duration: 300,
    easing: Easing.inOut(Easing.ease),
  } as WithTimingConfig,
} as const;

/**
 * Preset animation functions
 * Ready-to-use animations for common UI patterns
 */
export const animationPresets = {
  /**
   * Fade in animation
   * Animates opacity from 0 to 1
   * 
   * @param config - Optional timing configuration (defaults to normal)
   * @returns Reanimated animation value
   * 
   * @example
   * ```tsx
   * const opacity = useSharedValue(0);
   * 
   * useEffect(() => {
   *   opacity.value = animationPresets.fadeIn();
   * }, []);
   * 
   * return <Animated.View style={{ opacity }} />;
   * ```
   */
  fadeIn: (config: WithTimingConfig = timingConfigs.normal) => {
    return withTiming(1, config);
  },

  /**
   * Fade out animation
   * Animates opacity from 1 to 0
   * 
   * @param config - Optional timing configuration (defaults to normal)
   * @returns Reanimated animation value
   * 
   * @example
   * ```tsx
   * const opacity = useSharedValue(1);
   * 
   * const handleDismiss = () => {
   *   opacity.value = animationPresets.fadeOut();
   * };
   * ```
   */
  fadeOut: (config: WithTimingConfig = timingConfigs.normal) => {
    return withTiming(0, config);
  },

  /**
   * Slide in from right animation
   * Animates translateX from screen width to 0
   * 
   * @param screenWidth - Width of the screen or container
   * @param config - Optional spring configuration (defaults to default spring)
   * @returns Reanimated animation value
   * 
   * @example
   * ```tsx
   * const translateX = useSharedValue(screenWidth);
   * 
   * useEffect(() => {
   *   translateX.value = animationPresets.slideInRight(screenWidth);
   * }, []);
   * ```
   */
  slideInRight: (
    screenWidth: number,
    config: WithSpringConfig = springConfigs.default
  ) => {
    return withSpring(0, config);
  },

  /**
   * Slide in from left animation
   * Animates translateX from negative screen width to 0
   * 
   * @param screenWidth - Width of the screen or container
   * @param config - Optional spring configuration (defaults to default spring)
   * @returns Reanimated animation value
   */
  slideInLeft: (
    screenWidth: number,
    config: WithSpringConfig = springConfigs.default
  ) => {
    return withSpring(0, config);
  },

  /**
   * Slide in from top animation
   * Animates translateY from negative screen height to 0
   * 
   * @param screenHeight - Height of the screen or container
   * @param config - Optional spring configuration (defaults to default spring)
   * @returns Reanimated animation value
   */
  slideInTop: (
    screenHeight: number,
    config: WithSpringConfig = springConfigs.default
  ) => {
    return withSpring(0, config);
  },

  /**
   * Slide in from bottom animation
   * Animates translateY from screen height to 0
   * 
   * @param screenHeight - Height of the screen or container
   * @param config - Optional spring configuration (defaults to default spring)
   * @returns Reanimated animation value
   */
  slideInBottom: (
    screenHeight: number,
    config: WithSpringConfig = springConfigs.default
  ) => {
    return withSpring(0, config);
  },

  /**
   * Pulse animation
   * Scales element up and down in a loop
   * 
   * @param scale - Maximum scale value (defaults to 1.1)
   * @param config - Optional timing configuration (defaults to normal)
   * @returns Reanimated animation value
   * 
   * @example
   * ```tsx
   * const scale = useSharedValue(1);
   * 
   * useEffect(() => {
   *   scale.value = animationPresets.pulse();
   * }, []);
   * 
   * return <Animated.View style={{ transform: [{ scale }] }} />;
   * ```
   */
  pulse: (scale: number = 1.1, config: WithTimingConfig = timingConfigs.normal) => {
    return withRepeat(
      withSequence(
        withTiming(scale, config),
        withTiming(1, config)
      ),
      -1, // Infinite loop
      true // Reverse animation
    );
  },

  /**
   * Shake animation
   * Moves element left and right rapidly
   * 
   * @param distance - Maximum shake distance in pixels (defaults to 10)
   * @param config - Optional timing configuration (defaults to fast)
   * @returns Reanimated animation value
   * 
   * @example
   * ```tsx
   * const translateX = useSharedValue(0);
   * 
   * const handleError = () => {
   *   translateX.value = animationPresets.shake();
   * };
   * 
   * return <Animated.View style={{ transform: [{ translateX }] }} />;
   * ```
   */
  shake: (distance: number = 10, config: WithTimingConfig = timingConfigs.fast) => {
    return withSequence(
      withTiming(distance, config),
      withTiming(-distance, config),
      withTiming(distance, config),
      withTiming(-distance, config),
      withTiming(0, config)
    );
  },

  /**
   * Bounce animation
   * Scales element with a bouncy effect
   * 
   * @param config - Optional spring configuration (defaults to bouncy spring)
   * @returns Reanimated animation value
   * 
   * @example
   * ```tsx
   * const scale = useSharedValue(0);
   * 
   * useEffect(() => {
   *   scale.value = animationPresets.bounce();
   * }, []);
   * ```
   */
  bounce: (config: WithSpringConfig = springConfigs.bouncy) => {
    return withSpring(1, config);
  },

  /**
   * Rotate animation
   * Rotates element 360 degrees continuously
   * 
   * @param duration - Duration of one rotation in ms (defaults to 1000)
   * @returns Reanimated animation value
   * 
   * @example
   * ```tsx
   * const rotation = useSharedValue(0);
   * 
   * useEffect(() => {
   *   rotation.value = animationPresets.rotate();
   * }, []);
   * 
   * return (
   *   <Animated.View 
   *     style={{ transform: [{ rotate: `${rotation}deg` }] }} 
   *   />
   * );
   * ```
   */
  rotate: (duration: number = 1000) => {
    return withRepeat(
      withTiming(360, {
        duration,
        easing: Easing.linear,
      }),
      -1, // Infinite loop
      false
    );
  },

  /**
   * Scale in animation
   * Scales element from 0 to 1
   * 
   * @param config - Optional spring configuration (defaults to default spring)
   * @returns Reanimated animation value
   */
  scaleIn: (config: WithSpringConfig = springConfigs.default) => {
    return withSpring(1, config);
  },

  /**
   * Scale out animation
   * Scales element from 1 to 0
   * 
   * @param config - Optional timing configuration (defaults to normal)
   * @returns Reanimated animation value
   */
  scaleOut: (config: WithTimingConfig = timingConfigs.normal) => {
    return withTiming(0, config);
  },

  /**
   * Slide and fade in animation
   * Combines slide and fade for a smooth entrance
   * Returns both translateY and opacity values
   * 
   * @param distance - Distance to slide (defaults to 20)
   * @param config - Optional timing configuration (defaults to normal)
   * @returns Object with translateY and opacity animation values
   * 
   * @example
   * ```tsx
   * const translateY = useSharedValue(20);
   * const opacity = useSharedValue(0);
   * 
   * useEffect(() => {
   *   const animations = animationPresets.slideAndFadeIn();
   *   translateY.value = animations.translateY;
   *   opacity.value = animations.opacity;
   * }, []);
   * ```
   */
  slideAndFadeIn: (
    distance: number = 20,
    config: WithTimingConfig = timingConfigs.normal
  ) => {
    return {
      translateY: withTiming(0, config),
      opacity: withTiming(1, config),
    };
  },

  /**
   * Slide and fade out animation
   * Combines slide and fade for a smooth exit
   * Returns both translateY and opacity values
   * 
   * @param distance - Distance to slide (defaults to 20)
   * @param config - Optional timing configuration (defaults to normal)
   * @returns Object with translateY and opacity animation values
   */
  slideAndFadeOut: (
    distance: number = 20,
    config: WithTimingConfig = timingConfigs.normal
  ) => {
    return {
      translateY: withTiming(distance, config),
      opacity: withTiming(0, config),
    };
  },
} as const;

/**
 * Helper function to create a staggered animation
 * Useful for animating lists or multiple elements with a delay
 * 
 * @param index - Index of the element in the list
 * @param delayMs - Delay between each element in milliseconds (defaults to 50)
 * @returns Delay value in milliseconds
 * 
 * @example
 * ```tsx
 * items.map((item, index) => {
 *   const opacity = useSharedValue(0);
 *   
 *   useEffect(() => {
 *     opacity.value = withDelay(
 *       getStaggerDelay(index),
 *       animationPresets.fadeIn()
 *     );
 *   }, []);
 *   
 *   return <Animated.View style={{ opacity }} />;
 * });
 * ```
 */
export const getStaggerDelay = (index: number, delayMs: number = 50): number => {
  return index * delayMs;
};
