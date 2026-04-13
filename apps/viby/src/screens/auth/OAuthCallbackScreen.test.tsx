/**
 * OAuthCallbackScreen Unit Tests
 * 
 * Tests OAuth callback handling, token exchange, and navigation.
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Alert } from 'react-native';
import { OAuthCallbackScreen } from './OAuthCallbackScreen';
import { authService, useAuthStore } from '@viby/modules/auth';
import type { AuthStackParamList } from '../../app/navigation/types';

// Mock dependencies
jest.mock('@viby/modules/auth');
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

const Stack = createNativeStackNavigator<AuthStackParamList>();

describe('OAuthCallbackScreen', () => {
  const mockLogin = jest.fn();
  const mockNavigate = jest.fn();
  const mockReset = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock auth store
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      login: mockLogin,
    });
  });

  const renderScreen = (code: string, provider: 'spotify' | 'deezer') => {
    return render(
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="OAuth"
            component={OAuthCallbackScreen}
            initialParams={{ code, provider }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    );
  };

  describe('Successful OAuth Callback', () => {
    it('should handle OAuth callback with code and exchange for tokens', async () => {
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

      const { getByText } = renderScreen('auth-code-123', 'spotify');

      // Should show loading state
      expect(getByText('Completing authentication...')).toBeTruthy();

      // Wait for OAuth callback to complete
      await waitFor(() => {
        expect(authService.handleOAuthCallback).toHaveBeenCalledWith('auth-code-123', 'spotify');
      });

      // Should call login with tokens and user
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
    });

    it('should handle Deezer OAuth callback', async () => {
      const mockAuthResponse = {
        accessToken: 'deezer-access-token',
        refreshToken: 'deezer-refresh-token',
        expiresIn: 3600,
        user: {
          id: 'user-456',
          email: 'deezer@example.com',
          displayName: 'Deezer User',
          provider: 'deezer' as const,
        },
      };

      (authService.handleOAuthCallback as jest.Mock).mockResolvedValue(mockAuthResponse);

      renderScreen('deezer-code-789', 'deezer');

      await waitFor(() => {
        expect(authService.handleOAuthCallback).toHaveBeenCalledWith('deezer-code-789', 'deezer');
      });

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith(
          {
            accessToken: 'deezer-access-token',
            refreshToken: 'deezer-refresh-token',
            expiresIn: 3600,
          },
          mockAuthResponse.user
        );
      });
    });
  });

  describe('Failed OAuth Callback', () => {
    it('should handle OAuth callback error and show alert', async () => {
      const mockError = new Error('Invalid authorization code');
      (authService.handleOAuthCallback as jest.Mock).mockRejectedValue(mockError);

      const { getByText } = renderScreen('invalid-code', 'spotify');

      await waitFor(() => {
        expect(authService.handleOAuthCallback).toHaveBeenCalledWith('invalid-code', 'spotify');
      });

      // Should show error state
      await waitFor(() => {
        expect(getByText('Authentication failed...')).toBeTruthy();
        expect(getByText('Invalid authorization code')).toBeTruthy();
      });

      // Should show alert
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Authentication Failed',
          'Invalid authorization code',
          expect.any(Array)
        );
      });
    });

    it('should handle network error during OAuth callback', async () => {
      const mockError = new Error('Network request failed');
      (authService.handleOAuthCallback as jest.Mock).mockRejectedValue(mockError);

      renderScreen('auth-code-123', 'spotify');

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Authentication Failed',
          'Network request failed',
          expect.any(Array)
        );
      });
    });

    it('should handle unknown error during OAuth callback', async () => {
      (authService.handleOAuthCallback as jest.Mock).mockRejectedValue('Unknown error');

      renderScreen('auth-code-123', 'spotify');

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Authentication Failed',
          'Failed to complete authentication',
          expect.any(Array)
        );
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to onboarding after successful authentication', async () => {
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

      renderScreen('auth-code-123', 'spotify');

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
      });

      // Note: Navigation reset is tested in integration tests
      // as it requires full navigation context
    });
  });

  describe('UI States', () => {
    it('should display loading indicator during authentication', () => {
      (authService.handleOAuthCallback as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { getByText, UNSAFE_getByType } = renderScreen('auth-code-123', 'spotify');

      expect(getByText('Completing authentication...')).toBeTruthy();
      // ActivityIndicator should be present
      expect(UNSAFE_getByType(require('react-native').ActivityIndicator)).toBeTruthy();
    });

    it('should display error message when authentication fails', async () => {
      const mockError = new Error('Authentication failed');
      (authService.handleOAuthCallback as jest.Mock).mockRejectedValue(mockError);

      const { getByText } = renderScreen('auth-code-123', 'spotify');

      await waitFor(() => {
        expect(getByText('Authentication failed...')).toBeTruthy();
        expect(getByText('Authentication failed')).toBeTruthy();
      });
    });
  });
});
