/**
 * Example E2E test demonstrating Detox setup and helper usage
 * 
 * This test serves as a template and reference for writing E2E tests.
 * It demonstrates:
 * - Basic test structure
 * - Using test helpers
 * - Common test patterns
 * - Best practices
 */

import { device, element, by, expect as detoxExpect } from 'detox';
import {
  waitForElement,
  tapElement,
  assertVisible,
  assertTextVisible,
  setupE2E,
  resetAppState,
} from './helpers';

describe('Example E2E Test', () => {
  beforeAll(async () => {
    await setupE2E();
  });

  beforeEach(async () => {
    await resetAppState();
  });

  it('should launch the app successfully', async () => {
    // Wait for the app to load
    // Note: Replace 'app-root' with actual root element testID
    await waitForElement('app-root', 10000);
    
    // Assert app is visible
    await assertVisible('app-root');
  });

  it('should display welcome screen on first launch', async () => {
    // This test assumes the app shows a welcome screen for new users
    // Adjust based on actual app behavior
    
    // Wait for welcome screen
    await waitForElement('welcome-screen', 5000);
    
    // Assert welcome message is visible
    await assertTextVisible('Welcome to Viby');
    
    // Assert login button is visible
    await assertVisible('login-button');
  });

  it('should navigate between screens', async () => {
    // Example of navigation testing
    // Adjust based on actual app navigation
    
    // Wait for initial screen
    await waitForElement('welcome-screen', 5000);
    
    // Tap navigation button
    await tapElement('login-button');
    
    // Assert navigation occurred
    await waitForElement('login-screen', 5000);
    await assertVisible('login-screen');
  });

  it('should handle user interactions', async () => {
    // Example of interaction testing
    
    // Wait for screen with interactive elements
    await waitForElement('welcome-screen', 5000);
    
    // Tap a button
    await tapElement('login-button');
    
    // Wait for result
    await waitForElement('login-screen', 5000);
    
    // Verify result
    await assertVisible('spotify-login-button');
    await assertVisible('deezer-login-button');
  });

  it('should display error messages', async () => {
    // Example of error handling testing
    // This would require triggering an error condition
    
    // For demonstration purposes only
    // Actual implementation depends on app behavior
  });

  it('should handle app backgrounding', async () => {
    // Test app state transitions
    
    // Wait for app to load
    await waitForElement('app-root', 10000);
    
    // Send app to background
    await device.sendToHome();
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Bring app back to foreground
    await device.launchApp({ newInstance: false });
    
    // Verify app state is maintained
    await waitForElement('app-root', 5000);
  });

  it('should take screenshots for documentation', async () => {
    // Example of taking screenshots
    
    await waitForElement('welcome-screen', 5000);
    
    // Take screenshot
    await device.takeScreenshot('welcome-screen');
    
    // Navigate to another screen
    await tapElement('login-button');
    await waitForElement('login-screen', 5000);
    
    // Take another screenshot
    await device.takeScreenshot('login-screen');
  });
});

/**
 * Additional test examples for reference
 */
describe('Advanced E2E Patterns', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should scroll to find elements', async () => {
    // Example of scrolling to find elements
    // Useful for long lists or scrollable content
    
    // This is a placeholder - implement based on actual app
    // await scrollToElement('scroll-view', 'target-element');
  });

  it('should handle swipe gestures', async () => {
    // Example of swipe testing
    // Useful for carousels, dismissible items, etc.
    
    // This is a placeholder - implement based on actual app
    // await swipeElement('card', 'left');
  });

  it('should test with different device orientations', async () => {
    // Test landscape mode
    await device.setOrientation('landscape');
    await waitForElement('app-root', 5000);
    
    // Test portrait mode
    await device.setOrientation('portrait');
    await waitForElement('app-root', 5000);
  });

  it('should handle network conditions', async () => {
    // Test offline behavior
    // Note: This requires additional setup in the app
    
    // Disable network
    await device.disableSynchronization();
    
    // Test offline behavior
    // ...
    
    // Re-enable network
    await device.enableSynchronization();
  });
});
