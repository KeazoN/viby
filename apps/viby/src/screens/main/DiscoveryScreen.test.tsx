/**
 * DiscoveryScreen Tests
 * 
 * Tests for the Discovery Screen component
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { DiscoveryScreen } from './DiscoveryScreen';
import { useTrackClusters, useCurrentlyPlaying } from '@viby/modules/discovery';

// Mock the discovery hooks
jest.mock('@viby/modules/discovery', () => ({
  useDiscovery: jest.fn(),
  useTrackClusters: jest.fn(),
  useCurrentlyPlaying: jest.fn(),
}));

const mockUseTrackClusters = useTrackClusters as jest.MockedFunction<typeof useTrackClusters>;
const mockUseCurrentlyPlaying = useCurrentlyPlaying as jest.MockedFunction<typeof useCurrentlyPlaying>;

describe('DiscoveryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render empty state when no track clusters', () => {
    mockUseTrackClusters.mockReturnValue([]);
    mockUseCurrentlyPlaying.mockReturnValue(null);

    render(<DiscoveryScreen />);

    expect(screen.getByText('No one is listening right now')).toBeTruthy();
    expect(screen.getByText('Pull down to refresh and check again')).toBeTruthy();
  });

  it('should render currently playing section when user is playing music', () => {
    mockUseTrackClusters.mockReturnValue([]);
    mockUseCurrentlyPlaying.mockReturnValue({
      id: '1',
      title: 'Test Song',
      artist: 'Test Artist',
      album: 'Test Album',
      artwork: 'https://example.com/artwork.jpg',
      duration: 180,
      isrc: null,
      provider: 'spotify',
    });

    render(<DiscoveryScreen />);

    expect(screen.getByText('NOW PLAYING')).toBeTruthy();
    expect(screen.getByText('Test Song')).toBeTruthy();
    expect(screen.getByText('Test Artist')).toBeTruthy();
  });

  it('should render not playing message when user is not playing music', () => {
    mockUseTrackClusters.mockReturnValue([]);
    mockUseCurrentlyPlaying.mockReturnValue(null);

    render(<DiscoveryScreen />);

    expect(screen.getByText('Not playing anything right now')).toBeTruthy();
    expect(screen.getByText('Start playing music on Spotify or Deezer to connect with others')).toBeTruthy();
  });

  it('should render track clusters when available', () => {
    mockUseTrackClusters.mockReturnValue([
      {
        trackId: '1',
        track: {
          id: '1',
          title: 'Popular Song',
          artist: 'Popular Artist',
          album: 'Popular Album',
          artwork: 'https://example.com/artwork1.jpg',
          duration: 200,
          isrc: null,
          provider: 'spotify',
        },
        listenerCount: 5,
        listeners: [],
      },
      {
        trackId: '2',
        track: {
          id: '2',
          title: 'Another Song',
          artist: 'Another Artist',
          album: 'Another Album',
          artwork: null,
          duration: 180,
          isrc: null,
          provider: 'deezer',
        },
        listenerCount: 2,
        listeners: [],
      },
    ]);
    mockUseCurrentlyPlaying.mockReturnValue(null);

    render(<DiscoveryScreen />);

    expect(screen.getByText('Who\'s Listening Now')).toBeTruthy();
    expect(screen.getByText('2 tracks')).toBeTruthy();
    expect(screen.getByText('Popular Song')).toBeTruthy();
    expect(screen.getByText('Popular Artist')).toBeTruthy();
    expect(screen.getByText('Another Song')).toBeTruthy();
    expect(screen.getByText('Another Artist')).toBeTruthy();
  });

  it('should display correct listener count for track clusters', () => {
    mockUseTrackClusters.mockReturnValue([
      {
        trackId: '1',
        track: {
          id: '1',
          title: 'Test Song',
          artist: 'Test Artist',
          album: 'Test Album',
          artwork: null,
          duration: 180,
          isrc: null,
          provider: 'spotify',
        },
        listenerCount: 1,
        listeners: [],
      },
      {
        trackId: '2',
        track: {
          id: '2',
          title: 'Another Song',
          artist: 'Another Artist',
          album: 'Another Album',
          artwork: null,
          duration: 180,
          isrc: null,
          provider: 'spotify',
        },
        listenerCount: 3,
        listeners: [],
      },
    ]);
    mockUseCurrentlyPlaying.mockReturnValue(null);

    render(<DiscoveryScreen />);

    // Check for singular "listener"
    expect(screen.getByText('listener')).toBeTruthy();
    // Check for plural "listeners"
    expect(screen.getByText('listeners')).toBeTruthy();
  });

  it('should render section header with correct track count', () => {
    mockUseTrackClusters.mockReturnValue([
      {
        trackId: '1',
        track: {
          id: '1',
          title: 'Test Song',
          artist: 'Test Artist',
          album: 'Test Album',
          artwork: null,
          duration: 180,
          isrc: null,
          provider: 'spotify',
        },
        listenerCount: 1,
        listeners: [],
      },
    ]);
    mockUseCurrentlyPlaying.mockReturnValue(null);

    render(<DiscoveryScreen />);

    expect(screen.getByText('1 track')).toBeTruthy();
  });
});
