import { AuthService } from './auth-service';
import { httpClient } from '@viby/shared/networking';
import { storageService } from '@viby/shared/storage';
import type { AuthResponse, OAuthInitiateResponse } from '../types';

// Define global __DEV__
(global as any).__DEV__ = false;

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock MMKV
jest.mock('react-native-mmkv', () => {
  const mockStorage = new Map<string, any>();
  
  return {
    MMKV: jest.fn().mockImplementation(() => ({
      set: jest.fn((key: string, value: any) => {
        mockStorage.set(key, value);
      }),
      getString: jest.fn((key: string) => {
        const value = mockStorage.get(key);
        return typeof value === 'string' ? value : undefined;
      }),
      getNumber: jest.fn((key: string) => {
        const value = mockStorage.get(key);
        return typeof value === 'number' ? value : undefined;
      }),
      getBoolean: jest.fn((key: string) => {
        const value = mockStorage.get(key);
        return typeof value === 'boolean' ? value : undefined;
      }),
      delete: jest.fn((key: string) => {
        mockStorage.delete(key);
      }),
      contains: jest.fn((key: string) => {
        return mockStorage.has(key);
      }),
      getAllKeys: jest.fn(() => {
        return Array.from(mockStorage.keys());
      }),
      clearAll: jest.fn(() => {
        mockStorage.clear();
      }),
    })),
  };
});

