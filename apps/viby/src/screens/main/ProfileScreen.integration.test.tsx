/**
 * ProfileScreen Integration Tests
 * 
 * Tests integration between ProfileScreen, Profile module hooks,
 * API calls, and state updates.
 * 
 * Requirements: 12.1, 12.2, 12.4
 * - 12.1: Display user information including username, avatar, and music statistics
 * - 12.2: Display match history with past opponents and game results
 * - 12.4: Send profile updates to Backend_API
 */

import React from 'react';
import { render, waitFor, act, fireEvent } from '@testing-library/react-native';
import { ProfileScreen } from './ProfileScreen';
import { useProfileStore } from '@viby/modules/profile';
import { profileService } from '@viby/modules/profile';
import type { Profile, Match, MusicStats } from '@viby/modules/profile';

// Mock dependencies
jest.mock('@viby/modules/profile', () => {
  const actual = jest.requireActual('@viby/modules/profile');
  return {
    ...actual,
    profileService: {
      getProfile: jest.fn(),
      updateProfile: jest.fn(),
      getMatchHistory: jest.fn(),
      getMusicStats: jest.fn(),
    },
    useUpdateProfile: jest.fn(),
  };
});

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

jest.mock('@viby/modules/auth', () => ({
  useAuthStore: jest.fn((selector) => {
    const state = {
      user: { id: 'user-1', username: 'TestUser', avatar: null },
    };
    return selector ? selector(state) : state;
  }),
}));

