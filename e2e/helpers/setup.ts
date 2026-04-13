/**
 * E2E test setup utilities
 */

import { device } from 'detox';

/**
 * Setup function to run before all tests
 */
export async function setupE2E(): Promise<void> {
  // Launch the app
  await device.launchApp({
    newInstance: true,
    permissions: {
      notifications: 'YES',
      camera: 'YES',
      photos: 'YES',
    },
  });
}

/**
 * Teardown function to run after all tests
 */
export async function teardownE2E(): Promise<void> {
  // No specific teardown needed, Detox handles cleanup
}

/**
 * Reset app state before each test
 */
export async function resetAppState(): Promise<void> {
  await device.reloadReactNative();
}

/**
 * Login helper for tests that require authentication
 */
export async function loginTestUser(): Promise<void> {
  // This would typically involve:
  // 1. Navigating to login screen
  // 2. Entering credentials or using test OAuth flow
  // 3. Waiting for successful authentication
  
  // For now, this is a placeholder that assumes the app
  // can be configured to auto-login in test mode
  console.log('Login test user - implement based on auth flow');
}

/**
 * Logout helper
 */
export async function logoutTestUser(): Promise<void> {
  // Navigate to settings and logout
  console.log('Logout test user - implement based on auth flow');
}

/**
 * Wait for network requests to complete
 */
export async function waitForNetworkIdle(timeout: number = 3000): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, timeout));
}

/**
 * Enable/disable network connectivity
 */
export async function setNetworkConnectivity(enabled: boolean): Promise<void> {
  if (enabled) {
    await device.enableSynchronization();
  } else {
    await device.disableSynchronization();
  }
}

/**
 * Set device orientation
 */
export async function setOrientation(
  orientation: 'portrait' | 'landscape'
): Promise<void> {
  await device.setOrientation(orientation);
}

/**
 * Shake device (useful for triggering dev menu)
 */
export async function shakeDevice(): Promise<void> {
  await device.shake();
}

/**
 * Set device location (for location-based features)
 */
export async function setLocation(lat: number, lon: number): Promise<void> {
  await device.setLocation(lat, lon);
}

/**
 * Clear app data and restart
 */
export async function clearAppData(): Promise<void> {
  await device.launchApp({
    newInstance: true,
    delete: true,
  });
}

/**
 * Wait for app to be ready
 */
export async function waitForAppReady(timeout: number = 10000): Promise<void> {
  // Wait for the app to fully load
  await new Promise(resolve => setTimeout(resolve, timeout));
}
