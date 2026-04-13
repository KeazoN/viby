# Shared Notifications Library

Push notification functionality for the Viby mobile app using Expo Notifications.

## Features

- **Permission Management**: Request and check notification permissions
- **Device Token Registration**: Register device tokens with backend API
- **Android Notification Channels**: Configure notification channels for different types
- **Notification Handling**: Listen for incoming notifications and user responses
- **Event Handling**: Display notifications for matches and messages with navigation
- **Preference Management**: Respect user notification preferences from profile settings

## Installation

The library is already configured in the monorepo. To use it:

```typescript
import { notificationService, notificationEventHandler } from '@viby/shared/notifications';
```

## Usage

### Initialize Notifications

Initialize the notification service when the app launches (typically in App.tsx):

```typescript
import { notificationService } from '@viby/shared/notifications';

// Initialize when user is authenticated
useEffect(() => {
  if (isAuthenticated) {
    notificationService.initialize().catch((error) => {
      console.error('Failed to initialize notifications:', error);
    });
  }

  return () => {
    notificationService.cleanup();
  };
}, [isAuthenticated]);
```

### Request Permissions

```typescript
const permissionStatus = await notificationService.requestPermissions();

if (permissionStatus.granted) {
  console.log('Notifications enabled');
} else if (permissionStatus.canAskAgain) {
  console.log('User can be asked again');
} else {
  console.log('Permissions denied');
}
```

### Check Permission Status

```typescript
const isEnabled = await notificationService.areNotificationsEnabled();

if (isEnabled) {
  console.log('Notifications are enabled');
}
```

### Get Device Token

```typescript
const deviceToken = await notificationService.getDeviceToken();
console.log('Device token:', deviceToken.token);
console.log('Token type:', deviceToken.type); // 'expo'
```

### Listen for Notifications

```typescript
// Listen for notifications received while app is in foreground
const subscription = notificationService.addNotificationReceivedListener(
  (notification) => {
    console.log('Notification received:', notification);
  }
);

// Clean up
subscription.remove();
```

### Handle Notification Taps

```typescript
// Listen for notification taps (when user taps a notification)
const subscription = notificationService.addNotificationResponseListener(
  (response) => {
    console.log('Notification tapped:', response);
    
    // Navigate based on notification data
    const { data } = response.notification.request.content;
    if (data.type === 'match') {
      navigation.navigate('Match', { matchId: data.matchId });
    } else if (data.type === 'message') {
      navigation.navigate('Chat', { roomId: data.roomId });
    }
  }
);

// Clean up
subscription.remove();
```

## Notification Event Handler

The `NotificationEventHandler` provides a higher-level API for managing notification events with automatic navigation and preference handling.

### Setup Event Handler

```typescript
import { notificationEventHandler } from '@viby/shared/notifications';
import { useProfileStore } from '@viby/modules/profile';

// In your App.tsx or root component
useEffect(() => {
  if (isAuthenticated) {
    // Set navigation ref for handling notification taps
    notificationEventHandler.setNavigationRef(navigationRef.current);

    // Start listening for notification events
    notificationEventHandler.startListening();

    return () => {
      notificationEventHandler.stopListening();
    };
  }
}, [isAuthenticated]);

// Update preferences when profile changes
useEffect(() => {
  if (profile?.preferences) {
    notificationEventHandler.setPreferences({
      notificationsEnabled: profile.preferences.notificationsEnabled,
      matchNotifications: profile.preferences.matchNotifications,
      messageNotifications: profile.preferences.messageNotifications,
    });
  }
}, [profile?.preferences]);
```

### Notification Types

The event handler supports the following notification types:

#### Match Notifications
```typescript
{
  type: 'match',
  matchId: string,
  username: string,
}
```

#### Message Notifications
```typescript
{
  type: 'message',
  roomId: string,
  matchId?: string,
  userId: string,
  username: string,
  message: string,
}
```

### Preference Management

The event handler respects user notification preferences:

```typescript
interface NotificationPreferences {
  notificationsEnabled: boolean;      // Global notification toggle
  matchNotifications: boolean;        // Match-specific notifications
  messageNotifications: boolean;      // Message-specific notifications
}
```

When preferences are updated, the event handler automatically filters notifications based on user settings.

## Android Notification Channels

The service automatically configures the following notification channels on Android:

### Matches Channel
- **ID**: `matches`
- **Name**: Matches
- **Description**: Notifications when you match with someone
- **Importance**: HIGH
- **Color**: #FF6B6B (red)

### Messages Channel
- **ID**: `messages`
- **Name**: Messages
- **Description**: Notifications for new chat messages
- **Importance**: HIGH
- **Color**: #4ECDC4 (teal)

### Games Channel
- **ID**: `games`
- **Name**: Games
- **Description**: Notifications for game invites and updates
- **Importance**: DEFAULT
- **Color**: #FFE66D (yellow)

### General Channel
- **ID**: `general`
- **Name**: General
- **Description**: General app notifications
- **Importance**: DEFAULT

## Backend Integration

The service automatically registers the device token with the backend API:

```typescript
POST /notifications/register
{
  "token": "ExponentPushToken[...]",
  "type": "expo",
  "platform": "ios" | "android"
}
```

## Configuration

### app.json

The library requires the following configuration in `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./src/assets/notification-icon.png",
          "color": "#FF6B6B",
          "sounds": ["./src/assets/notification-sound.wav"]
        }
      ]
    ],
    "android": {
      "permissions": [
        "POST_NOTIFICATIONS"
      ]
    },
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

## Testing

Run tests:

```bash
nx test shared-notifications
```

## API Reference

### NotificationService

#### Methods

- `initialize(): Promise<void>` - Initialize the notification service
- `requestPermissions(): Promise<NotificationPermissionStatus>` - Request notification permissions
- `getDeviceToken(): Promise<DeviceToken>` - Get the device push token
- `registerDeviceToken(): Promise<void>` - Register device token with backend
- `configureAndroidChannels(): Promise<void>` - Configure Android notification channels
- `getPermissionStatus(): Promise<NotificationPermissionStatus>` - Get current permission status
- `areNotificationsEnabled(): Promise<boolean>` - Check if notifications are enabled
- `getCurrentDeviceToken(): string | null` - Get the current device token (if registered)
- `addNotificationReceivedListener(listener): Subscription` - Add notification received listener
- `addNotificationResponseListener(listener): Subscription` - Add notification response listener
- `cleanup(): void` - Cleanup the notification service

#### Types

```typescript
interface NotificationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: PermissionStatus;
}

interface DeviceToken {
  token: string;
  type: 'expo' | 'fcm' | 'apns';
}
```

## Requirements Satisfied

This library satisfies the following requirements:

- **13.1**: Request push notification permissions on app launch
- **13.2**: Register device token with backend when permission granted
- **13.3**: Display push notification when a match is found with matched user's name
- **13.4**: Display push notification when a message is received while app is in background
- **13.5**: Navigate to relevant screen (match or chat) when user taps a notification
- **13.6**: Support notification channels on Android for different notification types
- **13.7**: Respect user notification preferences from Profile_Module settings

## Dependencies

- `expo-notifications`: Push notification functionality
- `expo-constants`: Access to app configuration
- `@viby/shared/networking`: HTTP client for backend communication
- `react-native`: Platform detection

## Notes

- Notifications are only initialized when the user is authenticated
- The service uses a singleton pattern for easy access throughout the app
- Android channels are automatically configured on initialization
- Device tokens are automatically registered with the backend
- The service handles permission requests gracefully
