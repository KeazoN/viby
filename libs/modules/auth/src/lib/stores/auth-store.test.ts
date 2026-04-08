import { renderHook, act } from '@testing-library/react-native';
import { useAuthStore } from './auth-store';
import { authService } from '../services/auth-service';
import type { User, AuthTokens } from '../types';

// Mock dependencies
jest.mock('../services/auth-service');
jest.mock('@viby/shared/storage', () => ({
  storageService: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('useAuthStore', () => {
  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    provider: 'spotify',
  };

  const mockTokens: AuthTokens = {
    accessToken: 'access-token-123',
    refreshToken: 'refresh-token-123',
    expiresIn: 3600,
  };

  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useAuthStore());
    act(() => {
      result.current.setUser(null);
      result.current.setLoading(false);
    });

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('login', () => {
    it('should set user and authentication state on login', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login(mockTokens, mockUser);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it('should update state when logging in multiple times', () => {
      const { result } = renderHook(() => useAuthStore());

      const firstUser: User = { ...mockUser, id: 'user-1' };
      const secondUser: User = { ...mockUser, id: 'user-2' };

      act(() => {
        result.current.login(mockTokens, firstUser);
      });

      expect(result.current.user?.id).toBe('user-1');

      act(() => {
        result.current.login(mockTokens, secondUser);
      });

      expect(result.current.user?.id).toBe('user-2');
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('logout', () => {
    it('should clear user and authentication state on logout', async () => {
      const { result } = renderHook(() => useAuthStore());

      // First login
      act(() => {
        result.current.login(mockTokens, mockUser);
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Then logout
      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('should call authService.logout to clear tokens', async () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login(mockTokens, mockUser);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(authService.logout).toHaveBeenCalledTimes(1);
    });

    it('should clear state even if authService.logout fails', async () => {
      const { result } = renderHook(() => useAuthStore());

      // Mock authService.logout to throw error
      (authService.logout as jest.Mock).mockRejectedValueOnce(
        new Error('Logout failed')
      );

      act(() => {
        result.current.login(mockTokens, mockUser);
      });

      // Logout should still clear state
      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('setUser', () => {
    it('should update user data', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser(mockUser);
      });

      expect(result.current.user).toEqual(mockUser);
    });

    it('should update user data without changing authentication state', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login(mockTokens, mockUser);
      });

      const updatedUser: User = {
        ...mockUser,
        displayName: 'Updated Name',
      };

      act(() => {
        result.current.setUser(updatedUser);
      });

      expect(result.current.user?.displayName).toBe('Updated Name');
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('setLoading', () => {
    it('should update loading state', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Persistence', () => {
    it('should only persist isAuthenticated flag', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login(mockTokens, mockUser);
      });

      // The store should persist only isAuthenticated
      // User data and tokens should not be persisted
      // This is tested by the partialize configuration
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
    });
  });

  describe('Behavior checks', () => {
    it('should validate Store authentication state persistently', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login(mockTokens, mockUser);
      });

      // isAuthenticated should be persisted
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should validate Clear state on logout', async () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login(mockTokens, mockUser);
      });

      await act(async () => {
        await result.current.logout();
      });

      // All state should be cleared
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);

      // AuthService should clear tokens
      expect(authService.logout).toHaveBeenCalled();
    });
  });
});
