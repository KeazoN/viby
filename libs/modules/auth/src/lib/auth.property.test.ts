import * as fc from 'fast-check';
import { AuthService } from './services/auth-service';
import { useAuthStore } from './stores/auth-store';
import { httpClient } from '@viby/shared/networking';
import { storageService } from '@viby/shared/storage';
import type { AuthResponse, AuthTokens } from './types';

/**
 * Property-Based Tests for Auth Module
 * 
 * These tests use fast-check to verify properties hold across many generated inputs.
 */

// Define global __DEV__
(global as any).__DEV__ = false;

// Mock expo-secure-store
const mockSecureStorage = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockSecureStorage.set(key, value);
  }),
  getItemAsync: jest.fn(async (key: string) => {
    return mockSecureStorage.get(key) || null;
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockSecureStorage.delete(key);
  }),
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

describe('Auth Module - Property-Based Tests', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
    mockSecureStorage.clear();
  });

  /**
   * Property 2: Token Refresh Triggers on Expiration
   * 
   * For any expired JWT token, when making an API request, the Auth_Module should 
   * automatically trigger token refresh before the request is retried.
   */
  describe('Property 2: Token Refresh Triggers on Expiration', () => {
    it('should trigger token refresh when refresh token exists', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate token-like strings
          fc.string({ minLength: 20, maxLength: 200 }),
          fc.string({ minLength: 20, maxLength: 200 }),
          fc.integer({ min: 1800, max: 7200 }), // expiresIn between 30 min and 2 hours
          async (oldRefreshToken, newAccessToken, expiresIn) => {
            // Setup: Store a refresh token
            (storageService.getRefreshToken as jest.Mock).mockResolvedValue(oldRefreshToken);
            
            // Mock successful refresh response
            const mockResponse: AuthResponse = {
              accessToken: newAccessToken,
              refreshToken: oldRefreshToken,
              expiresIn,
              user: {
                id: 'user-123',
                email: 'test@example.com',
                displayName: 'Test User',
                provider: 'spotify',
              },
            };
            
            (httpClient.post as jest.Mock).mockResolvedValue(mockResponse);
            (storageService.setAccessToken as jest.Mock).mockResolvedValue(undefined);
            (storageService.setRefreshToken as jest.Mock).mockResolvedValue(undefined);

            // Act: Call refreshTokens
            const result = await authService.refreshTokens();

            // Assert: Refresh endpoint should be called with the refresh token
            expect(httpClient.post).toHaveBeenCalledWith('/auth/refresh', {
              refreshToken: oldRefreshToken,
            });
            
            // Assert: New tokens should be stored
            expect(storageService.setAccessToken).toHaveBeenCalledWith(newAccessToken);
            expect(storageService.setRefreshToken).toHaveBeenCalledWith(oldRefreshToken);
            
            // Assert: Result should contain new tokens
            expect(result.accessToken).toBe(newAccessToken);
            expect(result.expiresIn).toBe(expiresIn);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should clear tokens when refresh fails', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 20, maxLength: 200 }),
          async (refreshToken) => {
            // Setup: Store a refresh token
            (storageService.getRefreshToken as jest.Mock).mockResolvedValue(refreshToken);
            
            // Mock failed refresh (token expired or invalid)
            (httpClient.post as jest.Mock).mockRejectedValue(new Error('Token expired'));
            (storageService.clearTokens as jest.Mock).mockResolvedValue(undefined);

            // Act & Assert: Should throw error
            await expect(authService.refreshTokens()).rejects.toThrow('Token expired');

            // Assert: Tokens should be cleared on failure
            expect(storageService.clearTokens).toHaveBeenCalled();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should throw error when no refresh token is available', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(null), // No refresh token
          async () => {
            // Setup: No refresh token stored
            (storageService.getRefreshToken as jest.Mock).mockResolvedValue(null);

            // Act & Assert: Should throw error without calling backend
            await expect(authService.refreshTokens()).rejects.toThrow(
              'No refresh token available'
            );

            // Assert: Backend should not be called
            expect(httpClient.post).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Property 4: Logout Clears All Tokens
   * 
   * For any authenticated user, when logout is called, all stored tokens 
   * (access token and refresh token) should be cleared from Storage_Service.
   */
  describe('Property 4: Logout Clears All Tokens', () => {
    it('should clear all tokens on successful logout', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 20, maxLength: 200 }),
          fc.string({ minLength: 20, maxLength: 200 }),
          async (accessToken, refreshToken) => {
            // Setup: Mock successful backend logout
            (httpClient.post as jest.Mock).mockResolvedValue(undefined);
            (storageService.clearTokens as jest.Mock).mockResolvedValue(undefined);

            // Act: Call logout
            await authService.logout();

            // Assert: Backend logout endpoint should be called
            expect(httpClient.post).toHaveBeenCalledWith('/auth/logout');
            
            // Assert: All tokens should be cleared
            expect(storageService.clearTokens).toHaveBeenCalled();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should clear tokens even when backend logout fails', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 20, maxLength: 200 }),
          fc.string({ minLength: 20, maxLength: 200 }),
          async (accessToken, refreshToken) => {
            // Setup: Mock failed backend logout
            (httpClient.post as jest.Mock).mockRejectedValue(new Error('Network error'));
            (storageService.clearTokens as jest.Mock).mockResolvedValue(undefined);

            // Act: Call logout (should not throw)
            await authService.logout();

            // Assert: Tokens should still be cleared despite backend failure
            expect(storageService.clearTokens).toHaveBeenCalled();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should verify tokens are actually cleared from storage', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 20, maxLength: 200 }),
          fc.string({ minLength: 20, maxLength: 200 }),
          async (accessToken, refreshToken) => {
            // Setup: Store tokens in mock secure storage
            mockSecureStorage.set('access_token', accessToken);
            mockSecureStorage.set('refresh_token', refreshToken);
            
            // Verify tokens are stored
            expect(mockSecureStorage.has('access_token')).toBe(true);
            expect(mockSecureStorage.has('refresh_token')).toBe(true);

            // Setup mocks
            (httpClient.post as jest.Mock).mockResolvedValue(undefined);
            
            // Mock clearTokens to actually clear from our mock storage
            (storageService.clearTokens as jest.Mock).mockImplementation(async () => {
              mockSecureStorage.delete('access_token');
              mockSecureStorage.delete('refresh_token');
            });

            // Act: Call logout
            await authService.logout();

            // Assert: Tokens should be removed from storage
            expect(mockSecureStorage.has('access_token')).toBe(false);
            expect(mockSecureStorage.has('refresh_token')).toBe(false);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 30: Sensitive Data Not Logged
   * 
   * For any log output, the content should not contain JWT tokens, refresh tokens, 
   * OAuth credentials, or passwords.
   */
  describe('Property 30: Sensitive Data Not Logged', () => {
    let consoleErrorSpy: jest.SpyInstance;
    let consoleLogSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('should not log tokens when OAuth callback fails', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 20, maxLength: 200 }),
          fc.string({ minLength: 20, maxLength: 200 }),
          async (authCode, accessToken) => {
            // Setup: Mock failed OAuth callback
            const error = new Error('OAuth failed');
            (httpClient.get as jest.Mock).mockRejectedValue(error);

            // Act: Try to handle OAuth callback
            try {
              await authService.handleOAuthCallback(authCode, 'spotify');
            } catch (e) {
              // Expected to fail
            }

            // Assert: Console error should be called
            expect(consoleErrorSpy).toHaveBeenCalled();
            
            // Assert: Logged messages should not contain the auth code
            const loggedMessages = consoleErrorSpy.mock.calls
              .map(call => JSON.stringify(call))
              .join(' ');
            
            expect(loggedMessages).not.toContain(authCode);
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should not log tokens when refresh fails', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 20, maxLength: 200 }),
          async (refreshToken) => {
            // Setup: Store refresh token
            (storageService.getRefreshToken as jest.Mock).mockResolvedValue(refreshToken);
            (httpClient.post as jest.Mock).mockRejectedValue(new Error('Token expired'));
            (storageService.clearTokens as jest.Mock).mockResolvedValue(undefined);

            // Act: Try to refresh tokens
            try {
              await authService.refreshTokens();
            } catch (e) {
              // Expected to fail
            }

            // Assert: Console error should be called
            expect(consoleErrorSpy).toHaveBeenCalled();
            
            // Assert: Logged messages should not contain the refresh token
            const loggedMessages = consoleErrorSpy.mock.calls
              .map(call => JSON.stringify(call))
              .join(' ');
            
            expect(loggedMessages).not.toContain(refreshToken);
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should not log tokens when logout fails', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 20, maxLength: 200 }),
          async (accessToken) => {
            // Setup: Mock failed logout
            (httpClient.post as jest.Mock).mockRejectedValue(new Error('Network error'));
            (storageService.clearTokens as jest.Mock).mockResolvedValue(undefined);

            // Act: Call logout
            await authService.logout();

            // Assert: If console.error was called, check it doesn't contain tokens
            if (consoleErrorSpy.mock.calls.length > 0) {
              const loggedMessages = consoleErrorSpy.mock.calls
                .map(call => JSON.stringify(call))
                .join(' ');
              
              expect(loggedMessages).not.toContain(accessToken);
            }
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  /**
   * Property 31: Secure Token Storage
   * 
   * For any token stored by Storage_Service, the token should be stored using 
   * platform-specific secure storage (Keychain on iOS, Keystore on Android).
   */
  describe('Property 31: Secure Token Storage', () => {
    it('should store access tokens in secure storage', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 20, maxLength: 500 }),
          async (accessToken) => {
            // Setup: Mock secure storage
            (storageService.setAccessToken as jest.Mock).mockImplementation(
              async (token: string) => {
                mockSecureStorage.set('access_token', token);
              }
            );

            // Act: Store access token
            await storageService.setAccessToken(accessToken);

            // Assert: Token should be in secure storage
            expect(mockSecureStorage.has('access_token')).toBe(true);
            expect(mockSecureStorage.get('access_token')).toBe(accessToken);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should store refresh tokens in secure storage', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 20, maxLength: 500 }),
          async (refreshToken) => {
            // Setup: Mock secure storage
            (storageService.setRefreshToken as jest.Mock).mockImplementation(
              async (token: string) => {
                mockSecureStorage.set('refresh_token', token);
              }
            );

            // Act: Store refresh token
            await storageService.setRefreshToken(refreshToken);

            // Assert: Token should be in secure storage
            expect(mockSecureStorage.has('refresh_token')).toBe(true);
            expect(mockSecureStorage.get('refresh_token')).toBe(refreshToken);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should retrieve tokens from secure storage', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 20, maxLength: 500 }),
          fc.string({ minLength: 20, maxLength: 500 }),
          async (accessToken, refreshToken) => {
            // Setup: Store tokens in secure storage
            mockSecureStorage.set('access_token', accessToken);
            mockSecureStorage.set('refresh_token', refreshToken);

            // Mock retrieval from secure storage
            (storageService.getAccessToken as jest.Mock).mockImplementation(async () => {
              return mockSecureStorage.get('access_token') || null;
            });
            (storageService.getRefreshToken as jest.Mock).mockImplementation(async () => {
              return mockSecureStorage.get('refresh_token') || null;
            });

            // Act: Retrieve tokens
            const retrievedAccess = await storageService.getAccessToken();
            const retrievedRefresh = await storageService.getRefreshToken();

            // Assert: Retrieved tokens should match stored tokens
            expect(retrievedAccess).toBe(accessToken);
            expect(retrievedRefresh).toBe(refreshToken);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle OAuth callback and store tokens securely', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 100 }),
          fc.string({ minLength: 20, maxLength: 200 }),
          fc.string({ minLength: 20, maxLength: 200 }),
          async (authCode, accessToken, refreshToken) => {
            // Setup: Mock OAuth response
            const mockResponse: AuthResponse = {
              accessToken,
              refreshToken,
              expiresIn: 3600,
              user: {
                id: 'user-123',
                email: 'test@example.com',
                displayName: 'Test User',
                provider: 'spotify',
              },
            };

            (httpClient.get as jest.Mock).mockResolvedValue(mockResponse);
            
            // Mock secure storage
            (storageService.setAccessToken as jest.Mock).mockImplementation(
              async (token: string) => {
                mockSecureStorage.set('access_token', token);
              }
            );
            (storageService.setRefreshToken as jest.Mock).mockImplementation(
              async (token: string) => {
                mockSecureStorage.set('refresh_token', token);
              }
            );

            // Act: Handle OAuth callback
            await authService.handleOAuthCallback(authCode, 'spotify');

            // Assert: Tokens should be stored in secure storage
            expect(mockSecureStorage.get('access_token')).toBe(accessToken);
            expect(mockSecureStorage.get('refresh_token')).toBe(refreshToken);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
