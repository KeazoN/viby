/**
 * CurrentlyPlayingIndicator Component Tests
 * 
 * Tests for the currently playing track indicator component.
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { CurrentlyPlayingIndicator } from './CurrentlyPlayingIndicator';
import { useCurrentlyPlaying } from '@viby/modules/discovery';
import type { Track } from '@viby/modules/discovery';

// Mock the discovery module
jest.mock('@viby/modules/discovery', () => ({
  useCurrentlyPlaying: jest.fn(),
}));

const mockUseCurrentlyPlaying = useCurrentlyPlaying as jest.MockedFunction<
  typeof useCurrentlyPlaying
>;

describe('CurrentlyPlayingIndicator', () => {
  const mockTrack: Track = {
    id: 'track-1',
    title: 'Test Song',
    artist: 'Test Artist',
    album: 'Test Album',
    artwork: 'https://example.com/artwork.jpg',
    duration: 180000,
    isrc: 'TEST123',
    provider: 'spotify',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when nothing is playing', () => {
    beforeEach(() => {
      mockUseCurrentlyPlaying.mockReturnValue(null);
    });

    it('should render empty state message', () => {
      render(<CurrentlyPlayingIndicator />);

      expect(screen.getByText('Not playing anything right now')).toBeTruthy();
      expect(
        screen.getByText('Start playing music on Spotify or Deezer to connect with others')
      ).toBeTruthy();
    });

    it('should not render NOW PLAYING label', () => {
      render(<CurrentlyPlayingIndicator />);

      expect(screen.queryByText('NOW PLAYING')).toBeNull();
    });

    it('should not render track information', () => {
      render(<CurrentlyPlayingIndicator />);

      expect(screen.queryByText('Test Song')).toBeNull();
      expect(screen.queryByText('Test Artist')).toBeNull();
    });
  });

  describe('when a track is playing', () => {
    beforeEach(() => {
      mockUseCurrentlyPlaying.mockReturnValue(mockTrack);
    });

    it('should render NOW PLAYING label', () => {
      render(<CurrentlyPlayingIndicator />);

      expect(screen.getByText('NOW PLAYING')).toBeTruthy();
    });

    it('should render track title', () => {
      render(<CurrentlyPlayingIndicator />);

      expect(screen.getByText('Test Song')).toBeTruthy();
    });

    it('should render artist name', () => {
      render(<CurrentlyPlayingIndicator />);

      expect(screen.getByText('Test Artist')).toBeTruthy();
    });

    it('should render artwork when available', () => {
      render(<CurrentlyPlayingIndicator />);

      const artwork = screen.getByLabelText('Album artwork for Test Song');
      expect(artwork).toBeTruthy();
      expect(artwork.props.source).toEqual({ uri: 'https://example.com/artwork.jpg' });
    });

    it('should have proper accessibility label', () => {
      render(<CurrentlyPlayingIndicator />);

      expect(
        screen.getByLabelText('Currently playing: Test Song by Test Artist')
      ).toBeTruthy();
    });

    it('should not render empty state message', () => {
      render(<CurrentlyPlayingIndicator />);

      expect(screen.queryByText('Not playing anything right now')).toBeNull();
    });
  });

  describe('when track has no artwork', () => {
    beforeEach(() => {
      mockUseCurrentlyPlaying.mockReturnValue({
        ...mockTrack,
        artwork: null,
      });
    });

    it('should render track information without artwork', () => {
      render(<CurrentlyPlayingIndicator />);

      expect(screen.getByText('Test Song')).toBeTruthy();
      expect(screen.getByText('Test Artist')).toBeTruthy();
      expect(screen.queryByLabelText('Album artwork for Test Song')).toBeNull();
    });
  });

  describe('accessibility', () => {
    beforeEach(() => {
      mockUseCurrentlyPlaying.mockReturnValue(mockTrack);
    });

    it('should have accessibility label when playing', () => {
      render(<CurrentlyPlayingIndicator />);

      expect(
        screen.getByLabelText('Currently playing: Test Song by Test Artist')
      ).toBeTruthy();
    });

    it('should provide descriptive artwork label', () => {
      render(<CurrentlyPlayingIndicator />);

      expect(screen.getByLabelText('Album artwork for Test Song')).toBeTruthy();
    });
  });

  describe('track information display', () => {
    it('should handle long track titles', () => {
      const longTitleTrack: Track = {
        ...mockTrack,
        title: 'This is a very long track title that should be truncated',
      };
      mockUseCurrentlyPlaying.mockReturnValue(longTitleTrack);

      render(<CurrentlyPlayingIndicator />);

      const titleElement = screen.getByText(longTitleTrack.title);
      expect(titleElement.props.numberOfLines).toBe(1);
    });

    it('should handle long artist names', () => {
      const longArtistTrack: Track = {
        ...mockTrack,
        artist: 'This is a very long artist name that should be truncated',
      };
      mockUseCurrentlyPlaying.mockReturnValue(longArtistTrack);

      render(<CurrentlyPlayingIndicator />);

      const artistElement = screen.getByText(longArtistTrack.artist);
      expect(artistElement.props.numberOfLines).toBe(1);
    });
  });

  describe('different streaming providers', () => {
    it('should render Spotify tracks', () => {
      mockUseCurrentlyPlaying.mockReturnValue({
        ...mockTrack,
        provider: 'spotify',
      });

      render(<CurrentlyPlayingIndicator />);

      expect(screen.getByText('Test Song')).toBeTruthy();
    });

    it('should render Deezer tracks', () => {
      mockUseCurrentlyPlaying.mockReturnValue({
        ...mockTrack,
        provider: 'deezer',
      });

      render(<CurrentlyPlayingIndicator />);

      expect(screen.getByText('Test Song')).toBeTruthy();
    });
  });
});
