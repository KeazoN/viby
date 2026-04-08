/**
 * Deep Link Handler Tests
 * 
 * Tests authentication checks for deep linking functionality.
 * 
 */

import {
  isProtectedScreen,
  setPendingDeepLink,
  getPendingDeepLink,
  clearPendingDeepLink,
  handleDeepLink,
  processPendingDeepLink,
} from './deep-link-handler';
import type { NavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './types';

describe('Deep Link Handler', () => {
  describe('isProtectedScreen', () => {
    it('should return true for protected screens', () => {
      expect(isProtectedScreen('Match')).toBe(true);
      expect(isProtectedScreen('Game')).toBe(true);
      expect(isProtectedScreen('Chat')).toBe(true);
      expect(isProtectedScreen('Main')).toBe(true);
    });

    it('should return false for auth screens', () => {
      expect(isProtectedScreen('Auth')).toBe(false);
      expect(isProtectedScreen('Welcome')).toBe(false);
      expect(isProtectedScreen('Login')).toBe(false);
    });

    it('should return false for unknown screens', () => {
      expect(isProtectedScreen('Unknown')).toBe(false);
      expect(isProtectedScreen('')).toBe(false);
    });
  });

  describe('Pending Deep Link Management', () => {
    beforeEach(() => {
      clearPendingDeepLink();
    });

    it('should store and retrieve pending deep link', () => {
      const screen = 'Match';
      const params = { matchId: '123' };

      setPendingDeepLink(screen, params);
      const pending = getPendingDeepLink();

      expect(pending).toEqual({ screen, params });
    });

    it('should clear pending deep link after retrieval', () => {
      setPendingDeepLink('Game', { roomId: 'abc' });
      getPendingDeepLink();
      
      const secondRetrieval = getPendingDeepLink();
      expect(secondRetrieval).toBeNull();
    });

    it('should return null when no pending deep link exists', () => {
      const pending = getPendingDeepLink();
      expect(pending).toBeNull();
    });

    it('should clear pending deep link explicitly', () => {
      setPendingDeepLink('Chat', { roomId: 'xyz' });
      clearPendingDeepLink();
      
      const pending = getPendingDeepLink();
      expect(pending).toBeNull();
    });

    it('should overwrite previous pending deep link', () => {
      setPendingDeepLink('Match', { matchId: '123' });
      setPendingDeepLink('Game', { roomId: 'abc' });
      
      const pending = getPendingDeepLink();
      expect(pending).toEqual({ screen: 'Game', params: { roomId: 'abc' } });
    });
  });

  describe('handleDeepLink', () => {
    let mockNavigationRef: jest.Mocked<NavigationContainerRef<RootStackParamList>>;

    beforeEach(() => {
      clearPendingDeepLink();
      mockNavigationRef = {
        navigate: jest.fn(),
      } as any;
    });

    it('should navigate directly to unprotected screens when unauthenticated', () => {
      handleDeepLink(mockNavigationRef, false, 'Auth', { screen: 'Welcome' });

      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('Auth', { screen: 'Welcome' });
    });

    it('should navigate directly to protected screens when authenticated', () => {
      const params = { matchId: '123' };
      handleDeepLink(mockNavigationRef, true, 'Match', params);

      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('Match', params);
    });

    it('should store pending deep link and redirect to auth when accessing protected screen while unauthenticated', () => {
      const params = { matchId: '123' };
      handleDeepLink(mockNavigationRef, false, 'Match', params);

      // Should redirect to auth
      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('Auth', { screen: 'Welcome' });

      // Should store pending deep link
      const pending = getPendingDeepLink();
      expect(pending).toEqual({ screen: 'Match', params });
    });

    it('should handle Game screen deep link when unauthenticated', () => {
      const params = { roomId: 'abc' };
      handleDeepLink(mockNavigationRef, false, 'Game', params);

      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('Auth', { screen: 'Welcome' });
      
      const pending = getPendingDeepLink();
      expect(pending).toEqual({ screen: 'Game', params });
    });

    it('should handle Chat screen deep link when unauthenticated', () => {
      const params = { roomId: 'xyz' };
      handleDeepLink(mockNavigationRef, false, 'Chat', params);

      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('Auth', { screen: 'Welcome' });
      
      const pending = getPendingDeepLink();
      expect(pending).toEqual({ screen: 'Chat', params });
    });

    it('should handle deep link without params', () => {
      handleDeepLink(mockNavigationRef, true, 'Main');

      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('Main', undefined);
    });
  });

  describe('processPendingDeepLink', () => {
    let mockNavigationRef: jest.Mocked<NavigationContainerRef<RootStackParamList>>;

    beforeEach(() => {
      clearPendingDeepLink();
      mockNavigationRef = {
        navigate: jest.fn(),
      } as any;
    });

    it('should navigate to pending deep link and clear it', () => {
      const screen = 'Match';
      const params = { matchId: '123' };
      setPendingDeepLink(screen, params);

      processPendingDeepLink(mockNavigationRef);

      expect(mockNavigationRef.navigate).toHaveBeenCalledWith(screen, params);
      
      // Should be cleared after processing
      const pending = getPendingDeepLink();
      expect(pending).toBeNull();
    });

    it('should do nothing when no pending deep link exists', () => {
      processPendingDeepLink(mockNavigationRef);

      expect(mockNavigationRef.navigate).not.toHaveBeenCalled();
    });

    it('should handle pending deep link without params', () => {
      setPendingDeepLink('Main');

      processPendingDeepLink(mockNavigationRef);

      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('Main', undefined);
    });
  });

  describe('Integration: Full Deep Link Flow', () => {
    let mockNavigationRef: jest.Mocked<NavigationContainerRef<RootStackParamList>>;

    beforeEach(() => {
      clearPendingDeepLink();
      mockNavigationRef = {
        navigate: jest.fn(),
      } as any;
    });

    it('should complete full flow: unauthenticated deep link -> auth -> navigate to target', () => {
      // Step 1: User clicks deep link while unauthenticated
      const targetScreen = 'Match';
      const targetParams = { matchId: '123' };
      handleDeepLink(mockNavigationRef, false, targetScreen, targetParams);

      // Should redirect to auth
      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('Auth', { screen: 'Welcome' });

      // Step 2: User completes authentication
      mockNavigationRef.navigate.mockClear();

      // Step 3: Process pending deep link
      processPendingDeepLink(mockNavigationRef);

      // Should navigate to original target
      expect(mockNavigationRef.navigate).toHaveBeenCalledWith(targetScreen, targetParams);
    });

    it('should handle multiple deep link attempts before authentication', () => {
      // First deep link
      handleDeepLink(mockNavigationRef, false, 'Match', { matchId: '123' });
      
      // Second deep link (overwrites first)
      handleDeepLink(mockNavigationRef, false, 'Game', { roomId: 'abc' });

      // After auth, should navigate to the latest deep link
      processPendingDeepLink(mockNavigationRef);

      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('Game', { roomId: 'abc' });
    });
  });
});
