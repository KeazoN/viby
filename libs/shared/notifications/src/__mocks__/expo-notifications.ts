/**
 * Mock for expo-notifications
 */

export const getPermissionsAsync = jest.fn();
export const requestPermissionsAsync = jest.fn();
export const getExpoPushTokenAsync = jest.fn();
export const setNotificationChannelAsync = jest.fn();
export const addNotificationReceivedListener = jest.fn(() => ({
  remove: jest.fn(),
}));
export const addNotificationResponseReceivedListener = jest.fn(() => ({
  remove: jest.fn(),
}));
export const setNotificationHandler = jest.fn();

export const AndroidImportance = {
  MIN: 1,
  LOW: 2,
  DEFAULT: 3,
  HIGH: 4,
  MAX: 5,
};

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface Notification {
  request: {
    content: {
      title: string;
      body: string;
      data: any;
    };
  };
}

export interface NotificationResponse {
  notification: Notification;
  actionIdentifier: string;
}

export interface Subscription {
  remove: () => void;
}
