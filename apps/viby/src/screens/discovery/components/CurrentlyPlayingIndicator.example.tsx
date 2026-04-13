/**
 * CurrentlyPlayingIndicator Component Examples
 * 
 * Demonstrates different states of the currently playing indicator.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CurrentlyPlayingIndicator } from './CurrentlyPlayingIndicator';
import { useCurrentlyPlaying } from '@viby/modules/discovery';
import type { Track } from '@viby/modules/discovery';
import { spacing } from '@viby/shared/design-system';

// Mock hook for examples
jest.mock('@viby/modules/discovery', () => ({
  useCurrentlyPlaying: jest.fn(),
}));

const mockUseCurrentlyPlaying = useCurrentlyPlaying as jest.MockedFunction<
  typeof useCurrentlyPlaying
>;

/**
 * Example 1: Currently Playing Track
 * Shows the indicator with a track playing
 */
export function CurrentlyPlayingExample() {
  const mockTrack: Track = {
    id: 'track-1',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    artwork: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36',
    duration: 200040,
    isrc: 'USUG11902881',
    provider: 'spotify',
  };

  mockUseCurrentlyPlaying.mockReturnValue(mockTrack);

  return (
    <View style={styles.container}>
      <CurrentlyPlayingIndicator />
    </View>
  );
}

/**
 * Example 2: Nothing Playing
 * Shows the empty state when no track is playing
 */
export function NothingPlayingExample() {
  mockUseCurrentlyPlaying.mockReturnValue(null);

  return (
    <View style={styles.container}>
      <CurrentlyPlayingIndicator />
    </View>
  );
}

/**
 * Example 3: Track Without Artwork
 * Shows the indicator when track has no artwork
 */
export function NoArtworkExample() {
  const mockTrack: Track = {
    id: 'track-2',
    title: 'Unknown Track',
    artist: 'Unknown Artist',
    album: 'Unknown Album',
    artwork: null,
    duration: 180000,
    isrc: null,
    provider: 'deezer',
  };

  mockUseCurrentlyPlaying.mockReturnValue(mockTrack);

  return (
    <View style={styles.container}>
      <CurrentlyPlayingIndicator />
    </View>
  );
}

/**
 * Example 4: Long Track Title
 * Shows how the component handles long track titles
 */
export function LongTitleExample() {
  const mockTrack: Track = {
    id: 'track-3',
    title: 'This is a Very Long Track Title That Should Be Truncated',
    artist: 'Artist with a Very Long Name That Also Should Be Truncated',
    album: 'Album Name',
    artwork: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36',
    duration: 240000,
    isrc: 'TEST123',
    provider: 'spotify',
  };

  mockUseCurrentlyPlaying.mockReturnValue(mockTrack);

  return (
    <View style={styles.container}>
      <CurrentlyPlayingIndicator />
    </View>
  );
}

/**
 * Example 5: Deezer Track
 * Shows the indicator with a Deezer track
 */
export function DeezerTrackExample() {
  const mockTrack: Track = {
    id: 'track-4',
    title: 'Starboy',
    artist: 'The Weeknd ft. Daft Punk',
    album: 'Starboy',
    artwork: 'https://e-cdns-images.dzcdn.net/images/cover/abc123/500x500.jpg',
    duration: 230453,
    isrc: 'USUG11601680',
    provider: 'deezer',
  };

  mockUseCurrentlyPlaying.mockReturnValue(mockTrack);

  return (
    <View style={styles.container}>
      <CurrentlyPlayingIndicator />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing[4],
  },
});
