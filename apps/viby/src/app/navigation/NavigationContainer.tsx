/**
 * Navigation Container
 * 
 * Root navigation component that wraps the entire app.
 * Handles:
 * - Deep linking configuration
 * - Navigation state management
 * - Authentication-based routing
 * - Deep link authentication checks
 * - Navigation state persistence
 */

import React, { useRef, useEffect, useState } from 'react';
import { Linking, AppState, AppStateStatus } from 'react-native';
import { NavigationContainer as RNNavigationContainer } from '@react-navigation/native';
import type { NavigationContainerRef, NavigationState } from '@react-navigation/native';
import { RootStackNavigator } from './RootStackNavigator';
import linking from './linking';
import type { RootStackParamList } from './types';
import { 
  processPendingDeepLink, 
  isProtectedScreen, 
  setPendingDeepLink 
} from './deep-link-handler';
import { 
  saveNavigationState, 
  restoreNavigationState, 
  clearNavigationState 
} from './navigation-persistence';
import { analyticsTracker } from '@viby/shared/analytics';

interface NavigationContainerProps {
  isAuthenticated: boolean;
  navigationRef?: React.RefObject<NavigationContainerRef<RootStackParamList>>;
}

export function NavigationContainer({ isAuthenticated, navigationRef: externalRef }: NavigationContainerProps) {
  const internalRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const navigationRef = externalRef || internalRef;
  const [isReady, setIsReady] = useState(false);
  const [initialState, setInitialState] = useState<NavigationState | undefined>();
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const routeNameRef = useRef<string>();
  const previousRouteNameRef = useRef<string>();

  // Restore navigation state on mount (only for authenticated users)
  useEffect(() => {
    const restoreState = async () => {
      try {
        if (isAuthenticated) {
          const savedState = await restoreNavigationState();
          if (savedState) {
            setInitialState(savedState);
          }
        }
      } catch (error) {
        console.error('Failed to restore navigation state:', error);
        // Clear corrupted state
        await clearNavigationState();
      } finally {
        setIsReady(true);
      }
    };

    restoreState();
  }, [isAuthenticated]);

  // Save navigation state when app enters background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      // App is going to background
      if (
        appState.current.match(/active|foreground/) &&
        nextAppState === 'background'
      ) {
        // Only save state for authenticated users
        if (isAuthenticated && navigationRef.current) {
          const state = navigationRef.current.getState();
          if (state) {
            await saveNavigationState(state);
          }
        }
      }

      // App is returning to foreground
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // State restoration happens automatically via initialState
        // Additional foreground logic can be added here if needed
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated]);

  // Clear navigation state when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      clearNavigationState();
    }
  }, [isAuthenticated]);

  // Process pending deep links after authentication
  useEffect(() => {
    if (isAuthenticated && navigationRef.current) {
      processPendingDeepLink(navigationRef.current);
    }
  }, [isAuthenticated]);

  /** Intercept navigation to protected routes when the user is signed out. */
  const handleStateChange = (state: NavigationState | undefined) => {
    if (!state || !navigationRef.current) {
      return;
    }

    // Get the current route
    const currentRoute = state.routes[state.index];
    const currentRouteName = currentRoute.name;
    
    // Track screen view for analytics
    if (previousRouteNameRef.current !== currentRouteName) {
      // Track screen transition performance
      if (previousRouteNameRef.current) {
        analyticsTracker.performance.completeScreenTransition(
          previousRouteNameRef.current,
          currentRouteName
        );
      }
      
      // Track screen view
      analyticsTracker.engagement.trackScreenView(currentRouteName, {
        previous_screen: previousRouteNameRef.current || 'none',
      });
      
      // Start tracking next transition
      if (routeNameRef.current) {
        analyticsTracker.performance.startScreenTransition(
          routeNameRef.current,
          currentRouteName
        );
      }
      
      previousRouteNameRef.current = routeNameRef.current;
      routeNameRef.current = currentRouteName;
    }
    
    // Check if navigating to a protected screen while unauthenticated
    if (!isAuthenticated && isProtectedScreen(currentRoute.name)) {
      // Store the intended destination
      setPendingDeepLink(
        currentRoute.name as keyof RootStackParamList,
        currentRoute.params
      );
      
      // Redirect to auth flow
      navigationRef.current.reset({
        index: 0,
        routes: [{ name: 'Auth', params: { screen: 'Welcome' } }],
      });
    }
  };

  // Don't render until navigation state is restored
  if (!isReady) {
    return null;
  }

  return (
    <RNNavigationContainer 
      ref={navigationRef} 
      linking={linking}
      initialState={initialState}
      onStateChange={handleStateChange}
    >
      <RootStackNavigator isAuthenticated={isAuthenticated} />
    </RNNavigationContainer>
  );
}