describe('ProfileScreen Integration', () => {
  const mockProfile: Profile = {
    id: 'profile-1',
    userId: 'user-1',
    username: 'testuser',
    avatar: 'https://example.com/avatar.jpg',
    bio: 'Music lover and gamer',
    musicStats: null,
    preferences: {
      notificationsEnabled: true,
      matchNotifications: true,
      messageNotifications: true,
      privacyMode: 'public',
    },
    spotifyLinked: true,
    deezerLinked: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockMusicStats: MusicStats = {
    topArtists: [
      {
        id: 'artist-1',
        name: 'Test Artist 1',
        image: 'https://example.com/artist1.jpg',
        genres: ['rock', 'indie'],
      },
      {
        id: 'artist-2',
        name: 'Test Artist 2',
        image: 'https://example.com/artist2.jpg',
        genres: ['pop'],
      },
      {
        id: 'artist-3',
        name: 'Test Artist 3',
        image: null,
        genres: ['electronic'],
      },
      {
        id: 'artist-4',
        name: 'Test Artist 4',
        image: 'https://example.com/artist4.jpg',
        genres: ['jazz'],
      },
    ],
    topTracks: [
      {
        id: 'track-1',
        title: 'Test Track 1',
        artist: 'Test Artist 1',
        album: 'Test Album 1',
        artwork: 'https://example.com/track1.jpg',
        duration: 180,
        isrc: 'USRC12345678',
        provider: 'spotify',
      },
      {
        id: 'track-2',
        title: 'Test Track 2',
        artist: 'Test Artist 2',
        album: 'Test Album 2',
        artwork: null,
        duration: 200,
        isrc: 'USRC87654321',
        provider: 'deezer',
      },
      {
        id: 'track-3',
        title: 'Test Track 3',
        artist: 'Test Artist 3',
        album: 'Test Album 3',
        artwork: 'https://example.com/track3.jpg',
        duration: 220,
        isrc: null,
        provider: 'spotify',
      },
    ],
    topGenres: ['rock', 'indie', 'pop', 'electronic', 'jazz'],
    totalListeningTime: 7200,
    totalMatches: 42,
    totalGamesPlayed: 38,
  };

  const mockMatchHistory: Match[] = [
    {
      id: 'match-1',
      users: [
        {
          id: 'user-1',
          username: 'testuser',
          avatar: 'https://example.com/avatar.jpg',
        },
        {
          id: 'user-2',
          username: 'opponent1',
          avatar: 'https://example.com/opponent1.jpg',
        },
      ],
      track: {
        id: 'track-1',
        title: 'Match Track 1',
        artist: 'Match Artist 1',
        album: 'Match Album 1',
        artwork: 'https://example.com/match1.jpg',
        duration: 180,
        isrc: 'USRC11111111',
        provider: 'spotify',
      },
      gameResult: {
        winner: 'user-1',
        scores: {
          'user-1': 5,
          'user-2': 3,
        },
        totalRounds: 5,
      },
      createdAt: '2024-01-01T00:00:00Z',
      completedAt: '2024-01-01T00:10:00Z',
    },
    {
      id: 'match-2',
      users: [
        {
          id: 'user-1',
          username: 'testuser',
          avatar: 'https://example.com/avatar.jpg',
        },
        {
          id: 'user-3',
          username: 'opponent2',
          avatar: null,
        },
      ],
      track: {
        id: 'track-2',
        title: 'Match Track 2',
        artist: 'Match Artist 2',
        album: 'Match Album 2',
        artwork: null,
        duration: 200,
        isrc: null,
        provider: 'deezer',
      },
      gameResult: {
        winner: 'user-3',
        scores: {
          'user-1': 2,
          'user-3': 4,
        },
        totalRounds: 5,
      },
      createdAt: '2024-01-02T00:00:00Z',
      completedAt: '2024-01-02T00:10:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset profile store
    useProfileStore.setState({
      profile: null,
      matchHistory: [],
      musicStats: null,
    });

    // Mock useUpdateProfile hook
    const { useUpdateProfile } = require('@viby/modules/profile');
    (useUpdateProfile as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
      mutateAsync: jest.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
      data: undefined,
      reset: jest.fn(),
    });
  });

  describe('Profile Display with Real Data', () => {
    it('should display profile data from store', async () => {
      // Set profile data in store
      act(() => {
        useProfileStore.setState({
          profile: mockProfile,
          matchHistory: [],
          musicStats: null,
        });
      });

      const { getByText } = render(<ProfileScreen />);

      // Should display username
      await waitFor(() => {
        expect(getByText('@testuser')).toBeTruthy();
      });

      // Should display bio
      expect(getByText('Music lover and gamer')).toBeTruthy();
    });

    it('should display music stats when available', async () => {
      act(() => {
        useProfileStore.setState({
          profile: mockProfile,
          matchHistory: [],
          musicStats: mockMusicStats,
        });
      });

      const { getByText } = render(<ProfileScreen />);

      // Should display stats
      await waitFor(() => {
        expect(getByText('Stats')).toBeTruthy();
        expect(getByText('42')).toBeTruthy(); // Total matches
        expect(getByText('38')).toBeTruthy(); // Total games
      });

      // Should display music taste section
      expect(getByText('Music Taste')).toBeTruthy();
      expect(getByText('Top Artists')).toBeTruthy();
      expect(getByText('Test Artist 1')).toBeTruthy();
      expect(getByText('Test Artist 2')).toBeTruthy();
    });

    it('should display match history when available', async () => {
      act(() => {
        useProfileStore.setState({
          profile: mockProfile,
          matchHistory: mockMatchHistory,
          musicStats: null,
        });
      });

      const { getByText } = render(<ProfileScreen />);

      // Should display match history section
      await waitFor(() => {
        expect(getByText('Match History')).toBeTruthy();
      });

      // Should display match details
      expect(getByText('vs @opponent1')).toBeTruthy();
      expect(getByText('vs @opponent2')).toBeTruthy();
      expect(getByText('Won')).toBeTruthy();
      expect(getByText('Lost')).toBeTruthy();
      expect(getByText('5-3')).toBeTruthy();
      expect(getByText('2-4')).toBeTruthy();
    });

    it('should calculate win rate correctly from match history', async () => {
      act(() => {
        useProfileStore.setState({
          profile: mockProfile,
          matchHistory: mockMatchHistory,
          musicStats: mockMusicStats,
        });
      });

      const { getByText } = render(<ProfileScreen />);

      // 1 win out of 38 total games = 2.6% ≈ 3%
      await waitFor(() => {
        expect(getByText('3%')).toBeTruthy();
      });
    });

    it('should display top tracks with artwork', async () => {
      act(() => {
        useProfileStore.setState({
          profile: mockProfile,
          matchHistory: [],
          musicStats: mockMusicStats,
        });
      });

      const { getByText, getByLabelText } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(getByText('Top Tracks')).toBeTruthy();
      });

      // Should display track titles
      expect(getByText('Test Track 1')).toBeTruthy();
      expect(getByText('Test Track 2')).toBeTruthy();
      expect(getByText('Test Track 3')).toBeTruthy();

      // Should have artwork accessibility labels
      expect(getByLabelText('Test Track 1 artwork')).toBeTruthy();
    });

    it('should display top genres as badges', async () => {
      act(() => {
        useProfileStore.setState({
          profile: mockProfile,
          matchHistory: [],
          musicStats: mockMusicStats,
        });
      });

      const { getByText } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(getByText('Top Genres')).toBeTruthy();
      });

      // Should display all genres
      expect(getByText('rock')).toBeTruthy();
      expect(getByText('indie')).toBeTruthy();
      expect(getByText('pop')).toBeTruthy();
      expect(getByText('electronic')).toBeTruthy();
      expect(getByText('jazz')).toBeTruthy();
    });

    it('should handle profile without avatar', async () => {
      const profileWithoutAvatar = { ...mockProfile, avatar: null };
      act(() => {
        useProfileStore.setState({
          profile: profileWithoutAvatar,
          matchHistory: [],
          musicStats: null,
        });
      });

      const { getByText } = render(<ProfileScreen />);

      // Should display initials
      await waitFor(() => {
        expect(getByText('TE')).toBeTruthy();
      });
    });

    it('should handle empty match history', async () => {
      act(() => {
        useProfileStore.setState({
          profile: mockProfile,
          matchHistory: [],
          musicStats: mockMusicStats,
        });
      });

      const { queryByText } = render(<ProfileScreen />);

      // Match history section should not be displayed
      await waitFor(() => {
        expect(queryByText('Match History')).toBeNull();
      });
    });

    it('should handle missing music stats', async () => {
      act(() => {
        useProfileStore.setState({
          profile: mockProfile,
          matchHistory: [],
          musicStats: null,
        });
      });

      const { queryByText, getByText } = render(<ProfileScreen />);

      // Music taste section should not be displayed
      await waitFor(() => {
        expect(queryByText('Music Taste')).toBeNull();
      });

      // But stats should show 0
      expect(getByText('0')).toBeTruthy();
    });
  });

  describe('Profile Updates End-to-End', () => {
    it('should update username via API call', async () => {
      const { useUpdateProfile } = require('@viby/modules/profile');
      const mutateAsync = jest.fn().mockResolvedValue({
        ...mockProfile,
        username: 'newusername',
      });

      (useUpdateProfile as jest.Mock).mockReturnValue({
        mutate: jest.fn(),
        mutateAsync,
        isPending: false,
        isError: false,
        isSuccess: false,
        error: null,
        data: undefined,
        reset: jest.fn(),
      });

      act(() => {
        useProfileStore.setState({
          profile: mockProfile,
          matchHistory: [],
          musicStats: null,
        });
      });

      const { getByLabelText } = render(<ProfileScreen />);

      // Enter edit mode
      const editButton = getByLabelText('Edit profile');
      fireEvent.press(editButton);

      await waitFor(() => {
        expect(getByLabelText('Username input')).toBeTruthy();
      });

      // Change username
      const usernameInput = getByLabelText('Username input');
      fireEvent.changeText(usernameInput, 'newusername');

      // Save changes
      const saveButton = getByLabelText('Save profile changes');
      fireEvent.press(saveButton);

      // Should call API with new username
      await waitFor(() => {
        expect(mutateAsync).toHaveBeenCalledWith({
          username: 'newusername',
          avatar: undefined,
        });
      });
    });

    it('should update avatar via API call', async () => {
      const { useUpdateProfile } = require('@viby/modules/profile');
      const mutateAsync = jest.fn().mockResolvedValue({
        ...mockProfile,
        avatar: 'https://example.com/new-avatar.jpg',
      });

      (useUpdateProfile as jest.Mock).mockReturnValue({
        mutate: jest.fn(),
        mutateAsync,
        isPending: false,
        isError: false,
        isSuccess: false,
        error: null,
        data: undefined,
        reset: jest.fn(),
      });

      act(() => {
        useProfileStore.setState({
          profile: mockProfile,
          matchHistory: [],
          musicStats: null,
        });
      });

      const { getByLabelText } = render(<ProfileScreen />);

      // Enter edit mode
      fireEvent.press(getByLabelText('Edit profile'));

      await waitFor(() => {
        expect(getByLabelText('Avatar URL input')).toBeTruthy();
      });

      // Change avatar
      const avatarInput = getByLabelText('Avatar URL input');
      fireEvent.changeText(avatarInput, 'https://example.com/new-avatar.jpg');

      // Save changes
      fireEvent.press(getByLabelText('Save profile changes'));

      // Should call API with new avatar
      await waitFor(() => {
        expect(mutateAsync).toHaveBeenCalledWith({
          username: undefined,
          avatar: 'https://example.com/new-avatar.jpg',
        });
      });
    });

    it('should update both username and avatar together', async () => {
      const { useUpdateProfile } = require('@viby/modules/profile');
      const mutateAsync = jest.fn().mockResolvedValue({
        ...mockProfile,
        username: 'newusername',
        avatar: 'https://example.com/new-avatar.jpg',
      });

      (useUpdateProfile as jest.Mock).mockReturnValue({
        mutate: jest.fn(),
        mutateAsync,
        isPending: false,
        isError: false,
        isSuccess: false,
        error: null,
        data: undefined,
        reset: jest.fn(),
      });

      act(() => {
        useProfileStore.setState({
          profile: mockProfile,
          matchHistory: [],
          musicStats: null,
        });
      });

      const { getByLabelText } = render(<ProfileScreen />);

      // Enter edit mode
      fireEvent.press(getByLabelText('Edit profile'));

      await waitFor(() => {
        expect(getByLabelText('Username input')).toBeTruthy();
      });

      // Change both fields
      fireEvent.changeText(getByLabelText('Username input'), 'newusername');
      fireEvent.changeText(getByLabelText('Avatar URL input'), 'https://example.com/new-avatar.jpg');

      // Save changes
      fireEvent.press(getByLabelText('Save profile changes'));

      // Should call API with both updates
      await waitFor(() => {
        expect(mutateAsync).toHaveBeenCalledWith({
          username: 'newusername',
          avatar: 'https://example.com/new-avatar.jpg',
        });
      });
    });

    it('should exit edit mode after successful update', async () => {
      const { useUpdateProfile } = require('@viby/modules/profile');
      const mutateAsync = jest.fn().mockResolvedValue({
        ...mockProfile,
        username: 'newusername',
      });

      (useUpdateProfile as jest.Mock).mockReturnValue({
        mutate: jest.fn(),
        mutateAsync,
        isPending: false,
        isError: false,
        isSuccess: false,
        error: null,
        data: undefined,
        reset: jest.fn(),
      });

      act(() => {
        useProfileStore.setState({
          profile: mockProfile,
          matchHistory: [],
          musicStats: null,
        });
      });

      const { getByLabelText, queryByLabelText } = render(<ProfileScreen />);

      // Enter edit mode
      fireEvent.press(getByLabelText('Edit profile'));

      await waitFor(() => {
        expect(getByLabelText('Username input')).toBeTruthy();
      });

      // Change username
      fireEvent.changeText(getByLabelText('Username input'), 'newusername');

      // Save changes
      fireEvent.press(getByLabelText('Save profile changes'));

      // Should exit edit mode
      await waitFor(() => {
        expect(queryByLabelText('Username input')).toBeNull();
        expect(getByLabelText('Edit profile')).toBeTruthy();
      });
    });

    it('should not call API when nothing changed', async () => {
      const { useUpdateProfile } = require('@viby/modules/profile');
      const mutateAsync = jest.fn();

      (useUpdateProfile as jest.Mock).mockReturnValue({
        mutate: jest.fn(),
        mutateAsync,
        isPending: false,
        isError: false,
        isSuccess: false,
        error: null,
        data: undefined,
        reset: jest.fn(),
      });

      act(() => {
        useProfileStore.setState({
          profile: mockProfile,
          matchHistory: [],
          musicStats: null,
        });
      });

      const { getByLabelText, queryByLabelText } = render(<ProfileScreen />);

      // Enter edit mode
      fireEvent.press(getByLabelText('Edit profile'));

      await waitFor(() => {
        expect(getByLabelText('Username input')).toBeTruthy();
      });

      // Save without changes
      fireEvent.press(getByLabelText('Save profile changes'));

      // Should not call API
      await waitFor(() => {
        expect(mutateAsync).not.toHaveBeenCalled();
      });

      // Should exit edit mode
      expect(queryByLabelText('Username input')).toBeNull();
    });

    it('should handle validation errors', async () => {
      const { useUpdateProfile } = require('@viby/modules/profile');
      const mutateAsync = jest.fn();

      (useUpdateProfile as jest.Mock).mockReturnValue({
        mutate: jest.fn(),
        mutateAsync,
        isPending: false,
        isError: false,
        isSuccess: false,
        error: null,
        data: undefined,
        reset: jest.fn(),
      });

      act(() => {
        useProfileStore.setState({
          profile: mockProfile,
          matchHistory: [],
          musicStats: null,
        });
      });

      const { getByLabelText, getByText } = render(<ProfileScreen />);

      // Enter edit mode
      fireEvent.press(getByLabelText('Edit profile'));

      await waitFor(() => {
        expect(getByLabelText('Username input')).toBeTruthy();
      });

      // Try to save with empty username
      fireEvent.changeText(getByLabelText('Username input'), '');
      fireEvent.press(getByLabelText('Save profile changes'));

      // Should show validation error
      await waitFor(() => {
        expect(getByText('Username is required')).toBeTruthy();
      });

      // Should not call API
      expect(mutateAsync).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      const { useUpdateProfile } = require('@viby/modules/profile');
      const error = new Error('Network error');
      const mutateAsync = jest.fn().mockRejectedValue(error);

      (useUpdateProfile as jest.Mock).mockReturnValue({
        mutate: jest.fn(),
        mutateAsync,
        isPending: false,
        isError: false,
        isSuccess: false,
        error: null,
        data: undefined,
        reset: jest.fn(),
      });

      act(() => {
        useProfileStore.setState({
          profile: mockProfile,
          matchHistory: [],
          musicStats: null,
        });
      });

      const { getByLabelText, getByText } = render(<ProfileScreen />);

      // Enter edit mode
      fireEvent.press(getByLabelText('Edit profile'));

      await waitFor(() => {
        expect(getByLabelText('Username input')).toBeTruthy();
      });

      // Change username
      fireEvent.changeText(getByLabelText('Username input'), 'newusername');

      // Save changes
      fireEvent.press(getByLabelText('Save profile changes'));

      // Should display error message
      await waitFor(() => {
        expect(getByText('Network error')).toBeTruthy();
      });

      // Should remain in edit mode
      expect(getByLabelText('Username input')).toBeTruthy();
    });

    it('should disable save button while updating', async () => {
      const { useUpdateProfile } = require('@viby/modules/profile');
      const mutateAsync = jest.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockProfile), 1000))
      );

      (useUpdateProfile as jest.Mock).mockReturnValue({
        mutate: jest.fn(),
        mutateAsync,
        isPending: true,
        isError: false,
        isSuccess: false,
        error: null,
        data: undefined,
        reset: jest.fn(),
      });

      act(() => {
        useProfileStore.setState({
          profile: mockProfile,
          matchHistory: [],
          musicStats: null,
        });
      });

      const { getByLabelText } = render(<ProfileScreen />);

      // Enter edit mode
      fireEvent.press(getByLabelText('Edit profile'));

      await waitFor(() => {
        expect(getByLabelText('Username input')).toBeTruthy();
      });

      // Save button should be disabled
      const saveButton = getByLabelText('Save profile changes');
      expect(saveButton.props.accessibilityState.disabled).toBe(true);
    });
  });

  describe('Match History Display', () => {
    it('should display match history with correct opponent info', async () => {
      act(() => {
        useProfileStore.setState({
          profile: mockProfile,
          matchHistory: mockMatchHistory,
          musicStats: null,
        });
      });

      const { getByText, getByLabelText } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(getByText('Match History')).toBeTruthy();
      });

      // Should display opponent usernames
      expect(getByText('vs @opponent1')).toBeTruthy();
      expect(getByText('vs @opponent2')).toBeTruthy();

      // Should have accessibility labels for avatars
      expect(getByLabelText("opponent1's avatar")).toBeTruthy();
    });

    it('should display match results with scores', async () => {
      act(() => {
        useProfileStore.setState({
          profile: mockProfile,
          matchHistory: mockMatchHistory,
          musicStats: null,
        });
      });

      const { getByText } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(getByText('Match History')).toBeTruthy();
      });

      // Should display win/loss status
      expect(getByText('Won')).toBeTruthy();
      expect(getByText('Lost')).toBeTruthy();

      // Should display scores
      expect(getByText('5-3')).toBeTruthy();
      expect(getByText('2-4')).toBeTruthy();
    });

    it('should display track information for each match', async () => {
      act(() => {
        useProfileStore.setState({
          profile: mockProfile,
          matchHistory: mockMatchHistory,
          musicStats: null,
        });
      });

      const { getByText } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(getByText('Match History')).toBeTruthy();
      });

      // Should display track info
      expect(getByText('Match Track 1 • Match Artist 1')).toBeTruthy();
      expect(getByText('Match Track 2 • Match Artist 2')).toBeTruthy();
    });

    it('should limit match history to 5 matches', async () => {
      const manyMatches: Match[] = Array.from({ length: 10 }, (_, i) => ({
        id: `match-${i}`,
        users: [
          {
            id: 'user-1',
            username: 'testuser',
            avatar: null,
          },
          {
            id: `user-${i + 2}`,
            username: `opponent${i}`,
            avatar: null,
          },
        ],
        track: {
          id: `track-${i}`,
          title: `Track ${i}`,
          artist: `Artist ${i}`,
          album: `Album ${i}`,
          artwork: null,
          duration: 180,
          isrc: null,
          provider: 'spotify' as const,
        },
        gameResult: {
          winner: 'user-1',
          scores: {
            'user-1': 5,
            [`user-${i + 2}`]: 3,
          },
          totalRounds: 5,
        },
        createdAt: '2024-01-01T00:00:00Z',
        completedAt: '2024-01-01T00:10:00Z',
      }));

      act(() => {
        useProfileStore.setState({
          profile: mockProfile,
          matchHistory: manyMatches,
          musicStats: null,
        });
      });

      const { getByText, queryByText } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(getByText('Match History')).toBeTruthy();
      });

      // Should display first 5 matches
      expect(getByText('vs @opponent4')).toBeTruthy();

      // Should not display 6th match
      expect(queryByText('vs @opponent5')).toBeNull();
    });

    it('should handle matches with missing opponent avatars', async () => {
      const matchWithoutAvatar: Match = {
        ...mockMatchHistory[1],
        users: [
          mockMatchHistory[1].users[0],
          {
            ...mockMatchHistory[1].users[1],
            avatar: null,
          },
        ],
      };

      act(() => {
        useProfileStore.setState({
          profile: mockProfile,
          matchHistory: [matchWithoutAvatar],
          musicStats: null,
        });
      });

      const { getByText } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(getByText('Match History')).toBeTruthy();
      });

      // Should display opponent initials
      expect(getByText('OP')).toBeTruthy();
    });

    it('should handle matches with missing track artwork', async () => {
      const matchWithoutArtwork: Match = {
        ...mockMatchHistory[1],
        track: {
          ...mockMatchHistory[1].track,
          artwork: null,
        },
      };

      act(() => {
        useProfileStore.setState({
          profile: mockProfile,
          matchHistory: [matchWithoutArtwork],
          musicStats: null,
        });
      });

      const { getByText } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(getByText('Match History')).toBeTruthy();
      });

      // Should still display match info
      expect(getByText('vs @opponent2')).toBeTruthy();
      expect(getByText('Match Track 2 • Match Artist 2')).toBeTruthy();
    });
  });

  describe('Integration with Profile Store', () => {
    it('should react to profile store updates', async () => {
      act(() => {
        useProfileStore.setState({
          profile: mockProfile,
          matchHistory: [],
          musicStats: null,
        });
      });

      const { getByText, rerender } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(getByText('@testuser')).toBeTruthy();
      });

      // Update profile in store
      const updatedProfile = { ...mockProfile, username: 'updateduser' };
      act(() => {
        useProfileStore.setState({
          profile: updatedProfile,
          matchHistory: [],
          musicStats: null,
        });
      });

      rerender(<ProfileScreen />);

      // Should display updated username
      await waitFor(() => {
        expect(getByText('@updateduser')).toBeTruthy();
      });
    });

    it('should react to match history updates', async () => {
      act(() => {
        useProfileStore.setState({
          profile: mockProfile,
          matchHistory: [],
          musicStats: null,
        });
      });

      const { queryByText, getByText, rerender } = render(<ProfileScreen />);

      // Initially no match history
      expect(queryByText('Match History')).toBeNull();

      // Add match history
      act(() => {
        useProfileStore.setState({
          profile: mockProfile,
          matchHistory: mockMatchHistory,
          musicStats: null,
        });
      });

      rerender(<ProfileScreen />);

      // Should display match history
      await waitFor(() => {
        expect(getByText('Match History')).toBeTruthy();
        expect(getByText('vs @opponent1')).toBeTruthy();
      });
    });

    it('should react to music stats updates', async () => {
      act(() => {
        useProfileStore.setState({
          profile: mockProfile,
          matchHistory: [],
          musicStats: null,
        });
      });

      const { queryByText, getByText, rerender } = render(<ProfileScreen />);

      // Initially no music taste section
      expect(queryByText('Music Taste')).toBeNull();

      // Add music stats
      act(() => {
        useProfileStore.setState({
          profile: mockProfile,
          matchHistory: [],
          musicStats: mockMusicStats,
        });
      });

      rerender(<ProfileScreen />);

      // Should display music taste
      await waitFor(() => {
        expect(getByText('Music Taste')).toBeTruthy();
        expect(getByText('Test Artist 1')).toBeTruthy();
      });
    });
  });

  describe('UI Interactions', () => {
    it('should toggle edit mode on button press', async () => {
      act(() => {
        useProfileStore.setState({
          profile: mockProfile,
          matchHistory: [],
          musicStats: null,
        });
      });

      const { getByLabelText, queryByLabelText } = render(<ProfileScreen />);

      // Initially in view mode
      expect(getByLabelText('Edit profile')).toBeTruthy();
      expect(queryByLabelText('Username input')).toBeNull();

      // Enter edit mode
      fireEvent.press(getByLabelText('Edit profile'));

      await waitFor(() => {
        expect(getByLabelText('Username input')).toBeTruthy();
        expect(getByLabelText('Avatar URL input')).toBeTruthy();
        expect(getByLabelText('Save profile changes')).toBeTruthy();
        expect(getByLabelText('Cancel editing')).toBeTruthy();
      });

      // Cancel edit mode
      fireEvent.press(getByLabelText('Cancel editing'));

      await waitFor(() => {
        expect(queryByLabelText('Username input')).toBeNull();
        expect(getByLabelText('Edit profile')).toBeTruthy();
      });
    });

    it('should populate input fields with current values', async () => {
      act(() => {
        useProfileStore.setState({
          profile: mockProfile,
          matchHistory: [],
          musicStats: null,
        });
      });

      const { getByLabelText } = render(<ProfileScreen />);

      // Enter edit mode
      fireEvent.press(getByLabelText('Edit profile'));

      await waitFor(() => {
        const usernameInput = getByLabelText('Username input');
        const avatarInput = getByLabelText('Avatar URL input');

        expect(usernameInput.props.value).toBe('testuser');
        expect(avatarInput.props.value).toBe('https://example.com/avatar.jpg');
      });
    });

    it('should clear validation errors when canceling edit', async () => {
      const { useUpdateProfile } = require('@viby/modules/profile');
      (useUpdateProfile as jest.Mock).mockReturnValue({
        mutate: jest.fn(),
        mutateAsync: jest.fn(),
        isPending: false,
        isError: false,
        isSuccess: false,
        error: null,
        data: undefined,
        reset: jest.fn(),
      });

      act(() => {
        useProfileStore.setState({
          profile: mockProfile,
          matchHistory: [],
          musicStats: null,
        });
      });

      const { getByLabelText, getByText, queryByText } = render(<ProfileScreen />);

      // Enter edit mode
      fireEvent.press(getByLabelText('Edit profile'));

      await waitFor(() => {
        expect(getByLabelText('Username input')).toBeTruthy();
      });

      // Trigger validation error
      fireEvent.changeText(getByLabelText('Username input'), '');
      fireEvent.press(getByLabelText('Save profile changes'));

      await waitFor(() => {
        expect(getByText('Username is required')).toBeTruthy();
      });

      // Cancel editing
      fireEvent.press(getByLabelText('Cancel editing'));

      // Error should be cleared
      await waitFor(() => {
        expect(queryByText('Username is required')).toBeNull();
      });
    });
  });
});
