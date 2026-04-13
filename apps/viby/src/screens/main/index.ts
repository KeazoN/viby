/**
 * Main Screens Exports
 * 
 * Lazy-loaded main screens to reduce initial bundle size.
 */

import { lazy } from 'react';

export const DiscoveryScreen = lazy(() => import('./DiscoveryScreen').then(module => ({ default: module.DiscoveryScreen })));
export const ProfileScreen = lazy(() => import('./ProfileScreen').then(module => ({ default: module.ProfileScreen })));
export const SettingsScreen = lazy(() => import('./SettingsScreen').then(module => ({ default: module.SettingsScreen })));
