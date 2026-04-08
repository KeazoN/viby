/**
 * Navigation Module Exports
 * 
 * Central export point for all navigation-related components and types.
 */

export { NavigationContainer } from './NavigationContainer';
export { RootStackNavigator } from './RootStackNavigator';
export { AuthStackNavigator } from './AuthStackNavigator';
export { MainTabNavigator } from './MainTabNavigator';
export type {
  RootStackParamList,
  AuthStackParamList,
  MainTabParamList,
} from './types';
export { default as linking } from './linking';
export {
  isProtectedScreen,
  setPendingDeepLink,
  getPendingDeepLink,
  clearPendingDeepLink,
  handleDeepLink,
  processPendingDeepLink,
} from './deep-link-handler';
export {
  saveNavigationState,
  restoreNavigationState,
  clearNavigationState,
} from './navigation-persistence';
