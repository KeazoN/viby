/**
 * LoginScreen Integration Tests
 * 
 * Tests the integration between WelcomeScreen and LoginScreen
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Linking } from 'react-native';
import { WelcomeScreen } from './WelcomeScreen';
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

// Mock Alert to prevent actual alerts during tests
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

function renderAuthFlow() {
  return render(
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

describe('LoginScreen Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should navigate from WelcomeScreen to LoginScreen with Spotify provider', async () => {
    const mockAuthUrl = 'https://accounts.spotify.com/authorize?...';
    (authService.initiateOAuth as jest.Mock).mockResolvedValue({ authUrl: mockAuthUrl });
    (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
    (Linking.openURL as jest.Mock).mockResolvedValue(undefined);

    const { getByText, findByText } = renderAuthFlow();

    // Start on WelcomeScreen
    expect(getByText('Viby')).toBeTruthy();

    // Press Spotify login button
    const spotifyButton = getByText('Login with Spotify');
    fireEvent.press(spotifyButton);

    // Should navigate to LoginScreen and initiate OAuth
    await waitFor(() => {
      expect(authService.initiateOAuth).toHaveBeenCalledWith('spotify');
      expect(Linking.openURL).toHaveBeenCalledWith(mockAuthUrl);
    });
  });

  it('should navigate from WelcomeScreen to LoginScreen with Deezer provider', async () => {
    const mockAuthUrl = 'https://connect.deezer.com/oauth/auth.php?...';
    (authService.initiateOAuth as jest.Mock).mockResolvedValue({ authUrl: mockAuthUrl });
    (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
    (Linking.openURL as jest.Mock).mockResolvedValue(undefined);

    const { getByText } = renderAuthFlow();

    // Start on WelcomeScreen
    expect(getByText('Viby')).toBeTruthy();

    // Press Deezer login button
    const deezerButton = getByText('Login with Deezer');
    fireEvent.press(deezerButton);

    // Should navigate to LoginScreen and initiate OAuth
    await waitFor(() => {
      expect(authService.initiateOAuth).toHaveBeenCalledWith('deezer');
      expect(Linking.openURL).toHaveBeenCalledWith(mockAuthUrl);
    });
  });

  it('should show loading state while initiating OAuth', async () => {
    const mockAuthUrl = 'https://accounts.spotify.com/authorize?...';
    (authService.initiateOAuth as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ authUrl: mockAuthUrl }), 100))
    );
    (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
    (Linking.openURL as jest.Mock).mockResolvedValue(undefined);

    const { getByText, findByText } = renderAuthFlow();

    // Press Spotify login button
    const spotifyButton = getByText('Login with Spotify');
    fireEvent.press(spotifyButton);

    // Should show loading state
    await findByText('Opening Spotify login...');

    // Wait for OAuth to complete
    await waitFor(() => {
      expect(Linking.openURL).toHaveBeenCalledWith(mockAuthUrl);
    });
  });
});
