/**
 * Notification Event Handler Tests
 */

import * as Notifications from 'expo-notifications';
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

// Mock expo-notifications
jest.mock('expo-notifications');

describe('NotificationEventHandler', () => {
  let handler: NotificationEventHandler;
  let mockNavigationRef: jest.Mocked<NavigationContainerRef<RootStackParamList>>;
  let mockSubscription: { remove: jest.Mock };

  beforeEach(() => {
    handler = new NotificationEventHandler();
    
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('setNavigationRef', () => {
    it('should set navigation reference', () => {
      handler.setNavigationRef(mockNavigationRef);
      
      // Verify by testing navigation works
      handler.startListening();
      const mockResponse = {
        notification: {
          request: {
            content: {
              data: {
                type: 'match',
                matchId: 'match-123',
              },
            },
          },
        },
      } as Notifications.NotificationResponse;

      const responseListener = (Notifications.addNotificationResponseReceivedListener as jest.Mock).mock.calls[0][0];
      responseListener(mockResponse);

      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('Match', { matchId: 'match-123' });
    });

    it('should allow clearing navigation reference', () => {
      handler.setNavigationRef(mockNavigationRef);
      handler.setNavigationRef(null);

      handler.startListening();
      const mockResponse = {
        notification: {
          request: {
            content: {
              data: {
                type: 'match',
                matchId: 'match-123',
              },
            },
          },
        },
      } as Notifications.NotificationResponse;

      const responseListener = (Notifications.addNotificationResponseReceivedListener as jest.Mock).mock.calls[0][0];
      responseListener(mockResponse);

      expect(mockNavigationRef.navigate).not.toHaveBeenCalled();
    });
  });

  describe('setPreferences', () => {
    it('should update notification preferences', () => {
      const preferences = {
        notificationsEnabled: false,
        matchNotifications: true,
        messageNotifications: false,
      };

      handler.setPreferences(preferences);

      expect(handler.shouldDisplayNotification('match')).toBe(false);
      expect(handler.shouldDisplayNotification('message')).toBe(false);
    });
  });

  describe('startListening', () => {
    it('should add notification received listener', () => {
      handler.startListening();

      expect(Notifications.addNotificationReceivedListener).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });

    it('should add notification response listener', () => {
      handler.startListening();

      expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });
  });

  describe('stopListening', () => {
    it('should remove notification listeners', () => {
      handler.startListening();
      handler.stopListening();

      expect(mockSubscription.remove).toHaveBeenCalledTimes(2);
    });

    it('should handle stopping when not listening', () => {
      expect(() => handler.stopListening()).not.toThrow();
    });
  });

  describe('handleNotificationReceived', () => {
    it('should handle match notification when preferences allow', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      handler.setPreferences({
        notificationsEnabled: true,
        matchNotifications: true,
        messageNotifications: true,
      });

      handler.startListening();

      const mockNotification = {
        request: {
          content: {
            title: 'New Match!',
            data: {
              type: 'match',
              matchId: 'match-123',
              username: 'testuser',
            },
          },
        },
      } as Notifications.Notification;

      const receivedListener = (Notifications.addNotificationReceivedListener as jest.Mock).mock.calls[0][0];
      receivedListener(mockNotification);

      expect(consoleSpy).toHaveBeenCalledWith('Notification received:', {
        type: 'match',
        title: 'New Match!',
      });

      consoleSpy.mockRestore();
    });

    it('should not handle match notification when match notifications disabled', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      handler.setPreferences({
        notificationsEnabled: true,
        matchNotifications: false,
        messageNotifications: true,
      });

      handler.startListening();

      const mockNotification = {
        request: {
          content: {
            title: 'New Match!',
            data: {
              type: 'match',
              matchId: 'match-123',
            },
          },
        },
      } as Notifications.Notification;

      const receivedListener = (Notifications.addNotificationReceivedListener as jest.Mock).mock.calls[0][0];
      receivedListener(mockNotification);

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should not handle message notification when message notifications disabled', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      handler.setPreferences({
        notificationsEnabled: true,
        matchNotifications: true,
        messageNotifications: false,
      });

      handler.startListening();

      const mockNotification = {
        request: {
          content: {
            title: 'New Message',
            data: {
              type: 'message',
              roomId: 'room-123',
            },
          },
        },
      } as Notifications.Notification;

      const receivedListener = (Notifications.addNotificationReceivedListener as jest.Mock).mock.calls[0][0];
      receivedListener(mockNotification);

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should not handle any notification when notifications globally disabled', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      handler.setPreferences({
        notificationsEnabled: false,
        matchNotifications: true,
        messageNotifications: true,
      });

      handler.startListening();

      const mockNotification = {
        request: {
          content: {
            title: 'New Match!',
            data: {
              type: 'match',
              matchId: 'match-123',
            },
          },
        },
      } as Notifications.Notification;

      const receivedListener = (Notifications.addNotificationReceivedListener as jest.Mock).mock.calls[0][0];
      receivedListener(mockNotification);

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('handleNotificationResponse', () => {
    beforeEach(() => {
      handler.setNavigationRef(mockNavigationRef);
      handler.startListening();
    });

    it('should navigate to Match screen when match notification tapped', () => {
      const mockResponse = {
        notification: {
          request: {
            content: {
              data: {
                type: 'match',
                matchId: 'match-123',
              },
            },
          },
        },
      } as Notifications.NotificationResponse;

      const responseListener = (Notifications.addNotificationResponseReceivedListener as jest.Mock).mock.calls[0][0];
      responseListener(mockResponse);

      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('Match', {
        matchId: 'match-123',
      });
    });

    it('should navigate to Chat screen when message notification tapped', () => {
      const mockResponse = {
        notification: {
          request: {
            content: {
              data: {
                type: 'message',
                roomId: 'room-123',
                matchId: 'match-123',
              },
            },
          },
        },
      } as Notifications.NotificationResponse;

      const responseListener = (Notifications.addNotificationResponseReceivedListener as jest.Mock).mock.calls[0][0];
      responseListener(mockResponse);

      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('Chat', {
        roomId: 'room-123',
        matchId: 'match-123',
      });
    });

    it('should not navigate when navigation ref is not set', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      handler.setNavigationRef(null);

      const mockResponse = {
        notification: {
          request: {
            content: {
              data: {
                type: 'match',
                matchId: 'match-123',
              },
            },
          },
        },
      } as Notifications.NotificationResponse;

      const responseListener = (Notifications.addNotificationResponseReceivedListener as jest.Mock).mock.calls[0][0];
      responseListener(mockResponse);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Navigation ref not set, cannot navigate from notification'
      );
      expect(mockNavigationRef.navigate).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should not navigate when matchId is missing for match notification', () => {
      const mockResponse = {
        notification: {
          request: {
            content: {
              data: {
                type: 'match',
              },
            },
          },
        },
      } as Notifications.NotificationResponse;

      const responseListener = (Notifications.addNotificationResponseReceivedListener as jest.Mock).mock.calls[0][0];
      responseListener(mockResponse);

      expect(mockNavigationRef.navigate).not.toHaveBeenCalled();
    });

    it('should not navigate when roomId is missing for message notification', () => {
      const mockResponse = {
        notification: {
          request: {
            content: {
              data: {
                type: 'message',
              },
            },
          },
        },
      } as Notifications.NotificationResponse;

      const responseListener = (Notifications.addNotificationResponseReceivedListener as jest.Mock).mock.calls[0][0];
      responseListener(mockResponse);

      expect(mockNavigationRef.navigate).not.toHaveBeenCalled();
    });

    it('should handle unknown notification type', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const mockResponse = {
        notification: {
          request: {
            content: {
              data: {
                type: 'unknown',
              },
            },
          },
        },
      } as Notifications.NotificationResponse;

      const responseListener = (Notifications.addNotificationResponseReceivedListener as jest.Mock).mock.calls[0][0];
      responseListener(mockResponse);

      expect(consoleSpy).toHaveBeenCalledWith('Unknown notification type:', 'unknown');
      expect(mockNavigationRef.navigate).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle navigation errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Navigation failed');
      mockNavigationRef.navigate.mockImplementation(() => {
        throw error;
      });

      const mockResponse = {
        notification: {
          request: {
            content: {
              data: {
                type: 'match',
                matchId: 'match-123',
              },
            },
          },
        },
      } as Notifications.NotificationResponse;

      const responseListener = (Notifications.addNotificationResponseReceivedListener as jest.Mock).mock.calls[0][0];
      
      expect(() => responseListener(mockResponse)).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith('Error navigating from notification:', error);

      consoleSpy.mockRestore();
    });
  });

  describe('shouldDisplayNotification', () => {
    it('should return true when all preferences allow match notifications', () => {
      handler.setPreferences({
        notificationsEnabled: true,
        matchNotifications: true,
        messageNotifications: true,
      });

      expect(handler.shouldDisplayNotification('match')).toBe(true);
    });

    it('should return true when all preferences allow message notifications', () => {
      handler.setPreferences({
        notificationsEnabled: true,
        matchNotifications: true,
        messageNotifications: true,
      });

      expect(handler.shouldDisplayNotification('message')).toBe(true);
    });

    it('should return false when notifications globally disabled', () => {
      handler.setPreferences({
        notificationsEnabled: false,
        matchNotifications: true,
        messageNotifications: true,
      });

      expect(handler.shouldDisplayNotification('match')).toBe(false);
      expect(handler.shouldDisplayNotification('message')).toBe(false);
    });

    it('should return false when match notifications disabled', () => {
      handler.setPreferences({
        notificationsEnabled: true,
        matchNotifications: false,
        messageNotifications: true,
      });

      expect(handler.shouldDisplayNotification('match')).toBe(false);
      expect(handler.shouldDisplayNotification('message')).toBe(true);
    });

    it('should return false when message notifications disabled', () => {
      handler.setPreferences({
        notificationsEnabled: true,
        matchNotifications: true,
        messageNotifications: false,
      });

      expect(handler.shouldDisplayNotification('match')).toBe(true);
      expect(handler.shouldDisplayNotification('message')).toBe(false);
    });
  });
});
