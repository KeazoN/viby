/**
 * Notification Event Handler
 * 
 * Handles notification events including:
 * - Displaying notifications for matches and messages
 * - Handling notification tap navigation
 * - Respecting user notification preferences
 */

import * as Notifications from 'expo-notifications';
import type { NavigationContainerRef } from '@react-navigation/native';

// Local type definition for navigation (to avoid circular dependency)
// This should match the RootStackParamList from the app
type RootStackParamList = {
  Auth: any;
  Main: any;
  Match: { matchId: string };
  Game: { roomId: string };
  Chat: { roomId: string; matchId?: string };
};

export interface NotificationData {
  type: 'match' | 'message';
  matchId?: string;
  roomId?: string;
  userId?: string;
  username?: string;
  message?: string;
}

export interface NotificationPreferences {
  notificationsEnabled: boolean;
  matchNotifications: boolean;
  messageNotifications: boolean;
}

/**
 * NotificationEventHandler manages notification display and navigation
 */
export class NotificationEventHandler {
  private navigationRef: NavigationContainerRef<RootStackParamList> | null = null;
  private notificationReceivedSubscription: Notifications.Subscription | null = null;
  private notificationResponseSubscription: Notifications.Subscription | null = null;
  private preferences: NotificationPreferences = {
    notificationsEnabled: true,
    matchNotifications: true,
    messageNotifications: true,
  };

  /**
   * Set the navigation reference for handling notification taps
   */
  setNavigationRef(ref: NavigationContainerRef<RootStackParamList> | null): void {
    this.navigationRef = ref;
  }

  /**
   * Update user notification preferences
   */
  setPreferences(preferences: NotificationPreferences): void {
    this.preferences = preferences;
  }

  /**
   * Start listening for notification events
   */
  startListening(): void {
    // Listen for notifications received while app is in foreground
    this.notificationReceivedSubscription = Notifications.addNotificationReceivedListener(
      this.handleNotificationReceived
    );

    // Listen for notification taps
    this.notificationResponseSubscription = Notifications.addNotificationResponseReceivedListener(
      this.handleNotificationResponse
    );
  }

  /**
   * Stop listening for notification events
   */
  stopListening(): void {
    this.notificationReceivedSubscription?.remove();
    this.notificationResponseSubscription?.remove();
    this.notificationReceivedSubscription = null;
    this.notificationResponseSubscription = null;
  }

  /**
   * Handle notification received while app is in foreground
   */
  private handleNotificationReceived = (notification: Notifications.Notification): void => {
    const data = notification.request.content.data as NotificationData;

    // Check if notifications are enabled globally
    if (!this.preferences.notificationsEnabled) {
      return;
    }

    // Check type-specific preferences
    if (data.type === 'match' && !this.preferences.matchNotifications) {
      return;
    }

    if (data.type === 'message' && !this.preferences.messageNotifications) {
      return;
    }

    // Notification will be displayed automatically by the notification handler
    // configured in notification-service.ts
    console.log('Notification received:', {
      type: data.type,
      title: notification.request.content.title,
    });
  };

  /**
   * Handle notification tap (when user taps a notification)
   */
  private handleNotificationResponse = (response: Notifications.NotificationResponse): void => {
    const data = response.notification.request.content.data as NotificationData;

    if (!this.navigationRef) {
      console.warn('Navigation ref not set, cannot navigate from notification');
      return;
    }

    // Navigate based on notification type
    this.navigateFromNotification(data);
  };

  /**
   * Navigate to the appropriate screen based on notification data
   */
  private navigateFromNotification(data: NotificationData): void {
    if (!this.navigationRef) {
      return;
    }

    try {
      switch (data.type) {
        case 'match':
          if (data.matchId) {
            // Navigate to Match screen
            this.navigationRef.navigate('Match', { matchId: data.matchId });
          }
          break;

        case 'message':
          if (data.roomId) {
            // Navigate to Chat screen
            this.navigationRef.navigate('Chat', {
              roomId: data.roomId,
              matchId: data.matchId,
            });
          }
          break;

        default:
          console.warn('Unknown notification type:', data.type);
      }
    } catch (error) {
      console.error('Error navigating from notification:', error);
    }
  }

  /**
   * Check if a notification should be displayed based on preferences
   */
  shouldDisplayNotification(type: 'match' | 'message'): boolean {
    if (!this.preferences.notificationsEnabled) {
      return false;
    }

    if (type === 'match' && !this.preferences.matchNotifications) {
      return false;
    }

    if (type === 'message' && !this.preferences.messageNotifications) {
      return false;
    }

    return true;
  }
}

// Export singleton instance
export const notificationEventHandler = new NotificationEventHandler();
