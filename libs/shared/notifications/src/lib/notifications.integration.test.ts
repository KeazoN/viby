/**
 * Integration Tests for Notification System
 * 
 * Tests the end-to-end notification flow including:
 * - Notification display for matches and messages
 * - Notification navigation to relevant screens
 * 
 * **Validates: Requirements 13.3, 13.4, 13.5**
 */

import * as Notifications from 'expo-notifications';
import { NotificationService } from './notification-service';
import { NotificationEventHandler } from './notification-event-handler';
import type { NavigationContainerRef } from '@react-navigation/native';

// Local type definition for navigation (to avoid circular dependency)
type RootStackParamList = {
  Auth: any;
  Main: any;
  Match: { matchId: string };
  Game: { roomId: string };
  Chat: { roomId: string; matchId?: string };
};

// Mock dependencies
jest.mock('expo-notifications');
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}));
jest.mock('@viby/shared/networking', () => ({
  httpClient: {
    post: jest.fn(),
  },
}));
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        eas: {
          projectId: 'test-project-id',
        },
      },
    },
  },
}));

describe('Notification System Integration', () => {
  let notificationService: NotificationService;
  let notificationEventHandler: NotificationEventHandler;
  let mockNavigationRef: jest.Mocked<NavigationContainerRef<RootStackParamList>>;
  let mockSubscription: { remove: jest.Mock };

  beforeEach(() => {
    notificationService = new NotificationService();
    notificationEventHandler = new NotificationEventHandler();

    mockNavigationRef = {
      navigate: jest.fn(),
      reset: jest.fn(),
      goBack: jest.fn(),
      dispatch: jest.fn(),
      canGoBack: jest.fn(),
      getRootState: jest.fn(),
      getState: jest.fn(),
      getCurrentRoute: jest.fn(),
      getCurrentOptions: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      resetRoot: jest.fn(),
      setParams: jest.fn(),
      isReady: jest.fn(),
    } as any;

    mockSubscription = {
      remove: jest.fn(),
    };

    (Notifications.addNotificationReceivedListener as jest.Mock).mockReturnValue(mockSubscription);
    (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockReturnValue(mockSubscription);

    jest.clearAllMocks();
  });

  describe('Requirement 13.3: Match Notification Display', () => {
    it('should display push notification when a match is found with matched user name', async () => {
      // Setup: Initialize notification service and event handler
      const mockGetPermissions = jest.fn().mockResolvedValue({
        status: 'granted',
        canAskAgain: false,
      });
      const mockGetExpoPushToken = jest.fn().mockResolvedValue({
        data: 'test-token',
      });

      (Notifications.getPermissionsAsync as jest.Mock) = mockGetPermissions;
      (Notifications.getExpoPushTokenAsync as jest.Mock) = mockGetExpoPushToken;

      await notificationService.initialize();

      notificationEventHandler.setNavigationRef(mockNavigationRef);
      notificationEventHandler.setPreferences({
        notificationsEnabled: true,
        matchNotifications: true,
        messageNotifications: true,
      });
      notificationEventHandler.startListening();

      // Simulate receiving a match notification
      const matchNotification = {
        date: Date.now(),
        request: {
          identifier: 'match-notif-1',
          content: {
            title: 'New Match!',
            body: "You matched with Sarah! You're both listening to Bohemian Rhapsody",
            data: {
              type: 'match',
              matchId: 'match-123',
              userId: 'user-456',
              username: 'Sarah',
            },
          },
          trigger: null,
        },
      } as unknown as Notifications.Notification;

      const receivedListener = (Notifications.addNotificationReceivedListener as jest.Mock).mock.calls[0][0];
      
      // Verify notification is processed
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      receivedListener(matchNotification);

      expect(consoleSpy).toHaveBeenCalledWith('Notification received:', {
        type: 'match',
        title: 'New Match!',
      });

      consoleSpy.mockRestore();
    });

    it('should not display match notification when match notifications are disabled', async () => {
      notificationEventHandler.setPreferences({
        notificationsEnabled: true,
        matchNotifications: false,
        messageNotifications: true,
      });
      notificationEventHandler.startListening();

      const matchNotification = {
        date: Date.now(),
        request: {
          identifier: 'match-notif-2',
          content: {
            title: 'New Match!',
            body: "You matched with John!",
            data: {
              type: 'match',
              matchId: 'match-456',
              username: 'John',
            },
          },
          trigger: null,
        },
      } as unknown as Notifications.Notification;

      const receivedListener = (Notifications.addNotificationReceivedListener as jest.Mock).mock.calls[0][0];
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      receivedListener(matchNotification);

      // Should not log notification received
      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Requirement 13.4: Message Notification Display', () => {
    it('should display push notification when a message is received while app is in background', async () => {
      // Setup
      notificationEventHandler.setNavigationRef(mockNavigationRef);
      notificationEventHandler.setPreferences({
        notificationsEnabled: true,
        matchNotifications: true,
        messageNotifications: true,
      });
      notificationEventHandler.startListening();

      // Simulate receiving a message notification
      const messageNotification = {
        date: Date.now(),
        request: {
          identifier: 'message-notif-1',
          content: {
            title: 'New Message from Sarah',
            body: 'Hey! Love this song!',
            data: {
              type: 'message',
              roomId: 'room-123',
              matchId: 'match-123',
              userId: 'user-456',
              message: 'Hey! Love this song!',
            },
          },
          trigger: null,
        },
      } as unknown as Notifications.Notification;

      const receivedListener = (Notifications.addNotificationReceivedListener as jest.Mock).mock.calls[0][0];
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      receivedListener(messageNotification);

      expect(consoleSpy).toHaveBeenCalledWith('Notification received:', {
        type: 'message',
        title: 'New Message from Sarah',
      });

      consoleSpy.mockRestore();
    });

    it('should not display message notification when message notifications are disabled', async () => {
      notificationEventHandler.setPreferences({
        notificationsEnabled: true,
        matchNotifications: true,
        messageNotifications: false,
      });
      notificationEventHandler.startListening();

      const messageNotification = {
        date: Date.now(),
        request: {
          identifier: 'message-notif-2',
          content: {
            title: 'New Message',
            body: 'Test message',
            data: {
              type: 'message',
              roomId: 'room-456',
              message: 'Test message',
            },
          },
          trigger: null,
        },
      } as unknown as Notifications.Notification;

      const receivedListener = (Notifications.addNotificationReceivedListener as jest.Mock).mock.calls[0][0];
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      receivedListener(messageNotification);

      // Should not log notification received
      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should not display any notifications when globally disabled', async () => {
      notificationEventHandler.setPreferences({
        notificationsEnabled: false,
        matchNotifications: true,
        messageNotifications: true,
      });
      notificationEventHandler.startListening();

      const messageNotification = {
        date: Date.now(),
        request: {
          identifier: 'message-notif-3',
          content: {
            title: 'New Message',
            body: 'Test',
            data: {
              type: 'message',
              roomId: 'room-789',
            },
          },
          trigger: null,
        },
      } as unknown as Notifications.Notification;

      const receivedListener = (Notifications.addNotificationReceivedListener as jest.Mock).mock.calls[0][0];
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      receivedListener(messageNotification);

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Requirement 13.5: Notification Navigation', () => {
    beforeEach(() => {
      notificationEventHandler.setNavigationRef(mockNavigationRef);
      notificationEventHandler.setPreferences({
        notificationsEnabled: true,
        matchNotifications: true,
        messageNotifications: true,
      });
      notificationEventHandler.startListening();
    });

    it('should navigate to Match screen when user taps match notification', () => {
      const matchResponse = {
        notification: {
          date: Date.now(),
          request: {
            identifier: 'match-notif-1',
            content: {
              title: 'New Match!',
              body: 'You matched with Sarah!',
              data: {
                type: 'match',
                matchId: 'match-123',
                username: 'Sarah',
              },
            },
            trigger: null,
          },
        },
        actionIdentifier: Notifications.DEFAULT_ACTION_IDENTIFIER,
      } as unknown as Notifications.NotificationResponse;

      const responseListener = (Notifications.addNotificationResponseReceivedListener as jest.Mock).mock.calls[0][0];
      responseListener(matchResponse);

      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('Match', {
        matchId: 'match-123',
      });
    });

    it('should navigate to Chat screen when user taps message notification', () => {
      const messageResponse = {
        notification: {
          date: Date.now(),
          request: {
            identifier: 'message-notif-1',
            content: {
              title: 'New Message',
              body: 'Hey!',
              data: {
                type: 'message',
                roomId: 'room-123',
                matchId: 'match-123',
              },
            },
            trigger: null,
          },
        },
        actionIdentifier: Notifications.DEFAULT_ACTION_IDENTIFIER,
      } as unknown as Notifications.NotificationResponse;

      const responseListener = (Notifications.addNotificationResponseReceivedListener as jest.Mock).mock.calls[0][0];
      responseListener(messageResponse);

      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('Chat', {
        roomId: 'room-123',
        matchId: 'match-123',
      });
    });

    it('should navigate to Chat screen without matchId when not provided', () => {
      const messageResponse = {
        notification: {
          date: Date.now(),
          request: {
            identifier: 'message-notif-2',
            content: {
              title: 'New Message',
              body: 'Hello!',
              data: {
                type: 'message',
                roomId: 'room-456',
              },
            },
            trigger: null,
          },
        },
        actionIdentifier: Notifications.DEFAULT_ACTION_IDENTIFIER,
      } as unknown as Notifications.NotificationResponse;

      const responseListener = (Notifications.addNotificationResponseReceivedListener as jest.Mock).mock.calls[0][0];
      responseListener(messageResponse);

      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('Chat', {
        roomId: 'room-456',
        matchId: undefined,
      });
    });

    it('should not navigate when matchId is missing for match notification', () => {
      const matchResponse = {
        notification: {
          date: Date.now(),
          request: {
            identifier: 'match-notif-2',
            content: {
              title: 'New Match!',
              body: 'You have a new match!',
              data: {
                type: 'match',
              },
            },
            trigger: null,
          },
        },
        actionIdentifier: Notifications.DEFAULT_ACTION_IDENTIFIER,
      } as unknown as Notifications.NotificationResponse;

      const responseListener = (Notifications.addNotificationResponseReceivedListener as jest.Mock).mock.calls[0][0];
      responseListener(matchResponse);

      expect(mockNavigationRef.navigate).not.toHaveBeenCalled();
    });

    it('should not navigate when roomId is missing for message notification', () => {
      const messageResponse = {
        notification: {
          date: Date.now(),
          request: {
            identifier: 'message-notif-3',
            content: {
              title: 'New Message',
              body: 'Message content',
              data: {
                type: 'message',
              },
            },
            trigger: null,
          },
        },
        actionIdentifier: Notifications.DEFAULT_ACTION_IDENTIFIER,
      } as unknown as Notifications.NotificationResponse;

      const responseListener = (Notifications.addNotificationResponseReceivedListener as jest.Mock).mock.calls[0][0];
      responseListener(messageResponse);

      expect(mockNavigationRef.navigate).not.toHaveBeenCalled();
    });

    it('should handle navigation errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Navigation failed');
      mockNavigationRef.navigate.mockImplementation(() => {
        throw error;
      });

      const matchResponse = {
        notification: {
          date: Date.now(),
          request: {
            identifier: 'match-notif-3',
            content: {
              title: 'New Match!',
              body: 'Match found',
              data: {
                type: 'match',
                matchId: 'match-789',
              },
            },
            trigger: null,
          },
        },
        actionIdentifier: Notifications.DEFAULT_ACTION_IDENTIFIER,
      } as unknown as Notifications.NotificationResponse;

      const responseListener = (Notifications.addNotificationResponseReceivedListener as jest.Mock).mock.calls[0][0];
      
      expect(() => responseListener(matchResponse)).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith('Error navigating from notification:', error);

      consoleSpy.mockRestore();
    });
  });

  describe('End-to-End Notification Flow', () => {
    it('should handle complete notification flow from initialization to navigation', async () => {
      // Step 1: Initialize notification service
      const mockGetPermissions = jest.fn().mockResolvedValue({
        status: 'undetermined',
      });
      const mockRequestPermissions = jest.fn().mockResolvedValue({
        status: 'granted',
      });
      const mockGetExpoPushToken = jest.fn().mockResolvedValue({
        data: 'ExponentPushToken[test-123]',
      });
      const mockPost = jest.fn().mockResolvedValue({});

      (Notifications.getPermissionsAsync as jest.Mock) = mockGetPermissions;
      (Notifications.requestPermissionsAsync as jest.Mock) = mockRequestPermissions;
      (Notifications.getExpoPushTokenAsync as jest.Mock) = mockGetExpoPushToken;
      const { httpClient } = require('@viby/shared/networking');
      httpClient.post = mockPost;

      await notificationService.initialize();

      expect(mockRequestPermissions).toHaveBeenCalled();
      expect(mockGetExpoPushToken).toHaveBeenCalled();
      expect(mockPost).toHaveBeenCalledWith('/notifications/register', {
        token: 'ExponentPushToken[test-123]',
        type: 'expo',
        platform: 'ios',
      });

      // Step 2: Setup event handler
      notificationEventHandler.setNavigationRef(mockNavigationRef);
      notificationEventHandler.setPreferences({
        notificationsEnabled: true,
        matchNotifications: true,
        messageNotifications: true,
      });
      notificationEventHandler.startListening();

      // Step 3: Receive notification
      const matchNotification = {
        date: Date.now(),
        request: {
          identifier: 'match-notif-e2e',
          content: {
            title: 'New Match!',
            body: 'You matched with Alex!',
            data: {
              type: 'match',
              matchId: 'match-e2e-123',
              username: 'Alex',
            },
          },
          trigger: null,
        },
      } as unknown as Notifications.Notification;

      const receivedListener = (Notifications.addNotificationReceivedListener as jest.Mock).mock.calls[0][0];
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      receivedListener(matchNotification);

      expect(consoleSpy).toHaveBeenCalledWith('Notification received:', {
        type: 'match',
        title: 'New Match!',
      });

      // Step 4: User taps notification
      const matchResponse = {
        notification: matchNotification,
        actionIdentifier: Notifications.DEFAULT_ACTION_IDENTIFIER,
      } as unknown as Notifications.NotificationResponse;

      const responseListener = (Notifications.addNotificationResponseReceivedListener as jest.Mock).mock.calls[0][0];
      responseListener(matchResponse);

      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('Match', {
        matchId: 'match-e2e-123',
      });

      consoleSpy.mockRestore();
    });

    it('should handle notification flow when navigation ref is not set', async () => {
      // Initialize without setting navigation ref
      notificationEventHandler.setPreferences({
        notificationsEnabled: true,
        matchNotifications: true,
        messageNotifications: true,
      });
      notificationEventHandler.startListening();

      const matchResponse = {
        notification: {
          date: Date.now(),
          request: {
            identifier: 'match-notif-no-nav',
            content: {
              title: 'New Match!',
              body: 'Match found',
              data: {
                type: 'match',
                matchId: 'match-no-nav',
              },
            },
            trigger: null,
          },
        },
        actionIdentifier: Notifications.DEFAULT_ACTION_IDENTIFIER,
      } as unknown as Notifications.NotificationResponse;

      const responseListener = (Notifications.addNotificationResponseReceivedListener as jest.Mock).mock.calls[0][0];
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      responseListener(matchResponse);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Navigation ref not set, cannot navigate from notification'
      );
      expect(mockNavigationRef.navigate).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Notification Cleanup', () => {
    it('should properly cleanup notification listeners', () => {
      notificationEventHandler.startListening();
      notificationEventHandler.stopListening();

      expect(mockSubscription.remove).toHaveBeenCalledTimes(2);
    });

    it('should cleanup notification service state', async () => {
      const mockGetPermissions = jest.fn().mockResolvedValue({
        status: 'granted',
      });
      const mockGetExpoPushToken = jest.fn().mockResolvedValue({
        data: 'test-token',
      });
      const mockPost = jest.fn().mockResolvedValue({});

      (Notifications.getPermissionsAsync as jest.Mock) = mockGetPermissions;
      (Notifications.getExpoPushTokenAsync as jest.Mock) = mockGetExpoPushToken;
      const { httpClient } = require('@viby/shared/networking');
      httpClient.post = mockPost;

      await notificationService.initialize();
      expect(notificationService.getCurrentDeviceToken()).toBe('test-token');

      notificationService.cleanup();
      expect(notificationService.getCurrentDeviceToken()).toBeNull();
    });
  });
});
