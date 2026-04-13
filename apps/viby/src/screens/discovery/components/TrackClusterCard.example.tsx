/**
 * TrackClusterCard Usage Example
 * 
 * This file demonstrates how to use the TrackClusterCard component
 * in the Discovery Screen.
 */

import React from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { TrackClusterCard } from './TrackClusterCard';
import { useTrackClusters } from '@viby/modules/discovery';
import { matchmakingService } from '@viby/modules/matchmaking';
import { spacing } from '@viby/shared/design-system';

/**
 * Example: Discovery Screen with TrackClusterCard
 * 
 * This example shows how to:
 * 1. Fetch track clusters from the discovery module
 * 2. Render them in a FlatList
 * 3. Handle card press to view listeners
 * 4. Handle Quick Match button press
 */
export function DiscoveryScreenExample() {
  const navigation = useNavigation();
  const trackClusters = useTrackClusters();

  const handleViewListeners = (trackId: string) => {
    // Navigate to listeners screen for this track
    navigation.navigate('Listeners', { trackId });
  };

  const handleQuickMatch = async (trackId: string) => {
    try {
      // Request a match for this track
      const match = await matchmakingService.requestMatch(trackId);
      
      // Navigate to match screen
      navigation.navigate('Match', { matchId: match.id });
    } catch (error) {
      console.error('Failed to request match:', error);
      // Show error toast/alert to user
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={trackClusters}
        keyExtractor={(item) => item.trackId}
        renderItem={({ item }) => (
          <TrackClusterCard
            cluster={item}
            onPress={() => handleViewListeners(item.trackId)}
            onQuickMatch={() => handleQuickMatch(item.trackId)}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

/**
 * Example: Using TrackClusterCard with default matchmaking behavior
 * 
 * If you don't provide onQuickMatch, the component will automatically
 * call matchmakingService.requestMatch() when the button is pressed.
 */
export function DiscoveryScreenSimpleExample() {
  const navigation = useNavigation();
  const trackClusters = useTrackClusters();

  return (
    <View style={styles.container}>
      <FlatList
        data={trackClusters}
        keyExtractor={(item) => item.trackId}
        renderItem={({ item }) => (
          <TrackClusterCard
            cluster={item}
            onPress={() => navigation.navigate('Listeners', { trackId: item.trackId })}
            // onQuickMatch is optional - component handles matchmaking internally
          />
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

/**
 * Example: Single TrackClusterCard with custom styling
 */
export function SingleTrackClusterExample() {
  const trackCluster = {
    trackId: 'track-123',
    track: {
      id: 'track-123',
      title: 'Blinding Lights',
      artist: 'The Weeknd',
      album: 'After Hours',
      artwork: 'https://example.com/artwork.jpg',
      duration: 200000,
      isrc: 'USUG12000123',
      provider: 'spotify' as const,
    },
    listenerCount: 12,
    listeners: [],
  };

  return (
    <View style={styles.container}>
      <TrackClusterCard
        cluster={trackCluster}
        onPress={() => console.log('View listeners')}
        onQuickMatch={() => console.log('Quick match')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing[4],
  },
  listContent: {
    paddingVertical: spacing[4],
  },
});
