/**
 * Match Screen (Modal)
 * 
 * Displays match notification with user profile preview.
 * Includes animations: confetti, modal slide-up, and avatar glow.
 * 
 * Requirements: 5.2 - Special match notification with animation
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSequence,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { animationPresets, springConfigs, timingConfigs } from '@viby/shared/design-system';

export function MatchScreen() {
  const { height } = useWindowDimensions();
  
  // Modal slide-up animation
  const translateY = useSharedValue(height);
  const modalOpacity = useSharedValue(0);
  
  // Avatar glow effect
  const glowScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.5);
  
  // Confetti animation values
  const confettiOpacity = useSharedValue(0);
  const confettiScale = useSharedValue(0);
  
  useEffect(() => {
    // Modal entrance animation
    const slideAnimation = animationPresets.slideAndFadeIn(height);
    translateY.value = slideAnimation.translateY;
    modalOpacity.value = slideAnimation.opacity;
    
    // Avatar glow pulse animation (starts after modal appears)
    glowScale.value = withDelay(
      300,
      withRepeat(
        withSequence(
          withTiming(1.2, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1, // Infinite
        true
      )
    );
    
    glowOpacity.value = withDelay(
      300,
      withRepeat(
        withSequence(
          withTiming(0.8, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.5, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1, // Infinite
        true
      )
    );
    
    // Confetti burst animation (starts after modal appears)
    confettiOpacity.value = withDelay(
      200,
      withSequence(
        withTiming(1, timingConfigs.fast),
        withDelay(1500, withTiming(0, timingConfigs.slow))
      )
    );
    
    confettiScale.value = withDelay(
      200,
      withSequence(
        withTiming(1, { duration: 300, easing: Easing.out(Easing.back(1.5)) }),
        withDelay(1500, withTiming(1.2, timingConfigs.slow))
      )
    );
  }, [height]);
  
  const modalAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: modalOpacity.value,
  }));
  
  const glowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: glowOpacity.value,
  }));
  
  const confettiAnimatedStyle = useAnimatedStyle(() => ({
    opacity: confettiOpacity.value,
    transform: [{ scale: confettiScale.value }],
  }));
  
  return (
    <View style={styles.container}>
      {/* Confetti overlay */}
      <Animated.View style={[styles.confettiContainer, confettiAnimatedStyle]}>
        <ConfettiParticles />
      </Animated.View>
      
      {/* Modal content */}
      <Animated.View style={[styles.modalContent, modalAnimatedStyle]}>
        {/* Avatar with glow effect */}
        <View style={styles.avatarContainer}>
          <Animated.View style={[styles.avatarGlow, glowAnimatedStyle]} />
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>🎵</Text>
          </View>
        </View>
        
        <Text style={styles.title}>It's a Match!</Text>
        <Text style={styles.subtitle}>You both love the same music</Text>
      </Animated.View>
    </View>
  );
}

/**
 * Confetti particles component
 * Renders multiple confetti pieces with random positions
 */
function ConfettiParticles() {
  const particles = Array.from({ length: 30 }, (_, i) => i);
  
  return (
    <>
      {particles.map((i) => (
        <ConfettiPiece key={i} index={i} />
      ))}
    </>
  );
}

/**
 * Individual confetti piece with random animation
 */
function ConfettiPiece({ index }: { index: number }) {
  const { width, height } = useWindowDimensions();
  
  // Random initial position
  const startX = Math.random() * width;
  const startY = height * 0.3; // Start from top third
  
  // Random end position
  const endX = startX + (Math.random() - 0.5) * 200;
  const endY = height * 0.8 + Math.random() * 100;
  
  // Random color
  const colors = ['#00ff88', '#ff0088', '#00ffff', '#ffff00', '#ff00ff'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  
  const translateX = useSharedValue(startX);
  const translateY = useSharedValue(startY);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(0);
  
  useEffect(() => {
    const delay = Math.random() * 200;
    
    // Fade in
    opacity.value = withDelay(delay, withTiming(1, { duration: 200 }));
    
    // Fall animation
    translateX.value = withDelay(
      delay,
      withTiming(endX, { duration: 1500, easing: Easing.out(Easing.quad) })
    );
    
    translateY.value = withDelay(
      delay,
      withTiming(endY, { duration: 1500, easing: Easing.in(Easing.quad) })
    );
    
    // Rotation
    rotation.value = withDelay(
      delay,
      withTiming(360 * (Math.random() > 0.5 ? 1 : -1), {
        duration: 1500,
        easing: Easing.linear,
      })
    );
    
    // Fade out at the end
    opacity.value = withDelay(
      delay + 1300,
      withTiming(0, { duration: 200 })
    );
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: 0,
    top: 0,
    width: 8,
    height: 8,
    backgroundColor: color,
    borderRadius: 2,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));
  
  return <Animated.View style={animatedStyle} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  modalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 32,
  },
  avatarGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#00ff88',
    top: -10,
    left: -10,
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2a2a3a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#00ff88',
  },
  avatarText: {
    fontSize: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00ff88',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#999999',
  },
});
