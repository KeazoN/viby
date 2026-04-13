/**
 * Unit tests for NotificationService
 */

import { NotificationService } from './notification-service';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { httpClient } from '@viby/shared/networking';

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

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
    jest.clearAllMocks();
  });

  describe('requestPermissions', () => {
    it('should request permissions when not already granted', async () => {
      const mockGetPermissions = jest.fn().mockResolvedValue({
        status: 'undetermined',
      });
      const mockRequestPermissions = jest.fn().mockResolvedValue({
        status: 'granted',
      });

      (Notifications.getPermissionsAsync as jest.Mock) = mockGetPermissions;
      (Notifications.requestPermissionsAsync as jest.Mock) = mockRequestPermissions;

      const result = await service.requestPermissions();

      expect(mockGetPermissions).toHaveBeenCalled();
      expect(mockRequestPermissions).toHaveBeenCalled();
      expect(result.granted).toBe(true);
      expect(result.status).toBe('granted');
    });

    it('should not request permissions when already granted', async () => {
      const mockGetPermissions = jest.fn().mockResolvedValue({
        status: 'granted',
      });
      const mockRequestPermissions = jest.fn();

      (Notifications.getPermissionsAsync as jest.Mock) = mockGetPermissions;
      (Notifications.requestPermissionsAsync as jest.Mock) = mockRequestPermissions;

      const result = await service.requestPermissions();

      expect(mockGetPermissions).toHaveBeenCalled();
      expect(mockRequestPermissions).not.toHaveBeenCalled();
      expect(result.granted).toBe(true);
    });

    it('should return canAskAgain when status is undetermined', async () => {
      const mockGetPermissions = jest.fn().mockResolvedValue({
        status: 'undetermined',
      });
      const mockRequestPermissions = jest.fn().mockResolvedValue({
        status: 'undetermined',
      });

      (Notifications.getPermissionsAsync as jest.Mock) = mockGetPermissions;
      (Notifications.requestPermissionsAsync as jest.Mock) = mockRequestPermissions;

      const result = await service.requestPermissions();

      expect(result.canAskAgain).toBe(true);
      expect(result.granted).toBe(false);
    });
  });

  describe('getDeviceToken', () => {
    it('should get Expo push token', async () => {
      const mockToken = 'ExponentPushToken[test-token-123]';
      const mockGetExpoPushToken = jest.fn().mockResolvedValue({
        data: mockToken,
      });

      (Notifications.getExpoPushTokenAsync as jest.Mock) = mockGetExpoPushToken;

      const result = await service.getDeviceToken();

      expect(mockGetExpoPushToken).toHaveBeenCalledWith({
        projectId: 'test-project-id',
      });
      expect(result.token).toBe(mockToken);
      expect(result.type).toBe('expo');
    });
  });

  describe('registerDeviceToken', () => {
    it('should register device token with backend', async () => {
      const mockToken = 'ExponentPushToken[test-token-123]';
      const mockGetExpoPushToken = jest.fn().mockResolvedValue({
        data: mockToken,
      });
      const mockPost = jest.fn().mockResolvedValue({});

      (Notifications.getExpoPushTokenAsync as jest.Mock) = mockGetExpoPushToken;
      (httpClient.post as jest.Mock) = mockPost;

      await service.registerDeviceToken();

      expect(mockPost).toHaveBeenCalledWith('/notifications/register', {
        token: mockToken,
        type: 'expo',
        platform: 'ios',
      });
    });

    it('should handle registration errors', async () => {
      const mockGetExpoPushToken = jest.fn().mockResolvedValue({
        data: 'test-token',
      });
      const mockPost = jest.fn().mockRejectedValue(new Error('Network error'));

      (Notifications.getExpoPushTokenAsync as jest.Mock) = mockGetExpoPushToken;
      (httpClient.post as jest.Mock) = mockPost;

      await expect(service.registerDeviceToken()).rejects.toThrow('Network error');
    });
  });

  describe('configureAndroidChannels', () => {
    it('should configure notification channels on Android', async () => {
      // Mock Android platform
      (Platform.OS as any) = 'android';

      const mockSetChannel = jest.fn().mockResolvedValue(undefined);
      (Notifications.setNotificationChannelAsync as jest.Mock) = mockSetChannel;

      await service.configureAndroidChannels();

      // Should create 4 channels: matches, messages, games, general
      expect(mockSetChannel).toHaveBeenCalledTimes(4);
      expect(mockSetChannel).toHaveBeenCalledWith('matches', expect.any(Object));
      expect(mockSetChannel).toHaveBeenCalledWith('messages', expect.any(Object));
      expect(mockSetChannel).toHaveBeenCalledWith('games', expect.any(Object));
      expect(mockSetChannel).toHaveBeenCalledWith('general', expect.any(Object));
    });

    it('should not configure channels on iOS', async () => {
      // Mock iOS platform
      (Platform.OS as any) = 'ios';

      const mockSetChannel = jest.fn();
      (Notifications.setNotificationChannelAsync as jest.Mock) = mockSetChannel;

      await service.configureAndroidChannels();

      expect(mockSetChannel).not.toHaveBeenCalled();
    });
  });

  describe('initialize', () => {
    it('should initialize notification service successfully', async () => {
      const mockGetPermissions = jest.fn().mockResolvedValue({
        status: 'undetermined',
      });
      const mockRequestPermissions = jest.fn().mockResolvedValue({
        status: 'granted',
      });
      const mockGetExpoPushToken = jest.fn().mockResolvedValue({
        data: 'test-token',
      });
      const mockPost = jest.fn().mockResolvedValue({});

      (Notifications.getPermissionsAsync as jest.Mock) = mockGetPermissions;
      (Notifications.requestPermissionsAsync as jest.Mock) = mockRequestPermissions;
      (Notifications.getExpoPushTokenAsync as jest.Mock) = mockGetExpoPushToken;
      (httpClient.post as jest.Mock) = mockPost;

      await service.initialize();

      expect(mockRequestPermissions).toHaveBeenCalled();
      expect(mockGetExpoPushToken).toHaveBeenCalled();
      expect(mockPost).toHaveBeenCalled();
    });

    it('should not initialize twice', async () => {
      const mockGetPermissions = jest.fn().mockResolvedValue({
        status: 'granted',
      });
      const mockGetExpoPushToken = jest.fn().mockResolvedValue({
        data: 'test-token',
      });
      const mockPost = jest.fn().mockResolvedValue({});

      (Notifications.getPermissionsAsync as jest.Mock) = mockGetPermissions;
      (Notifications.getExpoPushTokenAsync as jest.Mock) = mockGetExpoPushToken;
      (httpClient.post as jest.Mock) = mockPost;

      await service.initialize();
      await service.initialize();

      // Should only be called once
      expect(mockPost).toHaveBeenCalledTimes(1);
    });

    it('should not register token when permissions denied', async () => {
      const mockGetPermissions = jest.fn().mockResolvedValue({
        status: 'denied',
      });
      const mockRequestPermissions = jest.fn().mockResolvedValue({
        status: 'denied',
      });
      const mockPost = jest.fn();

      (Notifications.getPermissionsAsync as jest.Mock) = mockGetPermissions;
      (Notifications.requestPermissionsAsync as jest.Mock) = mockRequestPermissions;
      (httpClient.post as jest.Mock) = mockPost;

      await service.initialize();

      expect(mockPost).not.toHaveBeenCalled();
    });
  });

  describe('getPermissionStatus', () => {
    it('should return current permission status', async () => {
      const mockGetPermissions = jest.fn().mockResolvedValue({
        status: 'granted',
        canAskAgain: false,
      });

      (Notifications.getPermissionsAsync as jest.Mock) = mockGetPermissions;

      const result = await service.getPermissionStatus();

      expect(result.granted).toBe(true);
      expect(result.canAskAgain).toBe(false);
      expect(result.status).toBe('granted');
    });
  });

  describe('areNotificationsEnabled', () => {
    it('should return true when permissions granted', async () => {
      const mockGetPermissions = jest.fn().mockResolvedValue({
        status: 'granted',
        canAskAgain: false,
      });

      (Notifications.getPermissionsAsync as jest.Mock) = mockGetPermissions;

      const result = await service.areNotificationsEnabled();

      expect(result).toBe(true);
    });

    it('should return false when permissions denied', async () => {
      const mockGetPermissions = jest.fn().mockResolvedValue({
        status: 'denied',
        canAskAgain: false,
      });

      (Notifications.getPermissionsAsync as jest.Mock) = mockGetPermissions;

      const result = await service.areNotificationsEnabled();

      expect(result).toBe(false);
    });
  });

  describe('addNotificationReceivedListener', () => {
    it('should add notification received listener', () => {
      const mockListener = jest.fn();
      const mockSubscription = { remove: jest.fn() };
      const mockAddListener = jest.fn().mockReturnValue(mockSubscription);

      (Notifications.addNotificationReceivedListener as jest.Mock) = mockAddListener;

      const subscription = service.addNotificationReceivedListener(mockListener);

      expect(mockAddListener).toHaveBeenCalledWith(mockListener);
      expect(subscription).toBe(mockSubscription);
    });
  });

  describe('addNotificationResponseListener', () => {
    it('should add notification response listener', () => {
      const mockListener = jest.fn();
      const mockSubscription = { remove: jest.fn() };
      const mockAddListener = jest.fn().mockReturnValue(mockSubscription);

      (Notifications.addNotificationResponseReceivedListener as jest.Mock) = mockAddListener;

      const subscription = service.addNotificationResponseListener(mockListener);

      expect(mockAddListener).toHaveBeenCalledWith(mockListener);
      expect(subscription).toBe(mockSubscription);
    });
  });

  describe('cleanup', () => {
    it('should cleanup notification service', async () => {
      const mockGetPermissions = jest.fn().mockResolvedValue({
        status: 'granted',
      });
      const mockGetExpoPushToken = jest.fn().mockResolvedValue({
        data: 'test-token',
      });
      const mockPost = jest.fn().mockResolvedValue({});

      (Notifications.getPermissionsAsync as jest.Mock) = mockGetPermissions;
      (Notifications.getExpoPushTokenAsync as jest.Mock) = mockGetExpoPushToken;
      (httpClient.post as jest.Mock) = mockPost;

      await service.initialize();
      expect(service.getCurrentDeviceToken()).toBe('test-token');

      service.cleanup();

      expect(service.getCurrentDeviceToken()).toBeNull();
    });
  });
});
