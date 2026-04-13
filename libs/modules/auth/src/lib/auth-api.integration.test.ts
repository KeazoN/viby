/**
 * Auth + API Integration Tests
 * 
 * Tests the complete authentication flow including OAuth, token refresh, and logout.
 * Validates integration between AuthService, HttpClient, StorageService, and backend API.
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.7**
 * - 2.1: OAuth flow with Spotify/Deezer
 * - 2.2: JWT token storage and retrieval
 * - 2.3: Automatic token refresh
 * - 2.7: Logout and token cleanup
 */

import { authService } from './services/auth-service';
import { httpClient } from '@viby/shared/networking';
import { storageService } from '@viby/shared/storage';
import type { AuthResponse, MusicProvider } from './types';

// Mock dependencies
jest.mock('@viby/shared/networking');
jest.mock('@viby/shared/storage');

describe('Auth + API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Requirement 2.1: OAuth Flow End-to-End', () => {
    it('should complete Spotify OAuth flow from initiation to token storage', async () => {
      // Step 1: Initiate OAuth
      const mockAuthUrl = 'https://accounts.spotify.com/authorize?client_id=test';
      (httpClient.get as jest.Mock).mockResolvedValueOnce({
        authUrl: mockAuthUrl,
      });

      const initiateResponse = await authService.initiateOAuth('spotify');
      
      expect(httpClient.get).toHaveBeenCalledWith('/auth/spotify');
      expect(initiateResponse.authUrl).toBe(mockAuthUrl);

      // Step 2: Handle OAuth callback
      const mockAuthResponse: AuthResponse = {
        accessToken: 'spotify-access-token',
        refreshToken: 'spotify-refresh-token',
        expiresIn: 3600,
        user: {
          id: 'user-123',
          username: 'testuser',
          email: 'test@example.com',
          avatar: null,
        },
      };

      (httpClient.get as jest.Mock).mockResolvedValueOnce(mockAuthResponse);
      (storageService.setAccessToken as jest.Mock).mockResolvedValue(undefined);
      (storageService.setRefreshToken as jest.Mock).mockResolvedValue(undefined);

      const callbackResponse = await authService.handleOAuthCallback(
        'auth-code-123',
        'spotify'
      );

      // Verify callback API call
      expect(httpClient.get).toHaveBeenCalledWith(
        '/auth/spotify/callback?code=auth-code-123'
      );

      // Verify tokens are stored
      expect(storageService.setAccessToken).toHaveBeenCalledWith('spotify-access-token');
      expect(storageService.setRefreshToken).toHaveBeenCalledWith('spotify-refresh-token');

      // Verify response
      expect(callbackResponse).toEqual(mockAuthResponse);
    });

    it('should complete Deezer OAuth flow from initiation to token storage', async () => {
      // Step 1: Initiate OAuth (Deezer constructs URL client-side)
      process.env.EXPO_PUBLIC_DEEZER_APP_ID = 'deezer-app-id';
      process.env.EXPO_PUBLIC_DEEZER_REDIRECT_URI = 'https://app.viby.com/callback';

      const initiateResponse = await authService.initiateOAuth('deezer');
      
      expect(initiateResponse.authUrl).toContain('connect.deezer.com/oauth/auth.php');
      expect(initiateResponse.authUrl).toContain('app_id=deezer-app-id');

      // Step 2: Handle OAuth callback
      const mockAuthResponse: AuthResponse = {
        accessToken: 'deezer-access-token',
        refreshToken: 'deezer-refresh-token',
        expiresIn: 3600,
        user: {
          id: 'user-456',
          username: 'deezeruser',
          email: 'deezer@example.com',
          avatar: null,
        },
      };

      (httpClient.get as jest.Mock).mockResolvedValueOnce(mockAuthResponse);
      (storageService.setAccessToken as jest.Mock).mockResolvedValue(undefined);
      (storageService.setRefreshToken as jest.Mock).mockResolvedValue(undefined);

      const callbackResponse = await authService.handleOAuthCallback(
        'deezer-code-456',
        'deezer'
      );

      // Verify callback API call
      expect(httpClient.get).toHaveBeenCalledWith(
        '/auth/deezer/callback?code=deezer-code-456'
      );

      // Verify tokens are stored
      expect(storageService.setAccessToken).toHaveBeenCalledWith('deezer-access-token');
      expect(storageService.setRefreshToken).toHaveBeenCalledWith('deezer-refresh-token');

      // Verify response
      expect(callbackResponse).toEqual(mockAuthResponse);
    });

    it('should handle OAuth callback errors gracefully', async () => {
      const error = new Error('Invalid authorization code');
      (httpClient.get as jest.Mock).mockRejectedValueOnce(error);

      await expect(
        authService.handleOAuthCallback('invalid-code', 'spotify')
      ).rejects.toThrow('Invalid authorization code');

      // Verify tokens are not stored on error
      expect(storageService.setAccessToken).not.toHaveBeenCalled();
      expect(storageService.setRefreshToken).not.toHaveBeenCalled();
    });
  });

  describe('Requirement 2.2: JWT Token Storage and Retrieval', () => {
    it('should store and retrieve access token', async () => {
      const mockAuthResponse: AuthResponse = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresIn: 3600,
        user: {
          id: 'user-789',
          username: 'testuser',
          email: 'test@example.com',
          avatar: null,
        },
      };

      (httpClient.get as jest.Mock).mockResolvedValueOnce(mockAuthResponse);
      (storageService.setAccessToken as jest.Mock).mockResolvedValue(undefined);
      (storageService.setRefreshToken as jest.Mock).mockResolvedValue(undefined);

      await authService.handleOAuthCallback('code-123', 'spotify');

      // Verify tokens are stored securely
      expect(storageService.setAccessToken).toHaveBeenCalledWith('test-access-token');
      expect(storageService.setRefreshToken).toHaveBeenCalledWith('test-refresh-token');

      // Verify token retrieval
      (storageService.getAccessToken as jest.Mock).mockResolvedValue('test-access-token');
      
      const accessToken = await authService.getAccessToken();
      expect(accessToken).toBe('test-access-token');
    });

    it('should check authentication status based on stored tokens', async () => {
      // User is authenticated
      (storageService.getAccessToken as jest.Mock).mockResolvedValue('valid-token');
      
      let isAuthenticated = await authService.isAuthenticated();
      expect(isAuthenticated).toBe(true);

      // User is not authenticated
      (storageService.getAccessToken as jest.Mock).mockResolvedValue(null);
      
      isAuthenticated = await authService.isAuthenticated();
      expect(isAuthenticated).toBe(false);
    });
  });

  describe('Requirement 2.3: Automatic Token Refresh Flow', () => {
    it('should refresh expired tokens using refresh token', async () => {
      // Setup: User has expired access token but valid refresh token
      (storageService.getRefreshToken as jest.Mock).mockResolvedValue('valid-refresh-token');

      const mockRefreshResponse: AuthResponse = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
        user: {
          id: 'user-123',
          username: 'testuser',
          email: 'test@example.com',
          avatar: null,
        },
      };

      (httpClient.post as jest.Mock).mockResolvedValueOnce(mockRefreshResponse);
      (storageService.setAccessToken as jest.Mock).mockResolvedValue(undefined);
      (storageService.setRefreshToken as jest.Mock).mockResolvedValue(undefined);

      // Execute token refresh
      const tokens = await authService.refreshTokens();

      // Verify refresh API call
      expect(httpClient.post).toHaveBeenCalledWith('/auth/refresh', {
        refreshToken: 'valid-refresh-token',
      });

      // Verify new tokens are stored
      expect(storageService.setAccessToken).toHaveBeenCalledWith('new-access-token');
      expect(storageService.setRefreshToken).toHaveBeenCalledWith('new-refresh-token');

      // Verify returned tokens
      expect(tokens).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
      });
    });

    it('should clear tokens and throw error when refresh fails', async () => {
      (storageService.getRefreshToken as jest.Mock).mockResolvedValue('invalid-refresh-token');
      (httpClient.post as jest.Mock).mockRejectedValueOnce(new Error('Invalid refresh token'));
      (storageService.clearTokens as jest.Mock).mockResolvedValue(undefined);

      await expect(authService.refreshTokens()).rejects.toThrow('Invalid refresh token');

      // Verify tokens are cleared on refresh failure
      expect(storageService.clearTokens).toHaveBeenCalled();
    });

    it('should throw error when no refresh token is available', async () => {
      (storageService.getRefreshToken as jest.Mock).mockResolvedValue(null);

      await expect(authService.refreshTokens()).rejects.toThrow('No refresh token available');

      // Verify API is not called without refresh token
      expect(httpClient.post).not.toHaveBeenCalled();
    });
  });

  describe('Requirement 2.7: Logout Flow', () => {
    it('should complete logout flow with backend session revocation', async () => {
      (httpClient.post as jest.Mock).mockResolvedValueOnce({});
      (storageService.clearTokens as jest.Mock).mockResolvedValue(undefined);

      await authService.logout();

      // Verify backend logout API is called
      expect(httpClient.post).toHaveBeenCalledWith('/auth/logout');

      // Verify local tokens are cleared
      expect(storageService.clearTokens).toHaveBeenCalled();
    });

    it('should clear local tokens even if backend logout fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      (httpClient.post as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      (storageService.clearTokens as jest.Mock).mockResolvedValue(undefined);

      await authService.logout();

      // Verify error is logged but doesn't throw
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to revoke session on backend:',
        expect.any(Error)
      );

      // Verify local tokens are still cleared
      expect(storageService.clearTokens).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should result in unauthenticated state after logout', async () => {
      (httpClient.post as jest.Mock).mockResolvedValueOnce({});
      (storageService.clearTokens as jest.Mock).mockResolvedValue(undefined);
      (storageService.getAccessToken as jest.Mock).mockResolvedValue(null);

      await authService.logout();

      // Verify user is no longer authenticated
      const isAuthenticated = await authService.isAuthenticated();
      expect(isAuthenticated).toBe(false);
    });
  });

  describe('Complete Auth Flow Integration', () => {
    it('should handle complete auth lifecycle: login -> refresh -> logout', async () => {
      // Step 1: Login via OAuth
      const mockAuthResponse: AuthResponse = {
        accessToken: 'initial-access-token',
        refreshToken: 'initial-refresh-token',
        expiresIn: 3600,
        user: {
          id: 'user-complete',
          username: 'completeuser',
          email: 'complete@example.com',
          avatar: null,
        },
      };

      (httpClient.get as jest.Mock).mockResolvedValueOnce(mockAuthResponse);
      (storageService.setAccessToken as jest.Mock).mockResolvedValue(undefined);
      (storageService.setRefreshToken as jest.Mock).mockResolvedValue(undefined);
      (storageService.getAccessToken as jest.Mock).mockResolvedValue('initial-access-token');

      await authService.handleOAuthCallback('code-complete', 'spotify');
      
      let isAuthenticated = await authService.isAuthenticated();
      expect(isAuthenticated).toBe(true);

      // Step 2: Token refresh
      (storageService.getRefreshToken as jest.Mock).mockResolvedValue('initial-refresh-token');
      
      const mockRefreshResponse: AuthResponse = {
        accessToken: 'refreshed-access-token',
        refreshToken: 'refreshed-refresh-token',
        expiresIn: 3600,
        user: mockAuthResponse.user,
      };

      (httpClient.post as jest.Mock).mockResolvedValueOnce(mockRefreshResponse);
      (storageService.getAccessToken as jest.Mock).mockResolvedValue('refreshed-access-token');

      await authService.refreshTokens();
      
      isAuthenticated = await authService.isAuthenticated();
      expect(isAuthenticated).toBe(true);

      // Step 3: Logout
      (httpClient.post as jest.Mock).mockResolvedValueOnce({});
      (storageService.clearTokens as jest.Mock).mockResolvedValue(undefined);
      (storageService.getAccessToken as jest.Mock).mockResolvedValue(null);

      await authService.logout();
      
      isAuthenticated = await authService.isAuthenticated();
      expect(isAuthenticated).toBe(false);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle network errors during OAuth initiation', async () => {
      (httpClient.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(authService.initiateOAuth('spotify')).rejects.toThrow('Network error');
    });

    it('should handle unsupported OAuth provider', async () => {
      await expect(
        authService.initiateOAuth('unsupported' as MusicProvider)
      ).rejects.toThrow('Unsupported provider: unsupported');
    });

    it('should handle storage errors during token save', async () => {
      const mockAuthResponse: AuthResponse = {
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
        expiresIn: 3600,
        user: {
          id: 'user-123',
          username: 'testuser',
          email: 'test@example.com',
          avatar: null,
        },
      };

      (httpClient.get as jest.Mock).mockResolvedValueOnce(mockAuthResponse);
      (storageService.setAccessToken as jest.Mock).mockRejectedValueOnce(
        new Error('Storage error')
      );

      await expect(
        authService.handleOAuthCallback('code-123', 'spotify')
      ).rejects.toThrow('Storage error');
    });
  });
});
