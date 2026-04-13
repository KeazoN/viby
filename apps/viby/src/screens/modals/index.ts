/**
 * Modal Screens Exports
 * 
 * Lazy-loaded modal screens to reduce initial bundle size.
 */

import { lazy } from 'react';

export const MatchScreen = lazy(() => import('./MatchScreen').then(module => ({ default: module.MatchScreen })));
export const GameScreen = lazy(() => import('./GameScreen').then(module => ({ default: module.GameScreen })));
export const ChatScreen = lazy(() => import('./ChatScreen').then(module => ({ default: module.ChatScreen })));