// Mock dependencies
jest.mock('@viby/shared/networking');
jest.mock('@viby/shared/storage');

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('initiateOAuth', () => {
    it('should return Spotify OAuth URL from backend', async () => {
      const mockResponse: OAuthInitiateResponse = {
        authUrl: 'https://accounts.spotify.com/authorize?client_id=test',
      };

      (httpClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authService.initiateOAuth('spotify');

      expect(httpClient.get).toHaveBeenCalledWith('/auth/spotify');
      expect(result).toEqual(mockResponse);
    });

    it('should construct Deezer OAuth URL directly', async () => {
      process.env.EXPO_PUBLIC_DEEZER_APP_ID = 'test-app-id';
      process.env.EXPO_PUBLIC_DEEZER_REDIRECT_URI = 'http://localhost:3000/auth/deezer/callback';

      const result = await authService.initiateOAuth('deezer');

      expect(result.authUrl).toContain('connect.deezer.com/oauth/auth.php');
      expect(result.authUrl).toContain('app_id=test-app-id');
      expect(httpClient.get).not.toHaveBeenCalled();
    });

    it('should throw error for unsupported provider', async () => {
      await expect(
        authService.initiateOAuth('unsupported' as any)
      ).rejects.toThrow('Unsupported provider: unsupported');
    });

    it('should handle backend errors', async () => {
      const error = new Error('Network error');
      (httpClient.get as jest.Mock).mockRejectedValue(error);

      await expect(authService.initiateOAuth('spotify')).rejects.toThrow('Network error');
    });
  });

  describe('handleOAuthCallback', () => {
    const mockAuthResponse: AuthResponse = {
      accessToken: 'access-token-123',
      refreshToken: 'refresh-token-456',
      expiresIn: 3600,
      user: {
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        provider: 'spotify',
      },
    };

    it('should handle Spotify OAuth callback', async () => {
      (httpClient.get as jest.Mock).mockResolvedValue(mockAuthResponse);
      (storageService.setAccessToken as jest.Mock).mockResolvedValue(undefined);
      (storageService.setRefreshToken as jest.Mock).mockResolvedValue(undefined);

      const result = await authService.handleOAuthCallback('auth-code-123', 'spotify');

      expect(httpClient.get).toHaveBeenCalledWith(
        '/auth/spotify/callback?code=auth-code-123'
      );
      expect(storageService.setAccessToken).toHaveBeenCalledWith('access-token-123');
      expect(storageService.setRefreshToken).toHaveBeenCalledWith('refresh-token-456');
      expect(result).toEqual(mockAuthResponse);
    });

    it('should handle Deezer OAuth callback', async () => {
      const deezerResponse = { ...mockAuthResponse, user: { ...mockAuthResponse.user, provider: 'deezer' as const } };
      (httpClient.get as jest.Mock).mockResolvedValue(deezerResponse);
      (storageService.setAccessToken as jest.Mock).mockResolvedValue(undefined);
      (storageService.setRefreshToken as jest.Mock).mockResolvedValue(undefined);

      const result = await authService.handleOAuthCallback('auth-code-456', 'deezer');

      expect(httpClient.get).toHaveBeenCalledWith(
        '/auth/deezer/callback?code=auth-code-456'
      );
      expect(storageService.setAccessToken).toHaveBeenCalledWith('access-token-123');
      expect(storageService.setRefreshToken).toHaveBeenCalledWith('refresh-token-456');
      expect(result).toEqual(deezerResponse);
    });

    it('should throw error for unsupported provider', async () => {
      await expect(
        authService.handleOAuthCallback('code', 'unsupported' as any)
      ).rejects.toThrow('Unsupported provider: unsupported');
    });

    it('should handle backend errors', async () => {
      const error = new Error('Invalid authorization code');
      (httpClient.get as jest.Mock).mockRejectedValue(error);

      await expect(
        authService.handleOAuthCallback('invalid-code', 'spotify')
      ).rejects.toThrow('Invalid authorization code');
    });

    it('should URL encode the authorization code', async () => {
      (httpClient.get as jest.Mock).mockResolvedValue(mockAuthResponse);
      (storageService.setAccessToken as jest.Mock).mockResolvedValue(undefined);
      (storageService.setRefreshToken as jest.Mock).mockResolvedValue(undefined);

      await authService.handleOAuthCallback('code with spaces', 'spotify');

      expect(httpClient.get).toHaveBeenCalledWith(
        '/auth/spotify/callback?code=code%20with%20spaces'
      );
    });
  });

  describe('refreshTokens', () => {
    const mockAuthResponse: AuthResponse = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      expiresIn: 3600,
      user: {
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        provider: 'spotify',
      },
    };

    it('should refresh tokens successfully', async () => {
      (storageService.getRefreshToken as jest.Mock).mockResolvedValue('old-refresh-token');
      (httpClient.post as jest.Mock).mockResolvedValue(mockAuthResponse);
      (storageService.setAccessToken as jest.Mock).mockResolvedValue(undefined);
      (storageService.setRefreshToken as jest.Mock).mockResolvedValue(undefined);

      const result = await authService.refreshTokens();

      expect(storageService.getRefreshToken).toHaveBeenCalled();
      expect(httpClient.post).toHaveBeenCalledWith('/auth/refresh', {
        refreshToken: 'old-refresh-token',
      });
      expect(storageService.setAccessToken).toHaveBeenCalledWith('new-access-token');
      expect(storageService.setRefreshToken).toHaveBeenCalledWith('new-refresh-token');
      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
      });
    });

    it('should throw error if no refresh token available', async () => {
      (storageService.getRefreshToken as jest.Mock).mockResolvedValue(null);

      await expect(authService.refreshTokens()).rejects.toThrow(
        'No refresh token available'
      );

      expect(httpClient.post).not.toHaveBeenCalled();
    });

    it('should clear tokens on refresh failure', async () => {
      (storageService.getRefreshToken as jest.Mock).mockResolvedValue('old-refresh-token');
      (httpClient.post as jest.Mock).mockRejectedValue(new Error('Token expired'));
      (storageService.clearTokens as jest.Mock).mockResolvedValue(undefined);

      await expect(authService.refreshTokens()).rejects.toThrow('Token expired');

      expect(storageService.clearTokens).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should call backend logout and clear tokens', async () => {
      (httpClient.post as jest.Mock).mockResolvedValue(undefined);
      (storageService.clearTokens as jest.Mock).mockResolvedValue(undefined);

      await authService.logout();

      expect(httpClient.post).toHaveBeenCalledWith('/auth/logout');
      expect(storageService.clearTokens).toHaveBeenCalled();
    });

    it('should clear tokens even if backend call fails', async () => {
      (httpClient.post as jest.Mock).mockRejectedValue(new Error('Network error'));
      (storageService.clearTokens as jest.Mock).mockResolvedValue(undefined);

      await authService.logout();

      expect(storageService.clearTokens).toHaveBeenCalled();
    });
  });

  describe('getAccessToken', () => {
    it('should return access token from storage', async () => {
      (storageService.getAccessToken as jest.Mock).mockResolvedValue('access-token-123');

      const result = await authService.getAccessToken();

      expect(storageService.getAccessToken).toHaveBeenCalled();
      expect(result).toBe('access-token-123');
    });

    it('should return null if no token stored', async () => {
      (storageService.getAccessToken as jest.Mock).mockResolvedValue(null);

      const result = await authService.getAccessToken();

      expect(result).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true if access token exists', async () => {
      (storageService.getAccessToken as jest.Mock).mockResolvedValue('access-token-123');

      const result = await authService.isAuthenticated();

      expect(result).toBe(true);
    });

    it('should return false if no access token', async () => {
      (storageService.getAccessToken as jest.Mock).mockResolvedValue(null);

      const result = await authService.isAuthenticated();

      expect(result).toBe(false);
    });
  });
});
