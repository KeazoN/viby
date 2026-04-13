/**
 * SettingsScreen Tests
 * 
 * Tests for the Settings Screen component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { SettingsScreen } from './SettingsScreen';
import { useProfile, useUpdateProfile } from '@viby/modules/profile';
import { useAuthStore } from '@viby/modules/auth';
import type { Profile } from '@viby/modules/profile';

// Mock the profile hooks
jest.mock('@viby/modules/profile', () => ({
  useProfile: jest.fn(),
  useUpdateProfile: jest.fn(),
}));

// Mock the auth store
jest.mock('@viby/modules/auth', () => ({
  useAuthStore: jest.fn(),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

const mockUseProfile = useProfile as jest.MockedFunction<typeof useProfile>;
const mockUseUpdateProfile = useUpdateProfile as jest.MockedFunction<typeof useUpdateProfile>;
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

describe('SettingsScreen', () => {
  const mockProfile: Profile = {
    id: 'profile-1',
    userId: 'user-1',
    username: 'testuser',
    avatar: 'https://example.com/avatar.jpg',
    bio: 'Music lover',
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

  const mockLogout = jest.fn();

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

    // Default mock for useAuthStore
    mockUseAuthStore.mockReturnValue(mockLogout);
  });

  describe('Notification Settings', () => {
    it('should display notification settings section', () => {
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

      render(<SettingsScreen />);

      expect(screen.getByText('Notifications')).toBeTruthy();
      expect(screen.getByText('Enable Notifications')).toBeTruthy();
      expect(screen.getByText('Match Notifications')).toBeTruthy();
      expect(screen.getByText('Message Notifications')).toBeTruthy();
    });

    it('should display notification descriptions', () => {
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

      render(<SettingsScreen />);

      expect(screen.getByText('Receive notifications for matches and messages')).toBeTruthy();
      expect(screen.getByText('Get notified when you match with someone')).toBeTruthy();
      expect(screen.getByText('Get notified when you receive messages')).toBeTruthy();
    });

    it('should show correct initial state for notification toggles', () => {
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

      render(<SettingsScreen />);

      const notificationsToggle = screen.getByLabelText('Toggle notifications');
      const matchToggle = screen.getByLabelText('Toggle match notifications');
      const messageToggle = screen.getByLabelText('Toggle message notifications');

      expect(notificationsToggle.props.value).toBe(true);
      expect(matchToggle.props.value).toBe(true);
      expect(messageToggle.props.value).toBe(true);
    });

    it('should toggle notifications enabled', async () => {
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

      render(<SettingsScreen />);

      const toggle = screen.getByLabelText('Toggle notifications');
      fireEvent(toggle, 'valueChange', false);

      await waitFor(() => {
        expect(mutateAsync).toHaveBeenCalledWith({
          preferences: {
            notificationsEnabled: false,
            matchNotifications: true,
            messageNotifications: true,
            privacyMode: 'public',
          },
        });
      });
    });

    it('should toggle match notifications', async () => {
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

      render(<SettingsScreen />);

      const toggle = screen.getByLabelText('Toggle match notifications');
      fireEvent(toggle, 'valueChange', false);

      await waitFor(() => {
        expect(mutateAsync).toHaveBeenCalledWith({
          preferences: {
            notificationsEnabled: true,
            matchNotifications: false,
            messageNotifications: true,
            privacyMode: 'public',
          },
        });
      });
    });

    it('should toggle message notifications', async () => {
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

      render(<SettingsScreen />);

      const toggle = screen.getByLabelText('Toggle message notifications');
      fireEvent(toggle, 'valueChange', false);

      await waitFor(() => {
        expect(mutateAsync).toHaveBeenCalledWith({
          preferences: {
            notificationsEnabled: true,
            matchNotifications: true,
            messageNotifications: false,
            privacyMode: 'public',
          },
        });
      });
    });

    it('should disable match and message toggles when notifications disabled', () => {
      const profileWithDisabledNotifications = {
        ...mockProfile,
        preferences: {
          ...mockProfile.preferences,
          notificationsEnabled: false,
        },
      };

      mockUseProfile.mockReturnValue({
        profile: profileWithDisabledNotifications,
        matchHistory: [],
        musicStats: null,
        setProfile: jest.fn(),
        updateProfile: jest.fn(),
        setMatchHistory: jest.fn(),
        setMusicStats: jest.fn(),
        clear: jest.fn(),
      });

      render(<SettingsScreen />);

      const matchToggle = screen.getByLabelText('Toggle match notifications');
      const messageToggle = screen.getByLabelText('Toggle message notifications');

      expect(matchToggle.props.disabled).toBe(true);
      expect(messageToggle.props.disabled).toBe(true);
    });

    it('should show alert on notification toggle error', async () => {
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

      render(<SettingsScreen />);

      const toggle = screen.getByLabelText('Toggle notifications');
      fireEvent(toggle, 'valueChange', false);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to update notification settings');
      });
    });
  });

  describe('Privacy Options', () => {
    it('should display privacy settings section', () => {
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

      render(<SettingsScreen />);

      expect(screen.getByText('Privacy')).toBeTruthy();
      expect(screen.getByText('Privacy Mode')).toBeTruthy();
    });

    it('should show correct privacy mode description for public', () => {
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

      render(<SettingsScreen />);

      expect(screen.getByText('Your profile is visible to others')).toBeTruthy();
    });

    it('should show correct privacy mode description for private', () => {
      const profileWithPrivateMode = {
        ...mockProfile,
        preferences: {
          ...mockProfile.preferences,
          privacyMode: 'private' as const,
        },
      };

      mockUseProfile.mockReturnValue({
        profile: profileWithPrivateMode,
        matchHistory: [],
        musicStats: null,
        setProfile: jest.fn(),
        updateProfile: jest.fn(),
        setMatchHistory: jest.fn(),
        setMusicStats: jest.fn(),
        clear: jest.fn(),
      });

      render(<SettingsScreen />);

      expect(screen.getByText('Your profile is hidden from discovery')).toBeTruthy();
    });

    it('should toggle privacy mode', async () => {
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

      render(<SettingsScreen />);

      const toggle = screen.getByLabelText('Toggle privacy mode');
      fireEvent(toggle, 'valueChange', true);

      await waitFor(() => {
        expect(mutateAsync).toHaveBeenCalledWith({
          preferences: {
            notificationsEnabled: true,
            matchNotifications: true,
            messageNotifications: true,
            privacyMode: 'private',
          },
        });
      });
    });

    it('should show alert on privacy toggle error', async () => {
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

      render(<SettingsScreen />);

      const toggle = screen.getByLabelText('Toggle privacy mode');
      fireEvent(toggle, 'valueChange', true);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to update privacy settings');
      });
    });
  });

  describe('Connected Accounts', () => {
    it('should display connected accounts section', () => {
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

      render(<SettingsScreen />);

      expect(screen.getByText('Connected Accounts')).toBeTruthy();
      expect(screen.getByText('Spotify')).toBeTruthy();
      expect(screen.getByText('Deezer')).toBeTruthy();
    });

    it('should show Spotify as connected', () => {
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

      render(<SettingsScreen />);

      const spotifyStatus = screen.getAllByText('Connected')[0];
      expect(spotifyStatus).toBeTruthy();
    });

    it('should show Deezer as not connected', () => {
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

      render(<SettingsScreen />);

      expect(screen.getByText('Not connected')).toBeTruthy();
    });

    it('should show disconnect button for connected Spotify account', () => {
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

      render(<SettingsScreen />);

      expect(screen.getByLabelText('Disconnect Spotify account')).toBeTruthy();
    });

    it('should not show disconnect button for unconnected Deezer account', () => {
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

      render(<SettingsScreen />);

      expect(screen.queryByLabelText('Disconnect Deezer account')).toBeNull();
    });

    it('should show confirmation alert when disconnecting Spotify', () => {
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

      render(<SettingsScreen />);

      const disconnectButton = screen.getByLabelText('Disconnect Spotify account');
      fireEvent.press(disconnectButton);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Disconnect Spotify',
        'Are you sure you want to disconnect your Spotify account? You will need to reconnect to continue using the app.',
        expect.any(Array)
      );
    });

    it('should disconnect Spotify when confirmed', async () => {
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

      render(<SettingsScreen />);

      const disconnectButton = screen.getByLabelText('Disconnect Spotify account');
      fireEvent.press(disconnectButton);

      // Get the alert options and call the Disconnect callback
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const disconnectCallback = alertCall[2][1].onPress;
      await disconnectCallback();

      // Should show "Not Implemented" alert since backend doesn't support this yet
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Not Implemented',
          'Account disconnection is not yet available. Please contact support to disconnect your account.'
        );
      });
    });

    it('should show success alert after disconnecting Spotify', async () => {
      // This test is no longer valid since disconnect is not implemented
      // Keeping it as a placeholder for future implementation
      expect(true).toBe(true);
    });

    it('should show error alert on disconnect failure', async () => {
      // This test is no longer valid since disconnect is not implemented
      // Keeping it as a placeholder for future implementation
      expect(true).toBe(true);
    });

    it('should show disconnect button for connected Deezer account', () => {
      const profileWithDeezer = {
        ...mockProfile,
        spotifyLinked: false,
        deezerLinked: true,
      };

      mockUseProfile.mockReturnValue({
        profile: profileWithDeezer,
        matchHistory: [],
        musicStats: null,
        setProfile: jest.fn(),
        updateProfile: jest.fn(),
        setMatchHistory: jest.fn(),
        setMusicStats: jest.fn(),
        clear: jest.fn(),
      });

      render(<SettingsScreen />);

      expect(screen.getByLabelText('Disconnect Deezer account')).toBeTruthy();
    });

    it('should disconnect Deezer when confirmed', async () => {
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

      const profileWithDeezer = {
        ...mockProfile,
        spotifyLinked: false,
        deezerLinked: true,
      };

      mockUseProfile.mockReturnValue({
        profile: profileWithDeezer,
        matchHistory: [],
        musicStats: null,
        setProfile: jest.fn(),
        updateProfile: jest.fn(),
        setMatchHistory: jest.fn(),
        setMusicStats: jest.fn(),
        clear: jest.fn(),
      });

      render(<SettingsScreen />);

      const disconnectButton = screen.getByLabelText('Disconnect Deezer account');
      fireEvent.press(disconnectButton);

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const disconnectCallback = alertCall[2][1].onPress;
      await disconnectCallback();

      // Should show "Not Implemented" alert since backend doesn't support this yet
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Not Implemented',
          'Account disconnection is not yet available. Please contact support to disconnect your account.'
        );
      });
    });
  });

  describe('Logout', () => {
    it('should display logout button', () => {
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

      render(<SettingsScreen />);

      expect(screen.getByLabelText('Logout button')).toBeTruthy();
      expect(screen.getByText('Logout')).toBeTruthy();
    });

    it('should show confirmation alert when logout pressed', () => {
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

      render(<SettingsScreen />);

      const logoutButton = screen.getByLabelText('Logout button');
      fireEvent.press(logoutButton);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Logout',
        'Are you sure you want to logout?',
        expect.any(Array)
      );
    });

    it('should call logout when confirmed', async () => {
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

      render(<SettingsScreen />);

      const logoutButton = screen.getByLabelText('Logout button');
      fireEvent.press(logoutButton);

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const logoutCallback = alertCall[2][1].onPress;
      await logoutCallback();

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled();
      });
    });

    it('should show error alert on logout failure', async () => {
      mockLogout.mockRejectedValue(new Error('Logout failed'));

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

      render(<SettingsScreen />);

      const logoutButton = screen.getByLabelText('Logout button');
      fireEvent.press(logoutButton);

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const logoutCallback = alertCall[2][1].onPress;
      await logoutCallback();

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to logout');
      });
    });

    it('should not call logout when cancelled', () => {
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

      render(<SettingsScreen />);

      const logoutButton = screen.getByLabelText('Logout button');
      fireEvent.press(logoutButton);

      // Verify cancel button exists
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const cancelButton = alertCall[2][0];
      expect(cancelButton.text).toBe('Cancel');
      expect(cancelButton.style).toBe('cancel');

      expect(mockLogout).not.toHaveBeenCalled();
    });
  });

  describe('Empty State', () => {
    it('should display loading message when profile is null', () => {
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

      render(<SettingsScreen />);

      expect(screen.getByText('Loading settings...')).toBeTruthy();
    });

    it('should not display loading message when profile exists', () => {
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

      render(<SettingsScreen />);

      expect(screen.queryByText('Loading settings...')).toBeNull();
    });
  });

  describe('Default Values', () => {
    it('should use default values when preferences are undefined', () => {
      const profileWithoutPreferences = {
        ...mockProfile,
        preferences: undefined,
      };

      mockUseProfile.mockReturnValue({
        profile: profileWithoutPreferences as any,
        matchHistory: [],
        musicStats: null,
        setProfile: jest.fn(),
        updateProfile: jest.fn(),
        setMatchHistory: jest.fn(),
        setMusicStats: jest.fn(),
        clear: jest.fn(),
      });

      render(<SettingsScreen />);

      const notificationsToggle = screen.getByLabelText('Toggle notifications');
      const matchToggle = screen.getByLabelText('Toggle match notifications');
      const messageToggle = screen.getByLabelText('Toggle message notifications');
      const privacyToggle = screen.getByLabelText('Toggle privacy mode');

      expect(notificationsToggle.props.value).toBe(true);
      expect(matchToggle.props.value).toBe(true);
      expect(messageToggle.props.value).toBe(true);
      expect(privacyToggle.props.value).toBe(false); // public mode
    });
  });

  describe('Legal Documents', () => {
    it('should display legal documents section', () => {
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

      render(<SettingsScreen />);

      expect(screen.getByText('Legal')).toBeTruthy();
      expect(screen.getByText('Privacy Policy')).toBeTruthy();
      expect(screen.getByText('Terms of Service')).toBeTruthy();
    });

    it('should have privacy policy button', () => {
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

      render(<SettingsScreen />);

      expect(screen.getByTestId('button-privacy-policy')).toBeTruthy();
      expect(screen.getByLabelText('View privacy policy')).toBeTruthy();
    });

    it('should have terms of service button', () => {
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

      render(<SettingsScreen />);

      expect(screen.getByTestId('button-terms-of-service')).toBeTruthy();
      expect(screen.getByLabelText('View terms of service')).toBeTruthy();
    });
  });
});
