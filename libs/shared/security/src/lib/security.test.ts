import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Security Tests
 * 
 * Validates Requirements:
 * - 17.1: Token encryption in storage
 * - 17.4: Sensitive data clearing on background
 * - 17.7: Rate limiting for user actions
 * 
 * Task: 31.4 Write security tests
 */

// Create mock storage that persists across tests
const mockMMKVStorage = new Map<string, any>();
const mockSecureStorage = new Map<string, string>();

// Mock MMKV
vi.mock('react-native-mmkv', () => {
  return {
    MMKV: class {
      set(key: string, value: any) {
        mockMMKVStorage.set(key, value);
      }
      getString(key: string) {
        const value = mockMMKVStorage.get(key);
        return typeof value === 'string' ? value : undefined;
      }
      getNumber(key: string) {
        const value = mockMMKVStorage.get(key);
        return typeof value === 'number' ? value : undefined;
      }
      getBoolean(key: string) {
        const value = mockMMKVStorage.get(key);
        return typeof value === 'boolean' ? value : undefined;
      }
      delete(key: string) {
        mockMMKVStorage.delete(key);
      }
      contains(key: string) {
        return mockMMKVStorage.has(key);
      }
      getAllKeys() {
        return Array.from(mockMMKVStorage.keys());
      }
      clearAll() {
        mockMMKVStorage.clear();
      }
    },
  };
});

// Mock SecureStore
vi.mock('expo-secure-store', () => ({
  setItemAsync: vi.fn(async (key: string, value: string) => {
    mockSecureStorage.set(key, value);
  }),
  getItemAsync: vi.fn(async (key: string) => {
    return mockSecureStorage.get(key) || null;
  }),
  deleteItemAsync: vi.fn(async (key: string) => {
    mockSecureStorage.delete(key);
  }),
}));

// Mock realtime module
vi.mock('../../../realtime/src/lib/socket-manager', () => ({
  socketManager: {
    getConnectionStatus: vi.fn(() => 'connected'),
    connect: vi.fn(),
    disconnect: vi.fn(),
    getEventBus: vi.fn(() => ({
      emit: vi.fn(),
    })),
  },
}));

// Mock @viby/modules/realtime (for app-state-manager import)
vi.mock('@viby/modules/realtime', () => ({
  socketManager: {
    getConnectionStatus: vi.fn(() => 'connected'),
    connect: vi.fn(),
    disconnect: vi.fn(),
    getEventBus: vi.fn(() => ({
      emit: vi.fn(),
    })),
  },
}));

// Mock @viby/shared/storage (for app-state-manager import)
vi.mock('@viby/shared/storage', () => ({
  storageService: {
    getAccessToken: vi.fn(async () => 'mock_token'),
    setAccessToken: vi.fn(),
    getRefreshToken: vi.fn(),
    setRefreshToken: vi.fn(),
    clearTokens: vi.fn(),
  },
}));

// Mock game store
vi.mock('../../../../modules/game/src/lib/stores/game-store', () => ({
  useGameStore: {
    getState: vi.fn(() => ({
      activeGame: null,
    })),
  },
}));

// Mock @viby/modules/game (for app-state-manager import)
vi.mock('@viby/modules/game', () => ({
  useGameStore: {
    getState: vi.fn(() => ({
      activeGame: null,
    })),
  },
}));

