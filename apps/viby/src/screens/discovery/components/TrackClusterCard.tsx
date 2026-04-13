import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Button, Card, OptimizedImage } from '@viby/shared/design-system';
import { colors, typography, spacing, borderRadius } from '@viby/shared/design-system';
import type { TrackCluster } from '@viby/modules/discovery';
import { matchmakingService } from '@viby/modules/matchmaking';

export interface TrackClusterCardProps {
  /**
   * Track cluster data containing track info and listener count
   */
  cluster: TrackCluster;
  /**
   * Callback when card is pressed to view listeners
   */
  onPress: () => void;
  /**
   * Callback when Quick Match button is pressed
   */
  onQuickMatch?: () => void;
}

/**
 * TrackClusterCard Component
 * 
 * Displays a track cluster with album artwork, track info, listener count badge,
 * and Quick Match button. Features a pulse animation on the listener badge to
 * indicate live activity.
 * 
 * Requirements: 4.3, 4.4, 4.5, 4.7, 15.6
 * 
 * @example
 * ```tsx
 * <TrackClusterCard
 *   cluster={trackCluster}
 *   onPress={() => navigateToListeners(trackCluster.trackId)}
 *   onQuickMatch={() => handleQuickMatch(trackCluster.trackId)}
 * />
 * ```
 */
export const TrackClusterCard = React.memo(function TrackClusterCard({
  cluster,
  onPress,
  onQuickMatch,
}: TrackClusterCardProps) {
  const { track, listenerCount } = cluster;

  // Pulse animation for listener badge
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    // Start pulse animation
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1, // Infinite loop
      true // Reverse
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const handleQuickMatch = async () => {
    try {
      if (onQuickMatch) {
        onQuickMatch();
      } else {
        // Default behavior: request match via matchmaking service
        await matchmakingService.requestMatch(track.id);
      }
    } catch (error) {
      console.error('Failed to request match:', error);
    }
  };

  return (
    <Card
      variant="elevated"
      padding={4}
      onPress={onPress}
      style={styles.card}
      accessibilityLabel={`Track cluster: ${track.title} by ${track.artist}, ${listenerCount} listeners`}
    >
      <View style={styles.content}>
        {/* Album Artwork */}
        <View style={styles.artworkContainer}>
          {track.artwork ? (
            <OptimizedImage
              uri={track.artwork}
              width={80}
              height={80}
              borderRadius={borderRadius.md}
              priority="normal"
              accessibilityLabel={`Album artwork for ${track.album}`}
            />
          ) : (
            <View style={[styles.artwork, styles.placeholderArtwork]}>
              <Text style={styles.placeholderText}>♪</Text>
            </View>
          )}

          {/* Listener Count Badge with Pulse Animation */}
          <Animated.View style={[styles.badgeContainer, pulseStyle]}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{listenerCount}</Text>
            </View>
          </Animated.View>
        </View>

        {/* Track Info */}
        <View style={styles.infoContainer}>
          <Text
            style={styles.trackTitle}
            numberOfLines={1}
            accessibilityRole="text"
          >
            {track.title}
          </Text>
          <Text
            style={styles.artistName}
            numberOfLines={1}
            accessibilityRole="text"
          >
            {track.artist}
          </Text>

          {/* Quick Match Button */}
          <View style={styles.buttonContainer}>
            <Button
              variant="primary"
              size="sm"
              onPress={handleQuickMatch}
              accessibilityLabel={`Quick match with listeners of ${track.title}`}
            >
              Quick Match
            </Button>
          </View>
        </View>
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing[4],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  artworkContainer: {
    position: 'relative',
    marginRight: spacing[4],
  },
  artwork: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
  },
  placeholderArtwork: {
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: typography.fontSize['3xl'],
    color: colors.text.tertiary,
  },
  badgeContainer: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  badge: {
    backgroundColor: colors.accent.cyan,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
    // Shadow for better visibility
    shadowColor: colors.accent.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 5,
  },
  badgeText: {
    color: colors.background.primary,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bold,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  trackTitle: {
    color: colors.text.primary,
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
    marginBottom: spacing[1],
  },
  artistName: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    marginBottom: spacing[3],
  },
  buttonContainer: {
    alignSelf: 'flex-start',
  },
});
