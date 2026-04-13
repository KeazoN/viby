/**
 * Navigation Type Definitions
 * 
 * Defines TypeScript types for all navigation stacks and their parameters.
 * This ensures type-safe navigation throughout the app.
 */

import type { NavigatorScreenParams } from '@react-navigation/native';

/**
 * Root Stack Navigator
 * Top-level navigator that switches between Auth and Main flows
 */
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  // Modal screens
  Match: { matchId: string };
  Game: { roomId: string };
  Chat: { roomId: string; matchId?: string };
  // Legal documents
  LegalDocument: { documentType: 'privacy-policy' | 'terms-of-service' };
};

/**
 * Auth Stack Navigator
 * Handles authentication and onboarding flow
 */
export type AuthStackParamList = {
  Welcome: undefined;
  Login: { provider?: 'spotify' | 'deezer' };
  OAuth: { code: string; provider: 'spotify' | 'deezer' };
  Onboarding: undefined;
};

/**
 * Main Tab Navigator
 * Bottom tab navigation for authenticated users
 */
export type MainTabParamList = {
  Discovery: undefined;
  Profile: { userId?: string };
  Settings: undefined;
};

/**
 * Type helpers for navigation props
 */
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
