/**
 * Deep Link Handler
 * 
 * Handles authentication checks for deep links.
 * Ensures users are authenticated before navigating to protected screens.
 * 
 */

import type { NavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './types';

/**
 * Protected screens that require authentication
 */
const PROTECTED_SCREENS = ['Match', 'Game', 'Chat', 'Main'] as const;

/**
 * Pending deep link state
 * Stores the intended destination while user authenticates
 */
interface PendingDeepLink {
  screen: keyof RootStackParamList;
  params?: any;
}

let pendingDeepLink: PendingDeepLink | null = null;

/**
 * Check if a screen requires authentication
 * 
 * @param screenName - Name of the screen to check
 * @returns true if screen requires authentication
 */
export function isProtectedScreen(screenName: string): boolean {
  return PROTECTED_SCREENS.includes(screenName as any);
}

/**
 * Store a pending deep link for later navigation
 * Called when user tries to access protected screen while unauthenticated
 * 
 * @param screen - Target screen name
 * @param params - Screen parameters
 * 
 */
export function setPendingDeepLink(screen: keyof RootStackParamList, params?: any): void {
  pendingDeepLink = { screen, params };
}

/**
 * Get and clear the pending deep link
 * Called after successful authentication to navigate to intended destination
 * 
 * @returns Pending deep link or null
 * 
 */
export function getPendingDeepLink(): PendingDeepLink | null {
  const link = pendingDeepLink;
  pendingDeepLink = null;
  return link;
}

/**
 * Clear pending deep link
 * Called when user cancels authentication or deep link expires
 */
export function clearPendingDeepLink(): void {
  pendingDeepLink = null;
}

/**
 * Handle deep link navigation with authentication check
 * 
 * @param navigationRef - Navigation container ref
 * @param isAuthenticated - Current authentication status
 * @param screenName - Target screen name
 * @param params - Screen parameters
 * 
 */
export function handleDeepLink(
  navigationRef: NavigationContainerRef<RootStackParamList>,
  isAuthenticated: boolean,
  screenName: keyof RootStackParamList,
  params?: any
): void {
  // Check if screen requires authentication
  if (isProtectedScreen(screenName)) {
    if (!isAuthenticated) {
      // Store pending deep link and redirect to auth
      setPendingDeepLink(screenName, params);
      navigationRef.navigate('Auth', { screen: 'Welcome' });
      return;
    }
  }

  // Navigate to target screen
  navigationRef.navigate(screenName as any, params);
}

/**
 * Process pending deep link after authentication
 * Should be called after successful login/OAuth
 * 
 * @param navigationRef - Navigation container ref
 * 
 */
export function processPendingDeepLink(
  navigationRef: NavigationContainerRef<RootStackParamList>
): void {
  const pending = getPendingDeepLink();
  
  if (pending) {
    // Navigate to the intended destination
    navigationRef.navigate(pending.screen as any, pending.params);
  }
}
