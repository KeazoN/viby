/**
 * CurrentlyPlayingIndicator Component
 * 
 * Displays the user's currently playing track in the Discovery Screen header.
 * Features a pulsing animation to indicate live playback.
 * 
 * Requirements: 3.6, 4.3
 * - 3.6: Display the Currently_Playing track with artist, title, and album artwork
 * - 4.3: Display Active_Listener data as a living, breathing UI with smooth animations
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Text, Card, OptimizedImage } from '@viby/shared/design-system';
import { colors, spacing } from '@viby/shared/design-system';
import { useCurrentlyPlaying } from '@viby/modules/discovery';

export function CurrentlyPlayingIndicator() {
  const currentlyPlaying = useCurrentlyPlaying();
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(1);

  // Pulsing animation for the indicator dot
  useEffect(() => {
    if (currentlyPlaying) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.3, {
            duration: 800,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(1, {
            duration: 800,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1, // Infinite loop
        false
      );

      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.5, {
            duration: 800,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(1, {
            duration: 800,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1, // Infinite loop
        false
      );
    }
  }, [currentlyPlaying, pulseScale, pulseOpacity]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  // Show empty state when nothing is playing
  if (!currentlyPlaying) {
    return (
      <Card style={styles.card}>
        <View style={styles.emptyContent}>
          <Text variant="body" color="secondary" align="center">
            Not playing anything right now
          </Text>
          <Text variant="caption" color="tertiary" align="center" style={styles.hintText}>
            Start playing music on Spotify or Deezer to connect with others
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <Card 
      style={styles.card}
      accessibilityLabel={`Currently playing: ${currentlyPlaying.title} by ${currentlyPlaying.artist}`}
    >
      <View style={styles.content}>
        {/* NOW PLAYING Label with Pulsing Indicator */}
        <View style={styles.labelContainer}>
          <Animated.View style={[styles.pulseIndicator, pulseStyle]} />
          <Text variant="caption" color="secondary" style={styles.nowPlayingLabel}>
            NOW PLAYING
          </Text>
        </View>

        {/* Track Information */}
        <View style={styles.trackInfo}>
          {currentlyPlaying.artwork && (
            <OptimizedImage
              uri={currentlyPlaying.artwork}
              width={56}
              height={56}
              borderRadius={8}
              priority="high"
              accessibilityLabel={`Album artwork for ${currentlyPlaying.title}`}
            />
          )}
          <View style={styles.trackText}>
            <Text variant="body" numberOfLines={1} style={styles.trackTitle}>
              {currentlyPlaying.title}
            </Text>
            <Text variant="caption" color="secondary" numberOfLines={1}>
              {currentlyPlaying.artist}
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing[6],
  },
  content: {
    gap: spacing[3],
  },
  emptyContent: {
    gap: spacing[2],
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  pulseIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent.cyan,
  },
  nowPlayingLabel: {
    fontWeight: '600',
    letterSpacing: 1,
  },
  trackInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  trackText: {
    flex: 1,
    gap: spacing[1],
  },
  trackTitle: {
    fontWeight: '600',
  },
  hintText: {
    marginTop: spacing[2],
  },
});
