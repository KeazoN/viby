import { httpClient } from '@viby/shared/networking';
import { storageService } from '@viby/shared/storage';
import type {
  AuthTokens,
  AuthResponse,
  OAuthInitiateResponse,
  MusicProvider,
} from '../types';

/**
 * AuthService handles OAuth authentication flows for Spotify and Deezer,
 * manages JWT tokens, and provides authentication state helpers.
 * 
 */
export class AuthService {
  /**
   * Initiate OAuth flow for Spotify or Deezer
   * 
   * @param provider - The music provider ('spotify' or 'deezer')
   * @returns Promise with the OAuth authorization URL
   * 
   */
  async initiateOAuth(provider: MusicProvider): Promise<OAuthInitiateResponse> {
    try {
      if (provider === 'spotify') {
        // Get Spotify OAuth URL from backend
        const response = await httpClient.get<OAuthInitiateResponse>('/auth/spotify');
        return response;
      } else if (provider === 'deezer') {
        // For Deezer, construct the OAuth URL directly
        // The backend doesn't have a dedicated endpoint for Deezer initiation
        const deezerAppId = process.env.EXPO_PUBLIC_DEEZER_APP_ID;
        const redirectUri = process.env.EXPO_PUBLIC_DEEZER_REDIRECT_URI;
        const authUrl = `https://connect.deezer.com/oauth/auth.php?app_id=${deezerAppId}&redirect_uri=${encodeURIComponent(redirectUri || '')}&perms=basic_access,email,listening_history`;
        
        return { authUrl };
      } else {
        throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (error) {
      console.error(`Failed to initiate ${provider} OAuth:`, error);
      throw error;
    }
  }

  /**
   * Handle OAuth callback after user authorizes the app
   * 
   * @param code - The authorization code from OAuth callback
   * @param provider - The music provider ('spotify' or 'deezer')
   * @returns Promise with auth tokens and user data
   * 
   */
  async handleOAuthCallback(
    code: string,
    provider: MusicProvider
  ): Promise<AuthResponse> {
    try {
      let response: AuthResponse;

      if (provider === 'spotify') {
        // Exchange code for tokens via Spotify callback endpoint
        response = await httpClient.get<AuthResponse>(
          `/auth/spotify/callback?code=${encodeURIComponent(code)}`
        );
      } else if (provider === 'deezer') {
        // Exchange code for tokens via Deezer callback endpoint
        response = await httpClient.get<AuthResponse>(
          `/auth/deezer/callback?code=${encodeURIComponent(code)}`
        );
      } else {
        throw new Error(`Unsupported provider: ${provider}`);
      }

      // Store tokens securely
      await this.storeTokens(response);

      return response;
    } catch (error) {
      console.error(`Failed to handle ${provider} OAuth callback:`, error);
      throw error;
    }
  }

  /**
   * Refresh expired JWT tokens
   * 
   * @returns Promise with new auth tokens
   * @throws Error if refresh fails (caller should redirect to OAuth flow)
   * 
   */
  async refreshTokens(): Promise<AuthTokens> {
    try {
      // Get stored refresh token
      const refreshToken = await storageService.getRefreshToken();
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // Call backend refresh endpoint
      const response = await httpClient.post<AuthResponse>('/auth/refresh', {
        refreshToken,
      });

      // Store new tokens securely
      await this.storeTokens(response);

      return {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        expiresIn: response.expiresIn,
      };
    } catch (error) {
      console.error('Failed to refresh tokens:', error);
      
      // Clear invalid tokens
      await storageService.clearTokens();
      
      // Re-throw so caller can redirect to OAuth flow
      throw error;
    }
  }

  /**
   * Logout user and clear all stored tokens
   * 
   * @returns Promise that resolves when logout is complete
   * 
   */
  async logout(): Promise<void> {
    try {
      // Call backend logout endpoint (revokes session)
      await httpClient.post('/auth/logout');
    } catch (error) {
      // Log error but continue with local cleanup
      console.error('Failed to revoke session on backend:', error);
    } finally {
      // Always clear local tokens
      await storageService.clearTokens();
    }
  }

  /**
   * Get the current access token
   * 
   * @returns Promise with access token or null if not authenticated
   */
  async getAccessToken(): Promise<string | null> {
    return await storageService.getAccessToken();
  }

  /**
   * Check if user is authenticated
   * 
   * @returns Promise with boolean indicating authentication status
   */
  async isAuthenticated(): Promise<boolean> {
    const accessToken = await storageService.getAccessToken();
    return accessToken !== null;
  }

  /**
   * Store auth tokens securely
   * 
   * @param response - Auth response containing tokens
   * @private
   */
  private async storeTokens(response: AuthResponse): Promise<void> {
    await storageService.setAccessToken(response.accessToken);
    await storageService.setRefreshToken(response.refreshToken);
  }
}

// Export singleton instance
export const authService = new AuthService();
