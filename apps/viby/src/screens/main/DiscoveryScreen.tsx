/**
 * Discovery Screen
 * 
 * Main screen showing realtime listener feed and track clusters.
 * Users can see who else is listening to music right now, grouped by track.
 * 
 * Requirements: 4.3, 4.7, 15.6
 * - 4.3: Display Active_Listener data as a living, breathing UI with smooth animations
 * - 4.7: Display track artwork, title, artist, and listener count for each Track_Cluster
 * - 15.6: Use FlatList virtualization for optimal performance
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Text, Card, OptimizedImage, usePrefetchTrackArtwork } from '@viby/shared/design-system';
import { colors, spacing } from '@viby/shared/design-system';
import { useDiscovery, useTrackClusters } from '@viby/modules/discovery';
import type { TrackCluster } from '@viby/modules/discovery';
import { CurrentlyPlayingIndicator } from '../discovery/components';

// Constants for FlatList optimization
const ITEM_HEIGHT = 96; // Card height + margin (80px card + 16px margin)
const WINDOW_SIZE = 10; // Number of items to render outside visible area
const MAX_TO_RENDER_PER_BATCH = 5; // Items to render per batch
const UPDATE_CELLS_BATCH_PERIOD = 50; // ms between batch renders

export function DiscoveryScreen() {
  const trackClusters = useTrackClusters();
  const [refreshing, setRefreshing] = React.useState(false);

  // Prefetch track artwork for better performance (Requirement 22.6)
  usePrefetchTrackArtwork(trackClusters);

  // Memoize cluster count computation (Requirement 9.7)
  const clusterCount = useMemo(() => trackClusters.length, [trackClusters.length]);
  const clusterLabel = useMemo(
    () => (clusterCount === 1 ? 'track' : 'tracks'),
    [clusterCount]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Refresh will be handled by WebSocket reconnection or manual data fetch
    // For now, simulate a refresh delay
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  // Optimized getItemLayout for fixed-height items
  const getItemLayout = useCallback(
    (_data: TrackCluster[] | null | undefined, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  // Optimized keyExtractor
  const keyExtractor = useCallback((item: TrackCluster) => item.trackId, []);

  const renderTrackCluster = useCallback(
    ({ item }: { item: TrackCluster }) => (
      <TouchableOpacity
        activeOpacity={0.8}
        accessibilityLabel={`Track cluster for ${item.track.title} by ${item.track.artist} with ${item.listenerCount} listeners`}
        accessibilityRole="button"
      >
        <Card style={styles.clusterCard}>
          <View style={styles.clusterContent}>
            {/* Track Artwork */}
            {item.track.artwork ? (
              <OptimizedImage
                uri={item.track.artwork}
                width={64}
                height={64}
                borderRadius={8}
                priority="normal"
                accessibilityLabel={`Album artwork for ${item.track.title}`}
              />
            ) : (
              <View style={styles.artworkPlaceholder}>
                <Text variant="body" color="secondary">
                  🎵
                </Text>
              </View>
            )}

            {/* Track Info */}
            <View style={styles.trackInfo}>
              <Text variant="body" numberOfLines={1} style={styles.trackTitle}>
                {item.track.title}
              </Text>
              <Text variant="bodySmall" color="secondary" numberOfLines={1}>
                {item.track.artist}
              </Text>
            </View>

            {/* Listener Count Badge */}
            <View style={styles.listenerBadge}>
              <Text variant="caption" style={styles.listenerCount}>
                {item.listenerCount}
              </Text>
              <Text variant="caption" color="secondary" style={styles.listenerLabel}>
                {item.listenerCount === 1 ? 'listener' : 'listeners'}
              </Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    ),
    []
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Currently Playing Section */}
      <CurrentlyPlayingIndicator />

      {/* Section Title */}
      <View style={styles.sectionHeader}>
        <Text variant="h4" style={styles.sectionTitle}>
          Who's Listening Now
        </Text>
        <Text variant="caption" color="secondary">
          {clusterCount} {clusterLabel}
        </Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text variant="body" color="secondary" align="center">
        No one is listening right now
      </Text>
      <Text variant="bodySmall" color="tertiary" align="center" style={styles.emptyHint}>
        Pull down to refresh and check again
      </Text>
    </View>
  );

  return (
    <View style={styles.container} testID="discovery-screen">
      <FlatList
        data={trackClusters}
        renderItem={renderTrackCluster}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent.cyan}
            colors={[colors.accent.cyan, colors.accent.magenta]}
          />
        }
        showsVerticalScrollIndicator={false}
        // Performance optimizations
        windowSize={WINDOW_SIZE}
        maxToRenderPerBatch={MAX_TO_RENDER_PER_BATCH}
        updateCellsBatchingPeriod={UPDATE_CELLS_BATCH_PERIOD}
        removeClippedSubviews={true}
        initialNumToRender={10}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  listContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[8],
  },
  header: {
    paddingTop: spacing[6],
    paddingBottom: spacing[4],
  },
  
  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontWeight: '700',
  },
  
  // Track Cluster Card
  clusterCard: {
    marginBottom: spacing[3],
  },
  clusterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  artworkPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackInfo: {
    flex: 1,
    gap: spacing[1],
  },
  trackTitle: {
    fontWeight: '600',
  },
  listenerBadge: {
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.overlay.light,
    borderRadius: 12,
    minWidth: 60,
  },
  listenerCount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.accent.cyan,
  },
  listenerLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  
  // Empty State
  emptyState: {
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[6],
    gap: spacing[3],
  },
  emptyHint: {
    marginTop: spacing[2],
  },
});
