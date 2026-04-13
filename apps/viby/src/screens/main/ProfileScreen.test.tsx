/**
 * ProfileScreen Tests
 * 
 * Tests for the Profile Screen component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { ProfileScreen } from './ProfileScreen';
import { useProfile, useUpdateProfile } from '@viby/modules/profile';
import type { Profile, Match, MusicStats } from '@viby/modules/profile';

// Mock the profile hooks
jest.mock('@viby/modules/profile', () => ({
  useProfile: jest.fn(),
  useUpdateProfile: jest.fn(),
}));

const mockUseProfile = useProfile as jest.MockedFunction<typeof useProfile>;
const mockUseUpdateProfile = useUpdateProfile as jest.MockedFunction<typeof useUpdateProfile>;

describe('ProfileScreen', () => {
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
    
    // Default mock for useUpdateProfile
    mockUseUpdateProfile.mockReturnValue({
      mutate: jest.fn(),
      mutateAsync: jest.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
      data: undefined,
      reset: jest.fn(),
    } as any);
  });

  describe('User Avatar and Username', () => {
    it('should display user avatar and username', () => {
      mockUseProfile.mockReturnValue({
        profile: mockProfile,
        matchHistory: [],
        musicStats: null,
        setProfile: jest.fn(),
        updateProfile: jest.fn(),
        setMatchHistory: jest.fn(),
        setMusicStats: jest.fn(),
        clear: jest.fn(),
      });

      render(<ProfileScreen />);

      expect(screen.getByText('@testuser')).toBeTruthy();
      expect(screen.getByLabelText('testuser\'s avatar')).toBeTruthy();
    });

    it('should display user bio when available', () => {
      mockUseProfile.mockReturnValue({
        profile: mockProfile,
        matchHistory: [],
        musicStats: null,
        setProfile: jest.fn(),
        updateProfile: jest.fn(),
        setMatchHistory: jest.fn(),
        setMusicStats: jest.fn(),
        clear: jest.fn(),
      });

      render(<ProfileScreen />);

      expect(screen.getByText('Music lover and gamer')).toBeTruthy();
    });

    it('should display avatar placeholder when no avatar', () => {
      const profileWithoutAvatar = { ...mockProfile, avatar: null };
      mockUseProfile.mockReturnValue({
        profile: profileWithoutAvatar,
        matchHistory: [],
        musicStats: null,
        setProfile: jest.fn(),
        updateProfile: jest.fn(),
        setMatchHistory: jest.fn(),
        setMusicStats: jest.fn(),
        clear: jest.fn(),
      });

      render(<ProfileScreen />);

      expect(screen.getByText('TE')).toBeTruthy(); // Initials
    });

    it('should not display bio when not available', () => {
      const profileWithoutBio = { ...mockProfile, bio: null };
      mockUseProfile.mockReturnValue({
        profile: profileWithoutBio,
        matchHistory: [],
        musicStats: null,
        setProfile: jest.fn(),
        updateProfile: jest.fn(),
        setMatchHistory: jest.fn(),
        setMusicStats: jest.fn(),
        clear: jest.fn(),
      });

      render(<ProfileScreen />);

      expect(screen.queryByText('Music lover and gamer')).toBeNull();
    });
  });

  describe('User Stats', () => {
    it('should display user stats correctly', () => {
      mockUseProfile.mockReturnValue({
        profile: mockProfile,
        matchHistory: mockMatchHistory,
        musicStats: mockMusicStats,
        setProfile: jest.fn(),
        updateProfile: jest.fn(),
        setMatchHistory: jest.fn(),
        setMusicStats: jest.fn(),
        clear: jest.fn(),
      });

      render(<ProfileScreen />);

      expect(screen.getByText('Stats')).toBeTruthy();
      expect(screen.getByText('42')).toBeTruthy(); // Matches
      expect(screen.getByText('38')).toBeTruthy(); // Games
      expect(screen.getByText('Matches')).toBeTruthy();
      expect(screen.getByText('Games')).toBeTruthy();
      expect(screen.getByText('Win Rate')).toBeTruthy();
    });

    it('should calculate win rate correctly', () => {
      mockUseProfile.mockReturnValue({
        profile: mockProfile,
        matchHistory: mockMatchHistory,
        musicStats: mockMusicStats,
        setProfile: jest.fn(),
        updateProfile: jest.fn(),
        setMatchHistory: jest.fn(),
        setMusicStats: jest.fn(),
        clear: jest.fn(),
      });

      render(<ProfileScreen />);

      // 1 win out of 2 games in matchHistory, but totalGamesPlayed is 38
      // Win rate should be calculated from matchHistory wins / totalGamesPlayed
      // 1 win / 38 games = 2.6% ≈ 3%
      expect(screen.getByText('3%')).toBeTruthy();
    });

    it('should display 0% win rate when no games played', () => {
      const statsWithNoGames = { ...mockMusicStats, totalGamesPlayed: 0 };
      mockUseProfile.mockReturnValue({
        profile: mockProfile,
        matchHistory: [],
        musicStats: statsWithNoGames,
        setProfile: jest.fn(),
        updateProfile: jest.fn(),
        setMatchHistory: jest.fn(),
        setMusicStats: jest.fn(),
        clear: jest.fn(),
      });

      render(<ProfileScreen />);

      expect(screen.getByText('0%')).toBeTruthy();
    });

    it('should display 0 for stats when no music stats available', () => {
      mockUseProfile.mockReturnValue({
        profile: mockProfile,
        matchHistory: [],
        musicStats: null,
        setProfile: jest.fn(),
        updateProfile: jest.fn(),
        setMatchHistory: jest.fn(),
        setMusicStats: jest.fn(),
        clear: jest.fn(),
      });

      render(<ProfileScreen />);

      expect(screen.getByText('0')).toBeTruthy(); // Multiple zeros for matches and games
    });
  });

  describe('Music Taste', () => {
    it('should display top artists', () => {
      mockUseProfile.mockReturnValue({
        profile: mockProfile,
        matchHistory: [],
        musicStats: mockMusicStats,
        setProfile: jest.fn(),
        updateProfile: jest.fn(),
        setMatchHistory: jest.fn(),
        setMusicStats: jest.fn(),
        clear: jest.fn(),
      });

      render(<ProfileScreen />);

      expect(screen.getByText('Music Taste')).toBeTruthy();
      expect(screen.getByText('Top Artists')).toBeTruthy();
      expect(screen.getByText('Test Artist 1')).toBeTruthy();
      expect(screen.getByText('Test Artist 2')).toBeTruthy();
      expect(screen.getByText('Test Artist 3')).toBeTruthy();
      expect(screen.getByText('Test Artist 4')).toBeTruthy();
    });

    it('should display top tracks', () => {
      mockUseProfile.mockReturnValue({
        profile: mockProfile,
        matchHistory: [],
        musicStats: mockMusicStats,
        setProfile: jest.fn(),
        updateProfile: jest.fn(),
        setMatchHistory: jest.fn(),
        setMusicStats: jest.fn(),
        clear: jest.fn(),
      });

      render(<ProfileScreen />);

      expect(screen.getByText('Top Tracks')).toBeTruthy();
      expect(screen.getByText('Test Track 1')).toBeTruthy();
      expect(screen.getByText('Test Track 2')).toBeTruthy();
      expect(screen.getByText('Test Track 3')).toBeTruthy();
    });

    it('should display top genres', () => {
      mockUseProfile.mockReturnValue({
        profile: mockProfile,
        matchHistory: [],
        musicStats: mockMusicStats,
        setProfile: jest.fn(),
        updateProfile: jest.fn(),
        setMatchHistory: jest.fn(),
        setMusicStats: jest.fn(),
        clear: jest.fn(),
      });

      render(<ProfileScreen />);

      expect(screen.getByText('Top Genres')).toBeTruthy();
      expect(screen.getByText('rock')).toBeTruthy();
      expect(screen.getByText('indie')).toBeTruthy();
      expect(screen.getByText('pop')).toBeTruthy();
      expect(screen.getByText('electronic')).toBeTruthy();
      expect(screen.getByText('jazz')).toBeTruthy();
    });

    it('should not display music taste section when no music stats', () => {
      mockUseProfile.mockReturnValue({
        profile: mockProfile,
        matchHistory: [],
        musicStats: null,
        setProfile: jest.fn(),
        updateProfile: jest.fn(),
        setMatchHistory: jest.fn(),
        setMusicStats: jest.fn(),
        clear: jest.fn(),
      });

      render(<ProfileScreen />);

      expect(screen.queryByText('Music Taste')).toBeNull();
    });

    it('should limit top artists to 4', () => {
      const statsWithManyArtists = {
        ...mockMusicStats,
        topArtists: [
          ...mockMusicStats.topArtists,
          {
            id: 'artist-5',
            name: 'Test Artist 5',
            image: null,
            genres: [],
          },
          {
            id: 'artist-6',
            name: 'Test Artist 6',
            image: null,
            genres: [],
          },
        ],
      };

      mockUseProfile.mockReturnValue({
        profile: mockProfile,
        matchHistory: [],
        musicStats: statsWithManyArtists,
        setProfile: jest.fn(),
        updateProfile: jest.fn(),
        setMatchHistory: jest.fn(),
        setMusicStats: jest.fn(),
        clear: jest.fn(),
      });

      render(<ProfileScreen />);

      expect(screen.getByText('Test Artist 4')).toBeTruthy();
      expect(screen.queryByText('Test Artist 5')).toBeNull();
      expect(screen.queryByText('Test Artist 6')).toBeNull();
    });

    it('should limit top tracks to 3', () => {
      const statsWithManyTracks = {
        ...mockMusicStats,
        topTracks: [
          ...mockMusicStats.topTracks,
          {
            id: 'track-4',
            title: 'Test Track 4',
            artist: 'Test Artist 4',
            album: 'Test Album 4',
            artwork: null,
            duration: 180,
            isrc: null,
            provider: 'spotify' as const,
          },
        ],
      };

      mockUseProfile.mockReturnValue({
        profile: mockProfile,
        matchHistory: [],
        musicStats: statsWithManyTracks,
        setProfile: jest.fn(),
        updateProfile: jest.fn(),
        setMatchHistory: jest.fn(),
        setMusicStats: jest.fn(),
        clear: jest.fn(),
      });

      render(<ProfileScreen />);

      expect(screen.getByText('Test Track 3')).toBeTruthy();
      expect(screen.queryByText('Test Track 4')).toBeNull();
    });

    it('should limit top genres to 5', () => {
      const statsWithManyGenres = {
        ...mockMusicStats,
        topGenres: [
          ...mockMusicStats.topGenres,
          'classical',
          'country',
        ],
      };

      mockUseProfile.mockReturnValue({
        profile: mockProfile,
        matchHistory: [],
        musicStats: statsWithManyGenres,
        setProfile: jest.fn(),
        updateProfile: jest.fn(),
        setMatchHistory: jest.fn(),
        setMusicStats: jest.fn(),
        clear: jest.fn(),
      });

      render(<ProfileScreen />);

      expect(screen.getByText('jazz')).toBeTruthy();
      expect(screen.queryByText('classical')).toBeNull();
      expect(screen.queryByText('country')).toBeNull();
    });
  });

  describe('Match History', () => {
    it('should display match history', () => {
      mockUseProfile.mockReturnValue({
        profile: mockProfile,
        matchHistory: mockMatchHistory,
        musicStats: null,
        setProfile: jest.fn(),
        updateProfile: jest.fn(),
        setMatchHistory: jest.fn(),
        setMusicStats: jest.fn(),
        clear: jest.fn(),
      });

      render(<ProfileScreen />);

      expect(screen.getByText('Match History')).toBeTruthy();
      expect(screen.getByText('vs @opponent1')).toBeTruthy();
      expect(screen.getByText('vs @opponent2')).toBeTruthy();
    });

    it('should display match results correctly', () => {
      mockUseProfile.mockReturnValue({
        profile: mockProfile,
        matchHistory: mockMatchHistory,
        musicStats: null,
        setProfile: jest.fn(),
        updateProfile: jest.fn(),
        setMatchHistory: jest.fn(),
        setMusicStats: jest.fn(),
        clear: jest.fn(),
      });

      render(<ProfileScreen />);

      expect(screen.getByText('Won')).toBeTruthy();
      expect(screen.getByText('Lost')).toBeTruthy();
      expect(screen.getByText('5-3')).toBeTruthy();
      expect(screen.getByText('2-4')).toBeTruthy();
    });

    it('should display track info for each match', () => {
      mockUseProfile.mockReturnValue({
        profile: mockProfile,
        matchHistory: mockMatchHistory,
        musicStats: null,
        setProfile: jest.fn(),
        updateProfile: jest.fn(),
        setMatchHistory: jest.fn(),
        setMusicStats: jest.fn(),
        clear: jest.fn(),
      });

      render(<ProfileScreen />);

      expect(screen.getByText('Match Track 1 • Match Artist 1')).toBeTruthy();
      expect(screen.getByText('Match Track 2 • Match Artist 2')).toBeTruthy();
    });

    it('should not display match history section when no matches', () => {
      mockUseProfile.mockReturnValue({
        profile: mockProfile,
        matchHistory: [],
        musicStats: null,
        setProfile: jest.fn(),
        updateProfile: jest.fn(),
        setMatchHistory: jest.fn(),
        setMusicStats: jest.fn(),
        clear: jest.fn(),
      });

      render(<ProfileScreen />);

      expect(screen.queryByText('Match History')).toBeNull();
    });

    it('should limit match history to 5 matches', () => {
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

      mockUseProfile.mockReturnValue({
        profile: mockProfile,
        matchHistory: manyMatches,
        musicStats: null,
        setProfile: jest.fn(),
        updateProfile: jest.fn(),
        setMatchHistory: jest.fn(),
        setMusicStats: jest.fn(),
        clear: jest.fn(),
      });

      render(<ProfileScreen />);

      expect(screen.getByText('vs @opponent4')).toBeTruthy();
      expect(screen.queryByText('vs @opponent5')).toBeNull();
    });
  });

  describe('Edit Profile Button', () => {
    it('should display edit profile button', () => {
      mockUseProfile.mockReturnValue({
        profile: mockProfile,
        matchHistory: [],
        musicStats: null,
        setProfile: jest.fn(),
        updateProfile: jest.fn(),
        setMatchHistory: jest.fn(),
        setMusicStats: jest.fn(),
        clear: jest.fn(),
      });

      render(<ProfileScreen />);

      expect(screen.getByLabelText('Edit profile')).toBeTruthy();
      expect(screen.getByText('Edit Profile')).toBeTruthy();
    });

    it('should enter edit mode when edit button is pressed', () => {
      mockUseProfile.mockReturnValue({
        profile: mockProfile,
        matchHistory: [],
        musicStats: null,
        setProfile: jest.fn(),
        updateProfile: jest.fn(),
        setMatchHistory: jest.fn(),
        setMusicStats: jest.fn(),
        clear: jest.fn(),
      });

      render(<ProfileScreen />);

      const editButton = screen.getByLabelText('Edit profile');
      fireEvent.press(editButton);

      // Should show input fields
      expect(screen.getByLabelText('Username input')).toBeTruthy();
      expect(screen.getByLabelText('Avatar URL input')).toBeTruthy();
      
      // Should show Save and Cancel buttons
      expect(screen.getByLabelText('Save profile changes')).toBeTruthy();
      expect(screen.getByLabelText('Cancel editing')).toBeTruthy();
    });

    it('should populate input fields with current profile data', () => {
      mockUseProfile.mockReturnValue({
        profile: mockProfile,
        matchHistory: [],
        musicStats: null,
        setProfile: jest.fn(),
        updateProfile: jest.fn(),
        setMatchHistory: jest.fn(),
        setMusicStats: jest.fn(),
        clear: jest.fn(),
      });

      render(<ProfileScreen />);

      const editButton = screen.getByLabelText('Edit profile');
      fireEvent.press(editButton);

      const usernameInput = screen.getByLabelText('Username input');
      const avatarInput = screen.getByLabelText('Avatar URL input');

      expect(usernameInput.props.value).toBe('testuser');
      expect(avatarInput.props.value).toBe('https://example.com/avatar.jpg');
    });

    it('should cancel edit mode when cancel button is pressed', () => {
      mockUseProfile.mockReturnValue({
        profile: mockProfile,
        matchHistory: [],
        musicStats: null,
        setProfile: jest.fn(),
        updateProfile: jest.fn(),
        setMatchHistory: jest.fn(),
        setMusicStats: jest.fn(),
        clear: jest.fn(),
      });

      render(<ProfileScreen />);

      // Enter edit mode
      const editButton = screen.getByLabelText('Edit profile');
      fireEvent.press(editButton);

      // Cancel editing
      const cancelButton = screen.getByLabelText('Cancel editing');
      fireEvent.press(cancelButton);

      // Should return to view mode
      expect(screen.queryByLabelText('Username input')).toBeNull();
      expect(screen.getByLabelText('Edit profile')).toBeTruthy();
    });
  });

  describe('Profile Editing', () => {
    it('should update username when changed', async () => {
      const mutateAsync = jest.fn().mockResolvedValue({});
      mockUseUpdateProfile.mockReturnValue({
        mutate: jest.fn(),
        mutateAsync,
        isPending: false,
        isError: false,
        isSuccess: false,
        error: null,
        data: undefined,
        reset: jest.fn(),
      } as any);

      mockUseProfile.mockReturnValue({
        profile: mockProfile,
        matchHistory: [],
        musicStats: null,
        setProfile: jest.fn(),
        updateProfile: jest.fn(),
        setMatchHistory: jest.fn(),
        setMusicStats: jest.fn(),
        clear: jest.fn(),
      });

      render(<ProfileScreen />);

      // Enter edit mode
      fireEvent.press(screen.getByLabelText('Edit profile'));

      // Change username
      const usernameInput = screen.getByLabelText('Username input');
      fireEvent.changeText(usernameInput, 'newusername');

      // Save changes
      fireEvent.press(screen.getByLabelText('Save profile changes'));

      await waitFor(() => {
        expect(mutateAsync).toHaveBeenCalledWith({
          username: 'newusername',
          avatar: undefined,
        });
      });
    });

    it('should update avatar when changed', async () => {
      const mutateAsync = jest.fn().mockResolvedValue({});
      mockUseUpdateProfile.mockReturnValue({
        mutate: jest.fn(),
        mutateAsync,
        isPending: false,
        isError: false,
        isSuccess: false,
        error: null,
        data: undefined,
        reset: jest.fn(),
      } as any);

      mockUseProfile.mockReturnValue({
        profile: mockProfile,
        matchHistory: [],
        musicStats: null,
        setProfile: jest.fn(),
        updateProfile: jest.fn(),
        setMatchHistory: jest.fn(),
        setMusicStats: jest.fn(),
        clear: jest.fn(),
      });

      render(<ProfileScreen />);

      // Enter edit mode
      fireEvent.press(screen.getByLabelText('Edit profile'));

      // Change avatar
      const avatarInput = screen.getByLabelText('Avatar URL input');
      fireEvent.changeText(avatarInput, 'https://example.com/new-avatar.jpg');

      // Save changes
      fireEvent.press(screen.getByLabelText('Save profile changes'));

      await waitFor(() => {
        expect(mutateAsync).toHaveBeenCalledWith({
          username: undefined,
          avatar: 'https://example.com/new-avatar.jpg',
        });
      });
    });

    it('should update both username and avatar when both changed', async () => {
      const mutateAsync = jest.fn().mockResolvedValue({});
      mockUseUpdateProfile.mockReturnValue({
        mutate: jest.fn(),
        mutateAsync,
        isPending: false,
        isError: false,
        isSuccess: false,
        error: null,
        data: undefined,
        reset: jest.fn(),
      } as any);

      mockUseProfile.mockReturnValue({
        profile: mockProfile,
        matchHistory: [],
        musicStats: null,
        setProfile: jest.fn(),
        updateProfile: jest.fn(),
        setMatchHistory: jest.fn(),
        setMusicStats: jest.fn(),
        clear: jest.fn(),
      });

      render(<ProfileScreen />);

      // Enter edit mode
      fireEvent.press(screen.getByLabelText('Edit profile'));

      // Change both fields
      fireEvent.changeText(screen.getByLabelText('Username input'), 'newusername');
      fireEvent.changeText(screen.getByLabelText('Avatar URL input'), 'https://example.com/new-avatar.jpg');

      // Save changes
      fireEvent.press(screen.getByLabelText('Save profile changes'));

      await waitFor(() => {
        expect(mutateAsync).toHaveBeenCalledWith({
          username: 'newusername',
          avatar: 'https://example.com/new-avatar.jpg',
        });
      });
    });

    it('should not call update when nothing changed', async () => {
      const mutateAsync = jest.fn().mockResolvedValue({});
      mockUseUpdateProfile.mockReturnValue({
        mutate: jest.fn(),
        mutateAsync,
        isPending: false,
        isError: false,
        isSuccess: false,
        error: null,
        data: undefined,
        reset: jest.fn(),
      } as any);

      mockUseProfile.mockReturnValue({
        profile: mockProfile,
        matchHistory: [],
        musicStats: null,
        setProfile: jest.fn(),
        updateProfile: jest.fn(),
        setMatchHistory: jest.fn(),
        setMusicStats: jest.fn(),
        clear: jest.fn(),
      });

      render(<ProfileScreen />);

      // Enter edit mode
      fireEvent.press(screen.getByLabelText('Edit profile'));

      // Save without changes
      fireEvent.press(screen.getByLabelText('Save profile changes'));

      await waitFor(() => {
        expect(mutateAsync).not.toHaveBeenCalled();
      });

      // Should exit edit mode
      expect(screen.queryByLabelText('Username input')).toBeNull();
    });

    it('should exit edit mode after successful save', async () => {
      const mutateAsync = jest.fn().mockResolvedValue({});
      mockUseUpdateProfile.mockReturnValue({
        mutate: jest.fn(),
        mutateAsync,
        isPending: false,
        isError: false,
        isSuccess: false,
        error: null,
        data: undefined,
        reset: jest.fn(),
      } as any);

      mockUseProfile.mockReturnValue({
        profile: mockProfile,
        matchHistory: [],
        musicStats: null,
        setProfile: jest.fn(),
        updateProfile: jest.fn(),
        setMatchHistory: jest.fn(),
        setMusicStats: jest.fn(),
        clear: jest.fn(),
      });

      render(<ProfileScreen />);

      // Enter edit mode
      fireEvent.press(screen.getByLabelText('Edit profile'));

      // Change username
      fireEvent.changeText(screen.getByLabelText('Username input'), 'newusername');

      // Save changes
      fireEvent.press(screen.getByLabelText('Save profile changes'));

      await waitFor(() => {
        expect(screen.queryByLabelText('Username input')).toBeNull();
        expect(screen.getByLabelText('Edit profile')).toBeTruthy();
      });
    });

    it('should show loading state while saving', () => {
      mockUseUpdateProfile.mockReturnValue({
        mutate: jest.fn(),
        mutateAsync: jest.fn(),
        isPending: true,
        isError: false,
        isSuccess: false,
        error: null,
        data: undefined,
        reset: jest.fn(),
      } as any);

      mockUseProfile.mockReturnValue({
        profile: mockProfile,
        matchHistory: [],
        musicStats: null,
        setProfile: jest.fn(),
        updateProfile: jest.fn(),
        setMatchHistory: jest.fn(),
        setMusicStats: jest.fn(),
        clear: jest.fn(),
      });

      render(<ProfileScreen />);

      // Enter edit mode
      fireEvent.press(screen.getByLabelText('Edit profile'));

      // Save button should be disabled
      const saveButton = screen.getByLabelText('Save profile changes');
      expect(saveButton.props.accessibilityState.disabled).toBe(true);
    });
  });

  describe('Validation', () => {
    it('should show error when username is empty', async () => {
      const mutateAsync = jest.fn().mockResolvedValue({});
      mockUseUpdateProfile.mockReturnValue({
        mutate: jest.fn(),
        mutateAsync,
        isPending: false,
        isError: false,
        isSuccess: false,
        error: null,
        data: undefined,
        reset: jest.fn(),
      } as any);

      mockUseProfile.mockReturnValue({
        profile: mockProfile,
        matchHistory: [],
        musicStats: null,
        setProfile: jest.fn(),
        updateProfile: jest.fn(),
        setMatchHistory: jest.fn(),
        setMusicStats: jest.fn(),
        clear: jest.fn(),
      });

      render(<ProfileScreen />);

      // Enter edit mode
      fireEvent.press(screen.getByLabelText('Edit profile'));

      // Clear username
      fireEvent.changeText(screen.getByLabelText('Username input'), '');

      // Try to save
      fireEvent.press(screen.getByLabelText('Save profile changes'));

      await waitFor(() => {
        expect(screen.getByText('Username is required')).toBeTruthy();
        expect(mutateAsync).not.toHaveBeenCalled();
      });
    });

    it('should show error when username is too short', async () => {
      const mutateAsync = jest.fn().mockResolvedValue({});
      mockUseUpdateProfile.mockReturnValue({
        mutate: jest.fn(),
        mutateAsync,
        isPending: false,
        isError: false,
        isSuccess: false,
        error: null,
        data: undefined,
        reset: jest.fn(),
      } as any);

      mockUseProfile.mockReturnValue({
        profile: mockProfile,
        matchHistory: [],
        musicStats: null,
        setProfile: jest.fn(),
        updateProfile: jest.fn(),
        setMatchHistory: jest.fn(),
        setMusicStats: jest.fn(),
        clear: jest.fn(),
      });

      render(<ProfileScreen />);

      // Enter edit mode
      fireEvent.press(screen.getByLabelText('Edit profile'));

      // Set short username
      fireEvent.changeText(screen.getByLabelText('Username input'), 'ab');

      // Try to save
      fireEvent.press(screen.getByLabelText('Save profile changes'));

      await waitFor(() => {
        expect(screen.getByText('Username must be at least 3 characters')).toBeTruthy();
        expect(mutateAsync).not.toHaveBeenCalled();
      });
    });

    it('should show error when username is too long', async () => {
      const mutateAsync = jest.fn().mockResolvedValue({});
      mockUseUpdateProfile.mockReturnValue({
        mutate: jest.fn(),
        mutateAsync,
        isPending: false,
        isError: false,
        isSuccess: false,
        error: null,
        data: undefined,
        reset: jest.fn(),
      } as any);

      mockUseProfile.mockReturnValue({
        profile: mockProfile,
        matchHistory: [],
        musicStats: null,
        setProfile: jest.fn(),
        updateProfile: jest.fn(),
        setMatchHistory: jest.fn(),
        setMusicStats: jest.fn(),
        clear: jest.fn(),
      });

      render(<ProfileScreen />);

      // Enter edit mode
      fireEvent.press(screen.getByLabelText('Edit profile'));

      // Set long username
      fireEvent.changeText(screen.getByLabelText('Username input'), 'a'.repeat(21));

      // Try to save
      fireEvent.press(screen.getByLabelText('Save profile changes'));

      await waitFor(() => {
        expect(screen.getByText('Username must be at most 20 characters')).toBeTruthy();
        expect(mutateAsync).not.toHaveBeenCalled();
      });
    });

    it('should show error when username contains invalid characters', async () => {
      const mutateAsync = jest.fn().mockResolvedValue({});
      mockUseUpdateProfile.mockReturnValue({
        mutate: jest.fn(),
        mutateAsync,
        isPending: false,
        isError: false,
        isSuccess: false,
        error: null,
        data: undefined,
        reset: jest.fn(),
      } as any);

      mockUseProfile.mockReturnValue({
        profile: mockProfile,
        matchHistory: [],
        musicStats: null,
        setProfile: jest.fn(),
        updateProfile: jest.fn(),
        setMatchHistory: jest.fn(),
        setMusicStats: jest.fn(),
        clear: jest.fn(),
      });

      render(<ProfileScreen />);

      // Enter edit mode
      fireEvent.press(screen.getByLabelText('Edit profile'));

      // Set username with invalid characters
      fireEvent.changeText(screen.getByLabelText('Username input'), 'user@name');

      // Try to save
      fireEvent.press(screen.getByLabelText('Save profile changes'));

      await waitFor(() => {
        expect(screen.getByText('Username can only contain letters, numbers, and underscores')).toBeTruthy();
        expect(mutateAsync).not.toHaveBeenCalled();
      });
    });

    it('should show error when avatar URL is invalid', async () => {
      const mutateAsync = jest.fn().mockResolvedValue({});
      mockUseUpdateProfile.mockReturnValue({
        mutate: jest.fn(),
        mutateAsync,
        isPending: false,
        isError: false,
        isSuccess: false,
        error: null,
        data: undefined,
        reset: jest.fn(),
      } as any);

      mockUseProfile.mockReturnValue({
        profile: mockProfile,
        matchHistory: [],
        musicStats: null,
        setProfile: jest.fn(),
        updateProfile: jest.fn(),
        setMatchHistory: jest.fn(),
        setMusicStats: jest.fn(),
        clear: jest.fn(),
      });

      render(<ProfileScreen />);

      // Enter edit mode
      fireEvent.press(screen.getByLabelText('Edit profile'));

      // Set invalid avatar URL
      fireEvent.changeText(screen.getByLabelText('Avatar URL input'), 'not-a-url');

      // Try to save
      fireEvent.press(screen.getByLabelText('Save profile changes'));

      await waitFor(() => {
        expect(screen.getByText('Avatar must be a valid URL')).toBeTruthy();
        expect(mutateAsync).not.toHaveBeenCalled();
      });
    });

    it('should allow empty avatar URL', async () => {
      const mutateAsync = jest.fn().mockResolvedValue({});
      mockUseUpdateProfile.mockReturnValue({
        mutate: jest.fn(),
        mutateAsync,
        isPending: false,
        isError: false,
        isSuccess: false,
        error: null,
        data: undefined,
        reset: jest.fn(),
      } as any);

      mockUseProfile.mockReturnValue({
        profile: mockProfile,
        matchHistory: [],
        musicStats: null,
        setProfile: jest.fn(),
        updateProfile: jest.fn(),
        setMatchHistory: jest.fn(),
        setMusicStats: jest.fn(),
        clear: jest.fn(),
      });

      render(<ProfileScreen />);

      // Enter edit mode
      fireEvent.press(screen.getByLabelText('Edit profile'));

      // Clear avatar URL
      fireEvent.changeText(screen.getByLabelText('Avatar URL input'), '');
      fireEvent.changeText(screen.getByLabelText('Username input'), 'newusername');

      // Save changes
      fireEvent.press(screen.getByLabelText('Save profile changes'));

      await waitFor(() => {
        expect(mutateAsync).toHaveBeenCalledWith({
          username: 'newusername',
          avatar: null,
        });
      });
    });

    it('should show error when update fails', async () => {
      const mutateAsync = jest.fn().mockRejectedValue(new Error('Network error'));
      mockUseUpdateProfile.mockReturnValue({
        mutate: jest.fn(),
        mutateAsync,
        isPending: false,
        isError: false,
        isSuccess: false,
        error: null,
        data: undefined,
        reset: jest.fn(),
      } as any);

      mockUseProfile.mockReturnValue({
        profile: mockProfile,
        matchHistory: [],
        musicStats: null,
        setProfile: jest.fn(),
        updateProfile: jest.fn(),
        setMatchHistory: jest.fn(),
        setMusicStats: jest.fn(),
        clear: jest.fn(),
      });

      render(<ProfileScreen />);

      // Enter edit mode
      fireEvent.press(screen.getByLabelText('Edit profile'));

      // Change username
      fireEvent.changeText(screen.getByLabelText('Username input'), 'newusername');

      // Try to save
      fireEvent.press(screen.getByLabelText('Save profile changes'));

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeTruthy();
      });

      // Should still be in edit mode
      expect(screen.getByLabelText('Username input')).toBeTruthy();
    });

    it('should clear validation error when canceling', () => {
      const mutateAsync = jest.fn().mockResolvedValue({});
      mockUseUpdateProfile.mockReturnValue({
        mutate: jest.fn(),
        mutateAsync,
        isPending: false,
        isError: false,
        isSuccess: false,
        error: null,
        data: undefined,
        reset: jest.fn(),
      } as any);

      mockUseProfile.mockReturnValue({
        profile: mockProfile,
        matchHistory: [],
        musicStats: null,
        setProfile: jest.fn(),
        updateProfile: jest.fn(),
        setMatchHistory: jest.fn(),
        setMusicStats: jest.fn(),
        clear: jest.fn(),
      });

      render(<ProfileScreen />);

      // Enter edit mode
      fireEvent.press(screen.getByLabelText('Edit profile'));

      // Set invalid username
      fireEvent.changeText(screen.getByLabelText('Username input'), 'ab');

      // Try to save (will show error)
      fireEvent.press(screen.getByLabelText('Save profile changes'));

      // Cancel editing
      fireEvent.press(screen.getByLabelText('Cancel editing'));

      // Error should be cleared
      expect(screen.queryByLabelText('Validation error')).toBeNull();
    });
  });

  describe('Edit Profile Button', () => {
    it('should display edit profile button', () => {
      mockUseProfile.mockReturnValue({
        profile: mockProfile,
        matchHistory: [],
        musicStats: null,
        setProfile: jest.fn(),
        updateProfile: jest.fn(),
        setMatchHistory: jest.fn(),
        setMusicStats: jest.fn(),
        clear: jest.fn(),
      });

      render(<ProfileScreen />);

      expect(screen.getByLabelText('Edit profile')).toBeTruthy();
      expect(screen.getByText('Edit Profile')).toBeTruthy();
    });

    it('should handle edit profile button press', () => {
      mockUseProfile.mockReturnValue({
        profile: mockProfile,
        matchHistory: [],
        musicStats: null,
        setProfile: jest.fn(),
        updateProfile: jest.fn(),
        setMatchHistory: jest.fn(),
        setMusicStats: jest.fn(),
        clear: jest.fn(),
      });

      render(<ProfileScreen />);

      const editButton = screen.getByLabelText('Edit profile');
      fireEvent.press(editButton);

      // Should enter edit mode
      expect(screen.getByLabelText('Username input')).toBeTruthy();
    });
  });

  describe('Loading State', () => {
    it('should display loading message when no profile', () => {
      mockUseProfile.mockReturnValue({
        profile: null,
        matchHistory: [],
        musicStats: null,
        setProfile: jest.fn(),
        updateProfile: jest.fn(),
        setMatchHistory: jest.fn(),
        setMusicStats: jest.fn(),
        clear: jest.fn(),
      });

      render(<ProfileScreen />);

      expect(screen.getByText('Loading profile...')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have accessibility labels for avatars', () => {
      mockUseProfile.mockReturnValue({
        profile: mockProfile,
        matchHistory: mockMatchHistory,
        musicStats: mockMusicStats,
        setProfile: jest.fn(),
        updateProfile: jest.fn(),
        setMatchHistory: jest.fn(),
        setMusicStats: jest.fn(),
        clear: jest.fn(),
      });

      render(<ProfileScreen />);

      expect(screen.getByLabelText('testuser\'s avatar')).toBeTruthy();
      expect(screen.getByLabelText('opponent1\'s avatar')).toBeTruthy();
    });

    it('should have accessibility labels for images', () => {
      mockUseProfile.mockReturnValue({
        profile: mockProfile,
        matchHistory: [],
        musicStats: mockMusicStats,
        setProfile: jest.fn(),
        updateProfile: jest.fn(),
        setMatchHistory: jest.fn(),
        setMusicStats: jest.fn(),
        clear: jest.fn(),
      });

      render(<ProfileScreen />);

      expect(screen.getByLabelText('Test Artist 1\'s image')).toBeTruthy();
      expect(screen.getByLabelText('Test Track 1 artwork')).toBeTruthy();
    });

    it('should have accessibility label for edit button', () => {
      mockUseProfile.mockReturnValue({
        profile: mockProfile,
        matchHistory: [],
        musicStats: null,
        setProfile: jest.fn(),
        updateProfile: jest.fn(),
        setMatchHistory: jest.fn(),
        setMusicStats: jest.fn(),
        clear: jest.fn(),
      });

      render(<ProfileScreen />);

      expect(screen.getByLabelText('Edit profile')).toBeTruthy();
    });
  });
});
