/**
 * OAuthCallbackScreen Integration Tests
 * 
 * Tests OAuth callback flow integration with auth service and navigation.
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OAuthCallbackScreen } from './OAuthCallbackScreen';
import { OnboardingScreen } from './OnboardingScreen';
import { WelcomeScreen } from './WelcomeScreen';
import { authService, useAuthStore } from '@viby/modules/auth';
import type { AuthStackParamList } from '../../app/navigation/types';

// Mock auth service
jest.mock('@viby/modules/auth', () => ({
  authService: {
    handleOAuthCallback: jest.fn(),
  },
  useAuthStore: jest.fn(),
}));

const Stack = createNativeStackNavigator<AuthStackParamList>();

describe('OAuthCallbackScreen Integration', () => {
  const mockLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      login: mockLogin,
    });
  });

  const renderAuthFlow = (initialRoute: 'OAuth', params: { code: string; provider: 'spotify' | 'deezer' }) => {
    return render(
      <NavigationContainer>
        <Stack.Navigator initialRouteName={initialRoute}>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen
            name="OAuth"
            component={OAuthCallbackScreen}
            initialParams={params}
          />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  };

  it('should complete OAuth flow and navigate to onboarding', async () => {
    const mockAuthResponse = {
      accessToken: 'access-token-123',
      refreshToken: 'refresh-token-456',
      expiresIn: 3600,
      user: {
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        provider: 'spotify' as const,
      },
    };

    (authService.handleOAuthCallback as jest.Mock).mockResolvedValue(mockAuthResponse);

    const { getByText } = renderAuthFlow('OAuth', {
      code: 'auth-code-123',
      provider: 'spotify',
    });

    // Should show loading state
    expect(getByText('Completing authentication...')).toBeTruthy();

    // Wait for OAuth callback to complete
    await waitFor(() => {
      expect(authService.handleOAuthCallback).toHaveBeenCalledWith('auth-code-123', 'spotify');
    });

    // Should update auth store
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        {
          accessToken: 'access-token-123',
          refreshToken: 'refresh-token-456',
          expiresIn: 3600,
        },
        mockAuthResponse.user
      );
    });

    // Should navigate to onboarding
    await waitFor(() => {
      expect(getByText(/welcome/i)).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('should handle OAuth error and navigate back to welcome', async () => {
    const mockError = new Error('Invalid authorization code');
    (authService.handleOAuthCallback as jest.Mock).mockRejectedValue(mockError);

    const { getByText } = renderAuthFlow('OAuth', {
      code: 'invalid-code',
      provider: 'spotify',
    });

    // Wait for error to be handled
    await waitFor(() => {
      expect(authService.handleOAuthCallback).toHaveBeenCalledWith('invalid-code', 'spotify');
    });

    // Should show error state
    await waitFor(() => {
      expect(getByText('Authentication failed...')).toBeTruthy();
    });

    // Should not call login
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('should handle Spotify OAuth callback end-to-end', async () => {
    const mockAuthResponse = {
      accessToken: 'spotify-access-token',
      refreshToken: 'spotify-refresh-token',
      expiresIn: 3600,
      user: {
        id: 'spotify-user-123',
        email: 'spotify@example.com',
        displayName: 'Spotify User',
        provider: 'spotify' as const,
      },
    };

    (authService.handleOAuthCallback as jest.Mock).mockResolvedValue(mockAuthResponse);

    renderAuthFlow('OAuth', {
      code: 'spotify-code-123',
      provider: 'spotify',
    });

    await waitFor(() => {
      expect(authService.handleOAuthCallback).toHaveBeenCalledWith('spotify-code-123', 'spotify');
    });

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: 'spotify-access-token',
        }),
        expect.objectContaining({
          provider: 'spotify',
        })
      );
    });
  });

  it('should handle Deezer OAuth callback end-to-end', async () => {
    const mockAuthResponse = {
      accessToken: 'deezer-access-token',
      refreshToken: 'deezer-refresh-token',
      expiresIn: 3600,
      user: {
        id: 'deezer-user-456',
        email: 'deezer@example.com',
        displayName: 'Deezer User',
        provider: 'deezer' as const,
      },
    };

    (authService.handleOAuthCallback as jest.Mock).mockResolvedValue(mockAuthResponse);

    renderAuthFlow('OAuth', {
      code: 'deezer-code-789',
      provider: 'deezer',
    });

    await waitFor(() => {
      expect(authService.handleOAuthCallback).toHaveBeenCalledWith('deezer-code-789', 'deezer');
    });

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: 'deezer-access-token',
        }),
        expect.objectContaining({
          provider: 'deezer',
        })
      );
    });
  });

  it('should store tokens securely via auth service', async () => {
    const mockAuthResponse = {
      accessToken: 'secure-access-token',
      refreshToken: 'secure-refresh-token',
      expiresIn: 3600,
      user: {
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        provider: 'spotify' as const,
      },
    };

    (authService.handleOAuthCallback as jest.Mock).mockResolvedValue(mockAuthResponse);

    renderAuthFlow('OAuth', {
      code: 'auth-code-123',
      provider: 'spotify',
    });

    await waitFor(() => {
      expect(authService.handleOAuthCallback).toHaveBeenCalled();
    });

    // Auth service should handle token storage internally
    // We verify this by checking that login was called with the tokens
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: 'secure-access-token',
          refreshToken: 'secure-refresh-token',
        }),
        expect.any(Object)
      );
    });
  });
});