// Mock React Native AppState
vi.mock('react-native', () => ({
  AppState: {
    currentState: 'active',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
}));

// Import after mocks
import { StorageService } from '../../../storage/src/lib/storage-service';
import { AppStateManager } from '../../../lifecycle/src/lib/app-state-manager';
import { RateLimiter } from '../../../utils/src/lib/rate-limiter';
import { AppState } from 'react-native';
import * as SecureStore from 'expo-secure-store';

describe('Security Tests', () => {
  describe('Token Encryption in Storage (Requirement 17.1)', () => {
    let storageService: StorageService;

    beforeEach(() => {
      mockMMKVStorage.clear();
      mockSecureStorage.clear();
      storageService = new StorageService();
      vi.clearAllMocks();
    });

    it('should store access tokens in secure storage, not plain storage', async () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';
      
      await storageService.setAccessToken(token);
      
      // Verify token is stored in secure storage
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('access_token', token);
      
      // Verify token is NOT stored in plain MMKV storage
      expect(storageService.get('access_token')).toBeUndefined();
    });

    it('should store refresh tokens in secure storage, not plain storage', async () => {
      const token = 'refresh_token_abc123';
      
      await storageService.setRefreshToken(token);
      
      // Verify token is stored in secure storage
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('refresh_token', token);
      
      // Verify token is NOT stored in plain MMKV storage
      expect(storageService.get('refresh_token')).toBeUndefined();
    });

    it('should retrieve access tokens from secure storage', async () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';
      
      await storageService.setAccessToken(token);
      const retrieved = await storageService.getAccessToken();
      
      expect(retrieved).toBe(token);
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('access_token');
    });

    it('should retrieve refresh tokens from secure storage', async () => {
      const token = 'refresh_token_abc123';
      
      await storageService.setRefreshToken(token);
      const retrieved = await storageService.getRefreshToken();
      
      expect(retrieved).toBe(token);
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('refresh_token');
    });

    it('should use platform-specific secure storage (Keychain/Keystore)', async () => {
      // This test verifies that SecureStore is being used
      // In production, this uses Expo SecureStore which uses:
      // - iOS: Keychain Services
      // - Android: EncryptedSharedPreferences backed by Android Keystore
      
      const accessToken = 'access_token_123';
      const refreshToken = 'refresh_token_456';
      
      await storageService.setAccessToken(accessToken);
      await storageService.setRefreshToken(refreshToken);
      
      // Verify both tokens are stored securely
      expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(2);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('access_token', accessToken);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('refresh_token', refreshToken);
    });

    it('should clear tokens from secure storage on logout', async () => {
      await storageService.setAccessToken('access');
      await storageService.setRefreshToken('refresh');
      
      await storageService.clearTokens();
      
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('access_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('refresh_token');
    });

    it('should not expose tokens in plain text in memory', async () => {
      const token = 'sensitive_token_123';
      
      await storageService.setAccessToken(token);
      
      // Verify token is not accessible through plain storage methods
      const allKeys = storageService.getAllKeys();
      expect(allKeys).not.toContain('access_token');
      expect(allKeys).not.toContain('refresh_token');
    });

    it('should handle token storage failures gracefully', async () => {
      // Mock a storage failure
      vi.mocked(SecureStore.setItemAsync).mockRejectedValueOnce(new Error('Storage full'));
      
      await expect(storageService.setAccessToken('token')).rejects.toThrow('Storage full');
    });

    it('should return null for non-existent tokens', async () => {
      const token = await storageService.getAccessToken();
      expect(token).toBeNull();
    });
  });

  describe('Sensitive Data Clearing on Background (Requirement 17.4)', () => {
    let appStateManager: AppStateManager;
    let mockAppStateListener: ((state: string) => void) | null = null;

    beforeEach(() => {
      appStateManager = new AppStateManager();
      vi.clearAllMocks();
      
      // Capture the AppState listener
      vi.mocked(AppState.addEventListener).mockImplementation((event, listener) => {
        if (event === 'change') {
          mockAppStateListener = listener as (state: string) => void;
        }
        return { remove: vi.fn() };
      });
      
      appStateManager.initialize();
    });

    afterEach(() => {
      appStateManager.cleanup();
      mockAppStateListener = null;
    });

    it('should clear sensitive data when app enters background', async () => {
      // Spy on console.log to verify clearSensitiveData is called
      const consoleSpy = vi.spyOn(console, 'log');
      
      // Simulate app going to background
      if (mockAppStateListener) {
        await mockAppStateListener('background');
      }
      
      // Verify sensitive data clearing was triggered
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cleared sensitive data from memory')
      );
      
      consoleSpy.mockRestore();
    });

    it('should not clear tokens from secure storage on background', async () => {
      const storageService = new StorageService();
      await storageService.setAccessToken('token');
      
      // Simulate app going to background
      if (mockAppStateListener) {
        await mockAppStateListener('background');
      }
      
      // Token should still be in secure storage
      const token = await storageService.getAccessToken();
      expect(token).toBe('token');
      
      // Verify deleteItem was not called
      expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
    });

    it('should handle background transition without active game', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      
      // Simulate app going to background
      if (mockAppStateListener) {
        await mockAppStateListener('background');
      }
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('No active game, disconnecting WebSocket')
      );
      
      consoleSpy.mockRestore();
    });

    it('should clear sensitive data before disconnecting WebSocket', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      const logCalls: string[] = [];
      
      consoleSpy.mockImplementation((message: string) => {
        logCalls.push(message);
      });
      
      // Simulate app going to background
      if (mockAppStateListener) {
        await mockAppStateListener('background');
      }
      
      // Find the indices of relevant log messages
      const clearDataIndex = logCalls.findIndex(msg => 
        msg.includes('Cleared sensitive data from memory')
      );
      const disconnectIndex = logCalls.findIndex(msg => 
        msg.includes('disconnecting WebSocket')
      );
      
      // Verify clearing happens before disconnect
      expect(clearDataIndex).toBeGreaterThanOrEqual(0);
      expect(disconnectIndex).toBeGreaterThanOrEqual(0);
      expect(clearDataIndex).toBeLessThan(disconnectIndex);
      
      consoleSpy.mockRestore();
    });

    it('should handle rapid foreground/background transitions', async () => {
      // Simulate rapid transitions
      if (mockAppStateListener) {
        await mockAppStateListener('background');
        await mockAppStateListener('active');
        await mockAppStateListener('background');
        await mockAppStateListener('active');
      }
      
      // Should not throw errors
      expect(appStateManager.getCurrentState()).toBe('active');
    });
  });

  describe('Rate Limiting for User Actions (Requirement 17.7)', () => {
    let rateLimiter: RateLimiter;

    beforeEach(() => {
      vi.useFakeTimers();
      rateLimiter = new RateLimiter();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should limit match requests to prevent abuse', () => {
      const userId = 'user123';
      const key = `match:${userId}`;
      const maxRequests = 5;
      const windowMs = 60000; // 1 minute

      // Should allow first 5 match requests
      for (let i = 0; i < maxRequests; i++) {
        expect(rateLimiter.isAllowed(key, maxRequests, windowMs)).toBe(true);
      }

      // 6th request should be blocked
      expect(rateLimiter.isAllowed(key, maxRequests, windowMs)).toBe(false);
    });

    it('should limit game actions to prevent spam', () => {
      const roomId = 'room123';
      const key = `game:${roomId}`;
      const maxRequests = 10;
      const windowMs = 10000; // 10 seconds

      // Allow 10 game actions
      for (let i = 0; i < maxRequests; i++) {
        expect(rateLimiter.isAllowed(key, maxRequests, windowMs)).toBe(true);
      }

      // Block additional actions
      expect(rateLimiter.isAllowed(key, maxRequests, windowMs)).toBe(false);
    });

    it('should limit message sending to prevent spam', () => {
      const roomId = 'room123';
      const key = `message:${roomId}`;
      const maxRequests = 20;
      const windowMs = 60000; // 1 minute

      // Allow 20 messages per minute
      for (let i = 0; i < maxRequests; i++) {
        expect(rateLimiter.isAllowed(key, maxRequests, windowMs)).toBe(true);
      }

      // Block additional messages
      expect(rateLimiter.isAllowed(key, maxRequests, windowMs)).toBe(false);
    });

    it('should reset rate limits after time window expires', () => {
      const key = 'match:user123';
      const maxRequests = 3;
      const windowMs = 60000;

      // Use up the limit
      for (let i = 0; i < maxRequests; i++) {
        rateLimiter.isAllowed(key, maxRequests, windowMs);
      }
      expect(rateLimiter.isAllowed(key, maxRequests, windowMs)).toBe(false);

      // Advance time past window
      vi.advanceTimersByTime(60001);

      // Should allow new requests
      expect(rateLimiter.isAllowed(key, maxRequests, windowMs)).toBe(true);
    });

    it('should use sliding window for accurate rate limiting', () => {
      const key = 'match:user123';
      const maxRequests = 3;
      const windowMs = 1000;

      // Make 3 requests at t=0
      rateLimiter.isAllowed(key, maxRequests, windowMs);
      rateLimiter.isAllowed(key, maxRequests, windowMs);
      rateLimiter.isAllowed(key, maxRequests, windowMs);

      // Blocked at t=0
      expect(rateLimiter.isAllowed(key, maxRequests, windowMs)).toBe(false);

      // Advance time by 500ms (requests still in window)
      vi.advanceTimersByTime(500);
      expect(rateLimiter.isAllowed(key, maxRequests, windowMs)).toBe(false);

      // Advance time by another 501ms (first request expired)
      vi.advanceTimersByTime(501);
      expect(rateLimiter.isAllowed(key, maxRequests, windowMs)).toBe(true);
    });

    it('should handle different users independently', () => {
      const maxRequests = 3;
      const windowMs = 60000;

      // User 1 uses up their limit
      for (let i = 0; i < maxRequests; i++) {
        rateLimiter.isAllowed('match:user1', maxRequests, windowMs);
      }
      expect(rateLimiter.isAllowed('match:user1', maxRequests, windowMs)).toBe(false);

      // User 2 should still be allowed
      expect(rateLimiter.isAllowed('match:user2', maxRequests, windowMs)).toBe(true);
    });

    it('should provide time until next request is allowed', () => {
      const key = 'match:user123';
      const maxRequests = 2;
      const windowMs = 1000;

      // Use up the limit
      rateLimiter.isAllowed(key, maxRequests, windowMs);
      rateLimiter.isAllowed(key, maxRequests, windowMs);

      // Should return time until allowed
      const timeUntilAllowed = rateLimiter.getTimeUntilAllowed(key, maxRequests, windowMs);
      expect(timeUntilAllowed).toBeGreaterThan(0);
      expect(timeUntilAllowed).toBeLessThanOrEqual(windowMs);
    });

    it('should track request count accurately', () => {
      const key = 'match:user123';
      const windowMs = 60000;

      expect(rateLimiter.getRequestCount(key, windowMs)).toBe(0);

      rateLimiter.isAllowed(key, 10, windowMs);
      expect(rateLimiter.getRequestCount(key, windowMs)).toBe(1);

      rateLimiter.isAllowed(key, 10, windowMs);
      expect(rateLimiter.getRequestCount(key, windowMs)).toBe(2);

      rateLimiter.isAllowed(key, 10, windowMs);
      expect(rateLimiter.getRequestCount(key, windowMs)).toBe(3);
    });

    it('should allow manual reset of rate limits', () => {
      const key = 'match:user123';
      const maxRequests = 2;
      const windowMs = 60000;

      // Use up the limit
      rateLimiter.isAllowed(key, maxRequests, windowMs);
      rateLimiter.isAllowed(key, maxRequests, windowMs);
      expect(rateLimiter.isAllowed(key, maxRequests, windowMs)).toBe(false);

      // Reset
      rateLimiter.reset(key);

      // Should allow requests again
      expect(rateLimiter.isAllowed(key, maxRequests, windowMs)).toBe(true);
    });

    it('should prevent rapid-fire match requests', () => {
      const key = 'match:user123';
      const maxRequests = 5;
      const windowMs = 60000;

      // Simulate rapid clicking
      const results = [];
      for (let i = 0; i < 10; i++) {
        results.push(rateLimiter.isAllowed(key, maxRequests, windowMs));
      }

      // First 5 should succeed, rest should fail
      expect(results.slice(0, 5)).toEqual([true, true, true, true, true]);
      expect(results.slice(5)).toEqual([false, false, false, false, false]);
    });

    it('should handle concurrent actions across different features', () => {
      const userId = 'user123';
      const maxRequests = 5;
      const windowMs = 60000;

      // Match requests
      for (let i = 0; i < maxRequests; i++) {
        rateLimiter.isAllowed(`match:${userId}`, maxRequests, windowMs);
      }

      // Message sending (different key, should not be affected)
      expect(rateLimiter.isAllowed(`message:room123`, maxRequests, windowMs)).toBe(true);

      // Game actions (different key, should not be affected)
      expect(rateLimiter.isAllowed(`game:room456`, maxRequests, windowMs)).toBe(true);
    });
  });

  describe('Integration: Security Features Working Together', () => {
    let storageService: StorageService;
    let appStateManager: AppStateManager;
    let rateLimiter: RateLimiter;
    let mockAppStateListener: ((state: string) => void) | null = null;

    beforeEach(() => {
      vi.useFakeTimers();
      mockMMKVStorage.clear();
      mockSecureStorage.clear();
      storageService = new StorageService();
      appStateManager = new AppStateManager();
      rateLimiter = new RateLimiter();
      
      vi.mocked(AppState.addEventListener).mockImplementation((event, listener) => {
        if (event === 'change') {
          mockAppStateListener = listener as (state: string) => void;
        }
        return { remove: vi.fn() };
      });
      
      appStateManager.initialize();
      vi.clearAllMocks();
    });

    afterEach(() => {
      appStateManager.cleanup();
      vi.restoreAllMocks();
    });

    it('should maintain token encryption even after background transitions', async () => {
      // Store token
      await storageService.setAccessToken('secure_token_123');
      
      // Simulate background transition
      if (mockAppStateListener) {
        await mockAppStateListener('background');
      }
      
      // Token should still be encrypted in secure storage
      const token = await storageService.getAccessToken();
      expect(token).toBe('secure_token_123');
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('access_token');
    });

    it('should enforce rate limits even after app returns from background', async () => {
      const key = 'match:user123';
      const maxRequests = 3;
      const windowMs = 60000;

      // Use up rate limit
      for (let i = 0; i < maxRequests; i++) {
        rateLimiter.isAllowed(key, maxRequests, windowMs);
      }

      // Go to background and return
      if (mockAppStateListener) {
        await mockAppStateListener('background');
        await mockAppStateListener('active');
      }

      // Rate limit should still be enforced
      expect(rateLimiter.isAllowed(key, maxRequests, windowMs)).toBe(false);
    });

    it('should clear sensitive data but maintain rate limit state', async () => {
      const key = 'match:user123';
      const maxRequests = 3;
      const windowMs = 60000;

      // Make some rate-limited requests
      rateLimiter.isAllowed(key, maxRequests, windowMs);
      rateLimiter.isAllowed(key, maxRequests, windowMs);

      // Go to background (clears sensitive data)
      if (mockAppStateListener) {
        await mockAppStateListener('background');
      }

      // Rate limit state should be preserved
      expect(rateLimiter.getRequestCount(key, windowMs)).toBe(2);
    });

    it('should handle security operations during rapid state changes', async () => {
      await storageService.setAccessToken('token');
      const key = 'match:user123';

      // Rapid state changes
      if (mockAppStateListener) {
        await mockAppStateListener('background');
        rateLimiter.isAllowed(key, 5, 60000);
        await mockAppStateListener('active');
        rateLimiter.isAllowed(key, 5, 60000);
        await mockAppStateListener('background');
      }

      // All security features should still work
      const token = await storageService.getAccessToken();
      expect(token).toBe('token');
      expect(rateLimiter.getRequestCount(key, 60000)).toBe(2);
    });
  });
});
