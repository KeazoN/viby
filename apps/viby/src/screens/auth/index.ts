/**
 * Auth Screens Exports
 * 
 * Lazy-loaded auth screens to reduce initial bundle size.
 */

import { lazy } from 'react';

export const WelcomeScreen = lazy(() => import('./WelcomeScreen').then(module => ({ default: module.WelcomeScreen })));
export const LoginScreen = lazy(() => import('./LoginScreen').then(module => ({ default: module.LoginScreen })));
export const OAuthCallbackScreen = lazy(() => import('./OAuthCallbackScreen').then(module => ({ default: module.OAuthCallbackScreen })));
export const OnboardingScreen = lazy(() => import('./OnboardingScreen').then(module => ({ default: module.OnboardingScreen })));
