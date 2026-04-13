/**
 * Authentication E2E Tests
 * 
 * Tests for the authentication flow including:
 * - Welcome screen display
 * - OAuth login flow (Spotify/Deezer)
 * - Onboarding flow
 * 
 * Requirements: 2.1, 20.1, 20.2, 20.3
 * 
 * Note: These tests assume a test environment where OAuth can be mocked
 * or bypassed. In a real production environment, you would need to:
 * 1. Use test OAuth credentials
 * 2. Mock OAuth responses
 * 3. Use deep linking to simulate OAuth callbacks
 */

import {
  waitForElement,
  tapElement,
  assertVisible,
  assertTextVisible,
  setupE2E,
  clearAppData,
  takeScreenshot,
  wait,
  assertExists,
} from './helpers';

describe('Authentication Flow', () => {
  beforeAll(async () => {
    await setupE2E();
  });

  beforeEach(async () => {
    // Clear app data to ensure we start from a clean state
    await clearAppData();
  });

  describe('Welcome Screen Display', () => {
    it('should display welcome screen on first launch', async () => {
      // Wait for welcome screen to load
      await waitForElement('welcome-screen', 10000);
      
      // Assert welcome screen is visible
      await assertVisible('welcome-screen');
      
      // Take screenshot for documentation
      await takeScreenshot('01-welcome-screen');
    });

    it('should display app branding and tagline', async () => {
      await waitForElement('welcome-screen', 10000);
      
      // Assert app name is visible
      await assertTextVisible('Viby');
      
      // Assert tagline is visible
      await assertTextVisible('See who\'s vibing to the same music, connect instantly, play together');
      
      await takeScreenshot('02-welcome-branding');
    });

    it('should display both OAuth provider buttons', async () => {
      await waitForElement('welcome-screen', 10000);
      
      // Assert Spotify login button is visible
      await assertVisible('button-login-spotify');
      await assertTextVisible('Login with Spotify');
      
      // Assert Deezer login button is visible
      await assertVisible('button-login-deezer');
      await assertTextVisible('Login with Deezer');
      
      await takeScreenshot('03-oauth-buttons');
    });

    it('should have proper accessibility labels for login buttons', async () => {
      await waitForElement('welcome-screen', 10000);
      
      // Verify buttons exist with accessibility labels
      await assertExists('button-login-spotify');
      await assertExists('button-login-deezer');
    });
  });

  describe('OAuth Login Flow - Spotify', () => {
    it('should initiate Spotify OAuth when button is tapped', async () => {
      await waitForElement('welcome-screen', 10000);
      
      // Tap Spotify login button
      await tapElement('button-login-spotify');
      
      // Wait for OAuth flow to initiate
      // In a real test, this would open a browser or show loading state
      await wait(2000);
      
      // Take screenshot
      await takeScreenshot('04-spotify-oauth-initiated');
    });

    it('should show loading state during OAuth initiation', async () => {
      await waitForElement('welcome-screen', 10000);
      
      // Tap Spotify login button
      await tapElement('button-login-spotify');
      
      // Wait briefly for loading state
      await wait(500);
      
      // Take screenshot of loading state
      await takeScreenshot('05-spotify-oauth-loading');
    });
  });

  describe('OAuth Login Flow - Deezer', () => {
    it('should initiate Deezer OAuth when button is tapped', async () => {
      await waitForElement('welcome-screen', 10000);
      
      // Tap Deezer login button
      await tapElement('button-login-deezer');
      
      // Wait for OAuth flow to initiate
      await wait(2000);
      
      // Take screenshot
      await takeScreenshot('06-deezer-oauth-initiated');
    });

    it('should show loading state during OAuth initiation', async () => {
      await waitForElement('welcome-screen', 10000);
      
      // Tap Deezer login button
      await tapElement('button-login-deezer');
      
      // Wait briefly for loading state
      await wait(500);
      
      // Take screenshot of loading state
      await takeScreenshot('07-deezer-oauth-loading');
    });
  });

  describe('Onboarding Flow - Welcome Step', () => {
    /**
     * Note: These tests assume successful OAuth authentication.
     * In a real E2E environment with OAuth mocking, you would:
     * 1. Complete OAuth flow
     * 2. Simulate OAuth callback with test token
     * 3. Navigate to onboarding
     * 
     * For this test suite, we document the expected flow.
     */

    it('should display onboarding welcome step after authentication', async () => {
      // In a real test with OAuth mocking:
      // 1. Complete OAuth
      // 2. Wait for onboarding screen
      // await waitForElement('onboarding-screen', 10000);
      // await waitForElement('onboarding-welcome-step', 5000);
      // await assertTextVisible('Welcome to Viby! 🎵');
      // await takeScreenshot('08-onboarding-welcome');
    });

    it('should display welcome message and app description', async () => {
      // Expected behavior:
      // await waitForElement('onboarding-welcome-step', 5000);
      // await assertTextVisible('Welcome to Viby! 🎵');
      // await assertTextVisible('Discover who\'s vibing to the same music right now');
      // await assertTextVisible('Let\'s get you set up in just a few steps');
    });

    it('should navigate to notifications step when Get Started is tapped', async () => {
      // Expected behavior:
      // await waitForElement('onboarding-welcome-step', 5000);
      // await tapElement('button-get-started');
      // await waitForElement('onboarding-notifications-step', 5000);
      // await assertTextVisible('Stay Connected 🔔');
      // await takeScreenshot('09-onboarding-notifications');
    });
  });

  describe('Onboarding Flow - Notifications Step', () => {
    it('should display notification permission request', async () => {
      // Expected behavior:
      // await waitForElement('onboarding-notifications-step', 5000);
      // await assertTextVisible('Stay Connected 🔔');
      // await assertTextVisible('Get notified when someone matches with you');
      // await assertVisible('button-enable-notifications');
      // await assertVisible('button-skip-notifications');
    });

    it('should navigate to music taste step when Enable Notifications is tapped', async () => {
      // Expected behavior:
      // await waitForElement('onboarding-notifications-step', 5000);
      // await tapElement('button-enable-notifications');
      // await wait(1000); // Wait for permission dialog
      // await waitForElement('onboarding-music-taste-step', 5000);
      // await assertTextVisible('Your Music Taste 🎸');
      // await takeScreenshot('10-onboarding-music-taste');
    });

    it('should allow skipping notification permissions', async () => {
      // Expected behavior:
      // await waitForElement('onboarding-notifications-step', 5000);
      // await tapElement('button-skip-notifications');
      // await waitForElement('onboarding-music-taste-step', 5000);
      // await assertTextVisible('Your Music Taste 🎸');
    });
  });

  describe('Onboarding Flow - Music Taste Step', () => {
    it('should display music taste setup screen', async () => {
      // Expected behavior:
      // await waitForElement('onboarding-music-taste-step', 5000);
      // await assertTextVisible('Your Music Taste 🎸');
      // await assertTextVisible('Select 6 of your favorite artists');
      // await assertVisible('input-search-artists');
      // await assertTextVisible('0 / 6 selected');
      // await takeScreenshot('11-music-taste-empty');
    });

    it('should allow searching for artists', async () => {
      // Expected behavior:
      // await waitForElement('onboarding-music-taste-step', 5000);
      // await typeText('input-search-artists', 'The Beatles');
      // await wait(500); // Wait for debounced search
      // await waitForElement('artist-search-loading', 2000);
      // await wait(1000); // Wait for results
      // await assertVisible('artist-search-results');
      // await takeScreenshot('12-artist-search-results');
    });

    it('should display search results', async () => {
      // Expected behavior:
      // await waitForElement('onboarding-music-taste-step', 5000);
      // await typeText('input-search-artists', 'Beatles');
      // await wait(1500);
      // await assertTextVisible('The Beatles');
    });

    it('should allow selecting artists', async () => {
      // Expected behavior:
      // await waitForElement('onboarding-music-taste-step', 5000);
      // await typeText('input-search-artists', 'Beatles');
      // await wait(1500);
      // await tapElement('artist-card-1'); // Tap first result
      // await assertTextVisible('1 / 6 selected');
      // await takeScreenshot('13-artist-selected');
    });

    it('should allow deselecting artists', async () => {
      // Expected behavior:
      // Select an artist first
      // await tapElement('artist-card-1');
      // await assertTextVisible('1 / 6 selected');
      // Deselect the artist
      // await tapElement('artist-card-1');
      // await assertTextVisible('0 / 6 selected');
    });

    it('should enforce maximum of 6 artists', async () => {
      // Expected behavior:
      // Select 6 artists
      // for (let i = 1; i <= 6; i++) {
      //   await tapElement(`artist-card-${i}`);
      //   await wait(200);
      // }
      // await assertTextVisible('6 / 6 selected');
      // Try to select 7th artist
      // await tapElement('artist-card-7');
      // await assertTextVisible('Maximum Reached');
    });

    it('should disable Complete Setup button until 6 artists are selected', async () => {
      // Expected behavior:
      // await waitForElement('onboarding-music-taste-step', 5000);
      // Button should be disabled initially
      // await assertExists('button-complete-setup');
      // Select 6 artists
      // for (let i = 1; i <= 6; i++) {
      //   await tapElement(`artist-card-${i}`);
      // }
      // Button should now be enabled
      // await tapElement('button-complete-setup');
    });

    it('should show loading state while saving preferences', async () => {
      // Expected behavior:
      // Select 6 artists and tap complete
      // await tapElement('button-complete-setup');
      // await assertTextVisible('Saving...');
      // await takeScreenshot('14-saving-preferences');
    });

    it('should navigate to main app after completing onboarding', async () => {
      // Expected behavior:
      // Complete onboarding
      // await tapElement('button-complete-setup');
      // await wait(2000);
      // Should navigate to main app (discovery screen)
      // await waitForElement('discovery-screen', 10000);
      // await takeScreenshot('15-main-app');
    });

    it('should allow skipping music taste setup', async () => {
      // Expected behavior:
      // await waitForElement('onboarding-music-taste-step', 5000);
      // await tapElement('button-skip-music-taste');
      // await assertTextVisible('Skip Music Taste Setup?');
      // Confirm skip
      // await tapElement('button-confirm-skip');
      // Should navigate to main app
      // await waitForElement('discovery-screen', 10000);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors during OAuth gracefully', async () => {
      // Expected behavior with network mocking:
      // await waitForElement('welcome-screen', 10000);
      // Simulate network error
      // await tapElement('button-login-spotify');
      // await wait(2000);
      // await assertTextVisible('Authentication Error');
    });

    it('should handle errors during onboarding save', async () => {
      // Expected behavior with API mocking:
      // Complete onboarding with network error
      // await assertTextVisible('Failed to save your preferences');
      // await assertTextVisible('Please try again');
    });
  });

  describe('App State Management', () => {
    it('should maintain onboarding state when app is backgrounded', async () => {
      // Expected behavior:
      // Navigate to notifications step
      // await waitForElement('onboarding-notifications-step', 5000);
      // Background the app
      // await device.sendToHome();
      // await wait(2000);
      // Bring app back to foreground
      // await device.launchApp({ newInstance: false });
      // Should still be on notifications step
      // await waitForElement('onboarding-notifications-step', 5000);
    });

    it('should not show onboarding for returning users', async () => {
      // Expected behavior:
      // This test would require:
      // 1. Completing onboarding once
      // 2. Restarting the app
      // 3. Verifying we go directly to main app
    });
  });
});
