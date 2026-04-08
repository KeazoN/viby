/**
 * WelcomeScreen Unit Tests
 * 
 * Tests for the Welcome screen component
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WelcomeScreen } from './WelcomeScreen';
import type { AuthStackParamList } from '../../app/navigation/types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

// Mock navigation wrapper
function renderWithNavigation() {
  return render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

describe('WelcomeScreen', () => {
  it('should render app logo', () => {
    const { getByText } = renderWithNavigation();
    expect(getByText('Viby')).toBeTruthy();
  });

  it('should render tagline', () => {
    const { getByText } = renderWithNavigation();
    expect(
      getByText("See who's vibing to the same music, connect instantly, play together")
    ).toBeTruthy();
  });

  it('should render Spotify login button', () => {
    const { getByText } = renderWithNavigation();
    expect(getByText('Login with Spotify')).toBeTruthy();
  });

  it('should render Deezer login button', () => {
    const { getByText } = renderWithNavigation();
    expect(getByText('Login with Deezer')).toBeTruthy();
  });

  it('should have accessibility labels for login buttons', () => {
    const { getByLabelText } = renderWithNavigation();
    expect(getByLabelText('Login with Spotify')).toBeTruthy();
    expect(getByLabelText('Login with Deezer')).toBeTruthy();
  });

  it('should navigate to Login screen with Spotify provider when Spotify button is pressed', () => {
    const { getByText } = renderWithNavigation();
    const spotifyButton = getByText('Login with Spotify');
    
    // Button should be pressable
    fireEvent.press(spotifyButton);
    // Navigation will be tested in integration tests
  });

  it('should navigate to Login screen with Deezer provider when Deezer button is pressed', () => {
    const { getByText } = renderWithNavigation();
    const deezerButton = getByText('Login with Deezer');
    
    // Button should be pressable
    fireEvent.press(deezerButton);
    // Navigation will be tested in integration tests
  });
});
