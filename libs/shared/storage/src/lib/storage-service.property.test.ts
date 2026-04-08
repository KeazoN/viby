import * as fc from 'fast-check';
import { StorageService } from './storage-service';

/**
 * Property-Based Tests for StorageService
 * 
 * These tests use fast-check to verify properties hold across many generated inputs.
 */

// Mock MMKV - same approach as the unit test
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

// Mock SecureStore - same approach as the unit test
jest.mock('./secure-storage', () => {
  const mockSecureStorage = new Map<string, string>();
  
  return {
    secureStorage: {
      setItem: jest.fn(async (key: string, value: string) => {
        mockSecureStorage.set(key, value);
      }),
      getItem: jest.fn(async (key: string) => {
        return mockSecureStorage.get(key) || null;
      }),
      deleteItem: jest.fn(async (key: string) => {
        mockSecureStorage.delete(key);
      }),
      hasItem: jest.fn(async (key: string) => {
        return mockSecureStorage.has(key);
      }),
    },
  };
});

describe('StorageService - Property-Based Tests', () => {
  let storageService: StorageService;

  beforeEach(() => {
    storageService = new StorageService();
    jest.clearAllMocks();
  });

  /**
   * Property 1: Token Storage Round Trip
   * 
   * For any valid JWT access token and refresh token, storing them in Storage_Service 
   * and then retrieving them should return the exact same token values.
   */
  describe('Property 1: Token Storage Round Trip', () => {
    it('should preserve access token through storage round trip', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate JWT-like tokens (simplified format for testing)
          fc.string({ minLength: 10, maxLength: 500 }),
          async (token) => {
            // Store the token
            await storageService.setAccessToken(token);
            
            // Retrieve the token
            const retrieved = await storageService.getAccessToken();
            
            // The retrieved token should be exactly the same
            expect(retrieved).toBe(token);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve refresh token through storage round trip', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 500 }),
          async (token) => {
            // Store the token
            await storageService.setRefreshToken(token);
            
            // Retrieve the token
            const retrieved = await storageService.getRefreshToken();
            
            // The retrieved token should be exactly the same
            expect(retrieved).toBe(token);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve both tokens independently through storage round trip', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.string({ minLength: 10, maxLength: 500 }),
          async (accessToken, refreshToken) => {
            // Store both tokens
            await storageService.setAccessToken(accessToken);
            await storageService.setRefreshToken(refreshToken);
            
            // Retrieve both tokens
            const retrievedAccess = await storageService.getAccessToken();
            const retrievedRefresh = await storageService.getRefreshToken();
            
            // Both tokens should be exactly the same as stored
            expect(retrievedAccess).toBe(accessToken);
            expect(retrievedRefresh).toBe(refreshToken);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle special characters in tokens', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate tokens with special characters that might appear in JWT
          fc.stringMatching(/^[A-Za-z0-9._-]{10,500}$/),
          async (token) => {
            await storageService.setAccessToken(token);
            const retrieved = await storageService.getAccessToken();
            expect(retrieved).toBe(token);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle token updates correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.string({ minLength: 10, maxLength: 500 }),
          async (token1, token2) => {
            // Store first token
            await storageService.setAccessToken(token1);
            const retrieved1 = await storageService.getAccessToken();
            expect(retrieved1).toBe(token1);
            
            // Update with second token
            await storageService.setAccessToken(token2);
            const retrieved2 = await storageService.getAccessToken();
            
            // Should retrieve the updated token, not the old one
            expect(retrieved2).toBe(token2);
            expect(retrieved2).not.toBe(token1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
