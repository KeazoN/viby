/**
 * LoginScreen Unit Tests
 * 
 * Tests for the Login screen component
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Linking, Alert } from 'react-native';
import { LoginScreen } from './LoginScreen';
import type { AuthStackParamList } from '../../app/navigation/types';
import { authService } from '@viby/modules/auth';

const Stack = createNativeStackNavigator<AuthStackParamList>();

// Mock dependencies
jest.mock('@viby/modules/auth', () => ({
  authService: {
    initiateOAuth: jest.fn(),
  },
}));

jest.mock('react-native/Libraries/Linking/Linking', () => ({
  canOpenURL: jest.fn(),
  openURL: jest.fn(),
}));

jest.spyOn(Alert, 'alert');

// Mock navigation wrapper
function renderWithNavigation(initialParams?: { provider?: 'spotify' | 'deezer' }) {
  return render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          initialParams={initialParams}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Provider Selection Mode', () => {
    it('should render provider selection when no provider is specified', () => {
      const { getByText } = renderWithNavigation();
      expect(getByText('Choose Your Music Provider')).toBeTruthy();
      expect(getByText('Connect your music streaming account to get started')).toBeTruthy();
    });

    it('should render Spotify login button', () => {
      const { getByText } = renderWithNavigation();
      expect(getByText('Continue with Spotify')).toBeTruthy();
    });

    it('should render Deezer login button', () => {
      const { getByText } = renderWithNavigation();
      expect(getByText('Continue with Deezer')).toBeTruthy();
    });

    it('should render back button', () => {
      const { getByText } = renderWithNavigation();
      expect(getByText('Back')).toBeTruthy();
    });

    it('should have accessibility labels for buttons', () => {
      const { getByLabelText } = renderWithNavigation();
      expect(getByLabelText('Login with Spotify')).toBeTruthy();
      expect(getByLabelText('Login with Deezer')).toBeTruthy();
      expect(getByLabelText('Go back')).toBeTruthy();
    });
  });

  describe('OAuth Flow Initiation', () => {
    it('should initiate Spotify OAuth when Spotify button is pressed', async () => {
      const mockAuthUrl = 'https://accounts.spotify.com/authorize?...';
      (authService.initiateOAuth as jest.Mock).mockResolvedValue({ authUrl: mockAuthUrl });
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
      (Linking.openURL as jest.Mock).mockResolvedValue(undefined);

      const { getByText } = renderWithNavigation();
      const spotifyButton = getByText('Continue with Spotify');

      fireEvent.press(spotifyButton);

      await waitFor(() => {
        expect(authService.initiateOAuth).toHaveBeenCalledWith('spotify');
        expect(Linking.canOpenURL).toHaveBeenCalledWith(mockAuthUrl);
        expect(Linking.openURL).toHaveBeenCalledWith(mockAuthUrl);
      });
    });

    it('should initiate Deezer OAuth when Deezer button is pressed', async () => {
      const mockAuthUrl = 'https://connect.deezer.com/oauth/auth.php?...';
      (authService.initiateOAuth as jest.Mock).mockResolvedValue({ authUrl: mockAuthUrl });
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
      (Linking.openURL as jest.Mock).mockResolvedValue(undefined);

      const { getByText } = renderWithNavigation();
      const deezerButton = getByText('Continue with Deezer');

      fireEvent.press(deezerButton);

      await waitFor(() => {
        expect(authService.initiateOAuth).toHaveBeenCalledWith('deezer');
        expect(Linking.canOpenURL).toHaveBeenCalledWith(mockAuthUrl);
        expect(Linking.openURL).toHaveBeenCalledWith(mockAuthUrl);
      });
    });

    it('should automatically initiate OAuth when provider param is specified', async () => {
      const mockAuthUrl = 'https://accounts.spotify.com/authorize?...';
      (authService.initiateOAuth as jest.Mock).mockResolvedValue({ authUrl: mockAuthUrl });
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
      (Linking.openURL as jest.Mock).mockResolvedValue(undefined);

      renderWithNavigation({ provider: 'spotify' });

      await waitFor(() => {
        expect(authService.initiateOAuth).toHaveBeenCalledWith('spotify');
        expect(Linking.openURL).toHaveBeenCalledWith(mockAuthUrl);
      });
    });

    it('should show loading state when provider param is specified', async () => {
      const mockAuthUrl = 'https://accounts.spotify.com/authorize?...';
      (authService.initiateOAuth as jest.Mock).mockResolvedValue({ authUrl: mockAuthUrl });
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
      (Linking.openURL as jest.Mock).mockResolvedValue(undefined);

      const { getByText } = renderWithNavigation({ provider: 'spotify' });

      await waitFor(() => {
        expect(getByText('Opening Spotify login...')).toBeTruthy();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error alert when OAuth initiation fails', async () => {
      const mockError = new Error('Network error');
      (authService.initiateOAuth as jest.Mock).mockRejectedValue(mockError);

      const { getByText } = renderWithNavigation();
      const spotifyButton = getByText('Continue with Spotify');

      fireEvent.press(spotifyButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Authentication Error',
          'Failed to start spotify login. Please try again.',
          expect.any(Array)
        );
      });
    });

    it('should show error alert when URL cannot be opened', async () => {
      const mockAuthUrl = 'https://accounts.spotify.com/authorize?...';
      (authService.initiateOAuth as jest.Mock).mockResolvedValue({ authUrl: mockAuthUrl });
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(false);

      const { getByText } = renderWithNavigation();
      const spotifyButton = getByText('Continue with Spotify');

      fireEvent.press(spotifyButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Authentication Error',
          'Failed to start spotify login. Please try again.',
          expect.any(Array)
        );
      });
    });

    it('should disable buttons while loading', async () => {
      const mockAuthUrl = 'https://accounts.spotify.com/authorize?...';
      (authService.initiateOAuth as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ authUrl: mockAuthUrl }), 100))
      );
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
      (Linking.openURL as jest.Mock).mockResolvedValue(undefined);

      const { getByLabelText } = renderWithNavigation();
      const spotifyButton = getByLabelText('Login with Spotify');

      fireEvent.press(spotifyButton);

      // Buttons should be disabled during loading
      await waitFor(() => {
        expect(spotifyButton.props.accessibilityState?.disabled).toBe(true);
      });
    });
  });
});
