/**
 * Deep Link Integration Tests
 * 
 * Integration tests for deep linking with authentication checks.
 * Tests the full flow from deep link to navigation.
 * 
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from './NavigationContainer';
import {
  setPendingDeepLink,
  getPendingDeepLink,
  clearPendingDeepLink,
  isProtectedScreen,
} from './deep-link-handler';

// Mock the screen components
jest.mock('../../screens/auth', () => ({
  WelcomeScreen: () => null,
  LoginScreen: () => null,
  OAuthScreen: () => null,
  OnboardingScreen: () => null,
}));

jest.mock('../../screens/main', () => ({
  DiscoveryScreen: () => null,
  ProfileScreen: () => null,
  SettingsScreen: () => null,
}));

jest.mock('../../screens/modals', () => ({
  MatchScreen: () => null,
  GameScreen: () => null,
  ChatScreen: () => null,
}));

describe('Deep Link Integration', () => {
  beforeEach(() => {
    clearPendingDeepLink();
  });

  describe('Protected Screen Detection', () => {
    it('should identify Match as protected screen', () => {
      expect(isProtectedScreen('Match')).toBe(true);
    });

    it('should identify Game as protected screen', () => {
      expect(isProtectedScreen('Game')).toBe(true);
    });

    it('should identify Chat as protected screen', () => {
      expect(isProtectedScreen('Chat')).toBe(true);
    });

    it('should identify Main as protected screen', () => {
      expect(isProtectedScreen('Main')).toBe(true);
    });

    it('should not identify Auth as protected screen', () => {
      expect(isProtectedScreen('Auth')).toBe(false);
    });
  });

  describe('Pending Deep Link Management', () => {
    it('should store and retrieve match deep link', () => {
      const screen = 'Match';
      const params = { matchId: '123' };

      setPendingDeepLink(screen, params);
      const pending = getPendingDeepLink();

      expect(pending).toEqual({ screen, params });
    });

    it('should store and retrieve game deep link', () => {
      const screen = 'Game';
      const params = { roomId: 'abc' };

      setPendingDeepLink(screen, params);
      const pending = getPendingDeepLink();

      expect(pending).toEqual({ screen, params });
    });

    it('should store and retrieve chat deep link', () => {
      const screen = 'Chat';
      const params = { roomId: 'xyz', matchId: '456' };

      setPendingDeepLink(screen, params);
      const pending = getPendingDeepLink();

      expect(pending).toEqual({ screen, params });
    });

    it('should clear pending deep link after retrieval', () => {
      setPendingDeepLink('Match', { matchId: '123' });
      getPendingDeepLink();

      const secondRetrieval = getPendingDeepLink();
      expect(secondRetrieval).toBeNull();
    });

    it('should overwrite previous pending deep link', () => {
      setPendingDeepLink('Match', { matchId: '123' });
      setPendingDeepLink('Game', { roomId: 'abc' });

      const pending = getPendingDeepLink();
      expect(pending).toEqual({ screen: 'Game', params: { roomId: 'abc' } });
    });
  });

  describe('Navigation Container Rendering', () => {
    it('should render for unauthenticated users', () => {
      const result = render(
        <NavigationContainer isAuthenticated={false} />
      );

      expect(result).toBeTruthy();
    });

    it('should render for authenticated users', () => {
      const result = render(
        <NavigationContainer isAuthenticated={true} />
      );

      expect(result).toBeTruthy();
    });

    it('should process pending deep link when authentication changes', async () => {
      // Store a pending deep link
      setPendingDeepLink('Match', { matchId: '123' });

      // Render as unauthenticated
      const { rerender } = render(
        <NavigationContainer isAuthenticated={false} />
      );

      // Verify pending link is still there
      expect(getPendingDeepLink()).toEqual({
        screen: 'Match',
        params: { matchId: '123' },
      });

      // Re-store it since getPendingDeepLink clears it
      setPendingDeepLink('Match', { matchId: '123' });

      // Rerender as authenticated
      rerender(<NavigationContainer isAuthenticated={true} />);

      // Wait for effect to process pending link
      await waitFor(() => {
        // Pending link should be cleared after processing
        const pending = getPendingDeepLink();
        expect(pending).toBeNull();
      });
    });
  });

  describe('Authentication Flow Scenarios', () => {
    it('should handle match notification deep link for unauthenticated user', () => {
      // Simulate deep link click
      const matchId = '123';
      setPendingDeepLink('Match', { matchId });

      // Render navigation container
      render(<NavigationContainer isAuthenticated={false} />);

      // Verify pending link is stored
      const pending = getPendingDeepLink();
      expect(pending).toEqual({
        screen: 'Match',
        params: { matchId },
      });
    });

    it('should handle game invitation deep link for unauthenticated user', () => {
      // Simulate deep link click
      const roomId = 'abc';
      setPendingDeepLink('Game', { roomId });

      // Render navigation container
      render(<NavigationContainer isAuthenticated={false} />);

      // Verify pending link is stored
      const pending = getPendingDeepLink();
      expect(pending).toEqual({
        screen: 'Game',
        params: { roomId },
      });
    });

    it('should handle chat deep link for unauthenticated user', () => {
      // Simulate deep link click
      const roomId = 'xyz';
      const matchId = '456';
      setPendingDeepLink('Chat', { roomId, matchId });

      // Render navigation container
      render(<NavigationContainer isAuthenticated={false} />);

      // Verify pending link is stored
      const pending = getPendingDeepLink();
      expect(pending).toEqual({
        screen: 'Chat',
        params: { roomId, matchId },
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle deep link without params', () => {
      setPendingDeepLink('Main');

      const pending = getPendingDeepLink();
      expect(pending).toEqual({
        screen: 'Main',
        params: undefined,
      });
    });

    it('should handle clearing pending link explicitly', () => {
      setPendingDeepLink('Match', { matchId: '123' });
      clearPendingDeepLink();

      const pending = getPendingDeepLink();
      expect(pending).toBeNull();
    });

    it('should handle multiple authentication state changes', async () => {
      const { rerender } = render(
        <NavigationContainer isAuthenticated={false} />
      );

      // Change to authenticated
      rerender(<NavigationContainer isAuthenticated={true} />);

      // Change back to unauthenticated
      rerender(<NavigationContainer isAuthenticated={false} />);

      // Change to authenticated again
      rerender(<NavigationContainer isAuthenticated={true} />);

      // Should not crash
      expect(true).toBe(true);
    });
  });
});
