import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { TrackClusterCard } from './TrackClusterCard';
import { matchmakingService } from '@viby/modules/matchmaking';
import type { TrackCluster } from '@viby/modules/discovery';

// Mock the matchmaking service
jest.mock('@viby/modules/matchmaking', () => ({
  matchmakingService: {
    requestMatch: jest.fn(),
  },
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

describe('TrackClusterCard', () => {
  const mockTrackCluster: TrackCluster = {
    trackId: 'track-1',
    track: {
      id: 'track-1',
      title: 'Test Track',
      artist: 'Test Artist',
      album: 'Test Album',
      artwork: 'https://example.com/artwork.jpg',
      duration: 180000,
      isrc: 'TEST123',
      provider: 'spotify',
    },
    listenerCount: 5,
    listeners: [],
  };

  const mockOnPress = jest.fn();
  const mockOnQuickMatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders track information correctly', () => {
    const { getByText, getByLabelText } = render(
      <TrackClusterCard
        cluster={mockTrackCluster}
        onPress={mockOnPress}
        onQuickMatch={mockOnQuickMatch}
      />
    );

    expect(getByText('Test Track')).toBeTruthy();
    expect(getByText('Test Artist')).toBeTruthy();
    expect(getByText('5')).toBeTruthy(); // Listener count
  });

  it('displays album artwork when available', () => {
    const { getByLabelText } = render(
      <TrackClusterCard
        cluster={mockTrackCluster}
        onPress={mockOnPress}
        onQuickMatch={mockOnQuickMatch}
      />
    );

    const artwork = getByLabelText('Album artwork for Test Album');
    expect(artwork).toBeTruthy();
    expect(artwork.props.source.uri).toBe('https://example.com/artwork.jpg');
  });

  it('displays placeholder when artwork is not available', () => {
    const clusterWithoutArtwork: TrackCluster = {
      ...mockTrackCluster,
      track: {
        ...mockTrackCluster.track,
        artwork: null,
      },
    };

    const { getByText } = render(
      <TrackClusterCard
        cluster={clusterWithoutArtwork}
        onPress={mockOnPress}
        onQuickMatch={mockOnQuickMatch}
      />
    );

    expect(getByText('♪')).toBeTruthy();
  });

  it('calls onPress when card is pressed', () => {
    const { getByLabelText } = render(
      <TrackClusterCard
        cluster={mockTrackCluster}
        onPress={mockOnPress}
        onQuickMatch={mockOnQuickMatch}
      />
    );

    const card = getByLabelText(
      'Track cluster: Test Track by Test Artist, 5 listeners'
    );
    fireEvent.press(card);

    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('calls onQuickMatch when Quick Match button is pressed', () => {
    const { getByLabelText } = render(
      <TrackClusterCard
        cluster={mockTrackCluster}
        onPress={mockOnPress}
        onQuickMatch={mockOnQuickMatch}
      />
    );

    const quickMatchButton = getByLabelText(
      'Quick match with listeners of Test Track'
    );
    fireEvent.press(quickMatchButton);

    expect(mockOnQuickMatch).toHaveBeenCalledTimes(1);
  });

  it('calls matchmakingService.requestMatch when onQuickMatch is not provided', async () => {
    const { getByLabelText } = render(
      <TrackClusterCard
        cluster={mockTrackCluster}
        onPress={mockOnPress}
      />
    );

    const quickMatchButton = getByLabelText(
      'Quick match with listeners of Test Track'
    );
    fireEvent.press(quickMatchButton);

    await waitFor(() => {
      expect(matchmakingService.requestMatch).toHaveBeenCalledWith('track-1');
    });
  });

  it('handles matchmaking service errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    (matchmakingService.requestMatch as jest.Mock).mockRejectedValueOnce(
      new Error('Network error')
    );

    const { getByLabelText } = render(
      <TrackClusterCard
        cluster={mockTrackCluster}
        onPress={mockOnPress}
      />
    );

    const quickMatchButton = getByLabelText(
      'Quick match with listeners of Test Track'
    );
    fireEvent.press(quickMatchButton);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to request match:',
        expect.any(Error)
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it('displays correct listener count', () => {
    const clusterWithManyListeners: TrackCluster = {
      ...mockTrackCluster,
      listenerCount: 42,
    };

    const { getByText } = render(
      <TrackClusterCard
        cluster={clusterWithManyListeners}
        onPress={mockOnPress}
        onQuickMatch={mockOnQuickMatch}
      />
    );

    expect(getByText('42')).toBeTruthy();
  });

  it('truncates long track titles', () => {
    const clusterWithLongTitle: TrackCluster = {
      ...mockTrackCluster,
      track: {
        ...mockTrackCluster.track,
        title: 'This is a very long track title that should be truncated',
      },
    };

    const { getByText } = render(
      <TrackClusterCard
        cluster={clusterWithLongTitle}
        onPress={mockOnPress}
        onQuickMatch={mockOnQuickMatch}
      />
    );

    const titleElement = getByText(
      'This is a very long track title that should be truncated'
    );
    expect(titleElement.props.numberOfLines).toBe(1);
  });

  it('truncates long artist names', () => {
    const clusterWithLongArtist: TrackCluster = {
      ...mockTrackCluster,
      track: {
        ...mockTrackCluster.track,
        artist: 'This is a very long artist name that should be truncated',
      },
    };

    const { getByText } = render(
      <TrackClusterCard
        cluster={clusterWithLongArtist}
        onPress={mockOnPress}
        onQuickMatch={mockOnQuickMatch}
      />
    );

    const artistElement = getByText(
      'This is a very long artist name that should be truncated'
    );
    expect(artistElement.props.numberOfLines).toBe(1);
  });

  it('has proper accessibility labels', () => {
    const { getByLabelText } = render(
      <TrackClusterCard
        cluster={mockTrackCluster}
        onPress={mockOnPress}
        onQuickMatch={mockOnQuickMatch}
      />
    );

    expect(
      getByLabelText('Track cluster: Test Track by Test Artist, 5 listeners')
    ).toBeTruthy();
    expect(
      getByLabelText('Quick match with listeners of Test Track')
    ).toBeTruthy();
    expect(getByLabelText('Album artwork for Test Album')).toBeTruthy();
  });
});
