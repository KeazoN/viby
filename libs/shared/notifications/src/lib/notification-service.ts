/**
 * Notification Service
 * 
 * Handles push notification setup including:
 * - Permission requests
 * - Device token registration
 * - Notification channel configuration (Android)
 * - Notification handling
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { httpClient } from '@viby/shared/networking';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: Notifications.PermissionStatus;
}

export interface DeviceToken {
  token: string;
  type: 'expo' | 'fcm' | 'apns';
}

/**
 * NotificationService manages push notification setup and handling
 */
export class NotificationService {
  private deviceToken: string | null = null;
  private isInitialized = false;

  /**
   * Initialize notification service
   * - Request permissions
   * - Register device token
   * - Configure notification channels (Android)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Request permissions
      const permissionStatus = await this.requestPermissions();
      
      if (!permissionStatus.granted) {
        console.warn('Notification permissions not granted');
        return;
      }

      // Configure notification channels for Android
      if (Platform.OS === 'android') {
        await this.configureAndroidChannels();
      }

      // Register device token with backend
      await this.registerDeviceToken();

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      throw error;
    }
  }

  /**
   * Request notification permissions from the user
   */
  async requestPermissions(): Promise<NotificationPermissionStatus> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      
      let finalStatus = existingStatus;
      
      // Only ask if permissions have not already been determined
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      const canAskAgain = finalStatus === 'undetermined';
      const granted = finalStatus === 'granted';

      return {
        granted,
        canAskAgain,
        status: finalStatus,
      };
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      throw error;
    }
  }

  /**
   * Get the Expo push token for this device
   */
  async getDeviceToken(): Promise<DeviceToken> {
    try {
      // Check if running in Expo Go or standalone app
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      
      if (!projectId) {
        throw new Error('Project ID not found in app.json. Please add it to extra.eas.projectId');
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      this.deviceToken = tokenData.data;

      return {
        token: tokenData.data,
        type: 'expo',
      };
    } catch (error) {
      console.error('Error getting device token:', error);
      throw error;
    }
  }

  /**
   * Register device token with backend API
   */
  async registerDeviceToken(): Promise<void> {
    try {
      const deviceToken = await this.getDeviceToken();

      await httpClient.post('/notifications/register', {
        token: deviceToken.token,
        type: deviceToken.type,
        platform: Platform.OS,
      });

      console.log('Device token registered successfully');
    } catch (error) {
      console.error('Failed to register device token:', error);
      throw error;
    }
  }

  /**
   * Configure notification channels for Android
   * Channels allow users to control notification behavior per category
   */
  async configureAndroidChannels(): Promise<void> {
    if (Platform.OS !== 'android') {
      return;
    }

    try {
      // Match notifications channel
      await Notifications.setNotificationChannelAsync('matches', {
        name: 'Matches',
        description: 'Notifications when you match with someone',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B6B',
        enableVibrate: true,
        enableLights: true,
        showBadge: true,
      });

      // Messages notifications channel
      await Notifications.setNotificationChannelAsync('messages', {
        name: 'Messages',
        description: 'Notifications for new chat messages',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4ECDC4',
        enableVibrate: true,
        enableLights: true,
        showBadge: true,
      });

      // Game notifications channel
      await Notifications.setNotificationChannelAsync('games', {
        name: 'Games',
        description: 'Notifications for game invites and updates',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FFE66D',
        enableVibrate: true,
        enableLights: true,
        showBadge: true,
      });

      // General notifications channel
      await Notifications.setNotificationChannelAsync('general', {
        name: 'General',
        description: 'General app notifications',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });

      console.log('Android notification channels configured');
    } catch (error) {
      console.error('Failed to configure Android notification channels:', error);
      throw error;
    }
  }

  /**
   * Add a notification received listener
   */
  addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(listener);
  }

  /**
   * Add a notification response listener (when user taps notification)
   */
  addNotificationResponseListener(
    listener: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  /**
   * Get current permission status
   */
  async getPermissionStatus(): Promise<NotificationPermissionStatus> {
    const { status, canAskAgain } = await Notifications.getPermissionsAsync();
    
    return {
      granted: status === 'granted',
      canAskAgain,
      status,
    };
  }

  /**
   * Check if notifications are enabled
   */
  async areNotificationsEnabled(): Promise<boolean> {
    const { granted } = await this.getPermissionStatus();
    return granted;
  }

  /**
   * Get the current device token (if registered)
   */
  getCurrentDeviceToken(): string | null {
    return this.deviceToken;
  }

  /**
   * Cleanup notification service
   */
  cleanup(): void {
    this.deviceToken = null;
    this.isInitialized = false;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
