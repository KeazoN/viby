/**
 * Viby Mobile App
 * 
 * Root application component that sets up:
 * - Navigation structure
 * - Authentication state
 * - Global providers
 * - App lifecycle management
 * - Error tracking with Sentry
 */

import React, { useEffect, useRef } from 'react';
import { StatusBar, AppState } from 'react-native';
import { NavigationContainer } from './navigation';
import { useAuthStore } from '@viby/modules/auth';
import { useProfileStore } from '@viby/modules/profile';
import { appStateManager } from '@viby/shared/lifecycle';
import { notificationService, notificationEventHandler } from '@viby/shared/notifications';
import { initializeSentry, setSentryUser, clearSentryUser } from '@viby/shared/monitoring';
import { analyticsService, AnalyticsEvent, analyticsTracker } from '@viby/shared/analytics';
import { ErrorBoundary } from './components';
import type { NavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './navigation/types';

// Initialize Sentry as early as possible
initializeSentry();

export const App = () => {
  // Get authentication state from Zustand store
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const profile = useProfileStore((state) => state.profile);
  
  // Navigation ref for notification handling
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  
  // Track app launch time for performance metrics
  const appLaunchTime = useRef(Date.now());
  const sessionStartTime = useRef(Date.now());

  // Initialize analytics on app launch
  useEffect(() => {
    const initAnalytics = async () => {
      await analyticsService.initialize();
      
      // Track app launch with performance metric
      const launchDuration = Date.now() - appLaunchTime.current;
      analyticsTracker.performance.trackAppLaunch(launchDuration);
      
      // Track daily active user
      analyticsTracker.retention.trackDailyActive();
    };

    initAnalytics();
  }, []);

  // Update Sentry user context and analytics when authentication state changes
  useEffect(() => {
    if (isAuthenticated && user) {
      setSentryUser(user.id, user.username);
      
      // Set analytics user properties
      analyticsService.setUserId(user.id);
      analyticsService.setUserProperties({
        userId: user.id,
        username: user.username,
        provider: user.provider,
      });
    } else {
      clearSentryUser();
      analyticsService.reset();
    }
  }, [isAuthenticated, user]);

  // Initialize app state manager for lifecycle management
  useEffect(() => {
    appStateManager.initialize();

    // Track app state changes for retention metrics
    const handleAppStateChange = (state: string) => {
      if (state === 'active') {
        // App came to foreground
        sessionStartTime.current = Date.now();
        analyticsTracker.retention.startSession();
      } else if (state === 'background') {
        // App went to background
        analyticsTracker.retention.endSession();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
      appStateManager.cleanup();
    };
  }, []);

  // Initialize push notifications when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Initialize notification service
      notificationService.initialize().catch((error) => {
        console.error('Failed to initialize notifications:', error);
      });
    }

    return () => {
      if (isAuthenticated) {
        notificationService.cleanup();
      }
    };
  }, [isAuthenticated]);

  // Set up notification event handling
  useEffect(() => {
    if (isAuthenticated) {
      // Set navigation ref for notification tap handling
      notificationEventHandler.setNavigationRef(navigationRef.current);

      // Start listening for notification events
      notificationEventHandler.startListening();

      return () => {
        notificationEventHandler.stopListening();
      };
    }
  }, [isAuthenticated]);

  // Update notification preferences when profile changes
  useEffect(() => {
    if (profile?.preferences) {
      notificationEventHandler.setPreferences({
        notificationsEnabled: profile.preferences.notificationsEnabled,
        matchNotifications: profile.preferences.matchNotifications,
        messageNotifications: profile.preferences.messageNotifications,
      });
    }
  }, [profile?.preferences]);

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log error for monitoring (would integrate with Sentry in production)
        console.error('App Error:', error);
        console.error('Error Info:', errorInfo);
      }}
    >
      <StatusBar barStyle="light-content" />
      <NavigationContainer 
        isAuthenticated={isAuthenticated}
        navigationRef={navigationRef}
      />
    </ErrorBoundary>
  );
};

export default App;
