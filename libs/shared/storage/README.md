# Storage Library

This library provides a unified interface for both secure token storage and fast key-value storage for non-sensitive data in the Viby mobile application.

## Features

- **Secure Token Storage**: Uses Expo SecureStore (iOS Keychain / Android Keystore) for JWT tokens
- **Fast Key-Value Storage**: Uses MMKV for high-performance synchronous storage
- **Type-Safe**: Full TypeScript support with type inference for stored objects
- **Simple API**: Consistent interface for all storage operations

## Installation

This library is part of the Viby monorepo and is automatically available via the `@viby/shared/storage` import path.

## Usage

### Importing

```typescript
import { storageService } from '@viby/shared/storage';
```

### Secure Token Storage

Store and retrieve JWT tokens securely:

```typescript
// Store tokens
await storageService.setAccessToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
await storageService.setRefreshToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');

// Retrieve tokens
const accessToken = await storageService.getAccessToken();
const refreshToken = await storageService.getRefreshToken();

// Clear tokens (on logout)
await storageService.clearTokens();
```

### Fast Key-Value Storage

Store and retrieve non-sensitive data:

```typescript
// String values
storageService.set('username', 'john_doe');
const username = storageService.get('username');

// Number values
storageService.setNumber('loginCount', 5);
const count = storageService.getNumber('loginCount');

// Boolean values
storageService.setBoolean('hasCompletedOnboarding', true);
const completed = storageService.getBoolean('hasCompletedOnboarding');

// Objects (automatically serialized to JSON)
interface UserPreferences {
  theme: 'dark' | 'light';
  notifications: boolean;
}

const prefs: UserPreferences = {
  theme: 'dark',
  notifications: true,
};

storageService.setObject('preferences', prefs);
const savedPrefs = storageService.getObject<UserPreferences>('preferences');

// Delete a value
storageService.delete('username');

// Check if key exists
const exists = storageService.contains('username');

// Get all keys
const allKeys = storageService.getAllKeys();

// Clear all non-secure storage
storageService.clearAll();

// Clear everything including secure tokens
await storageService.clearAllIncludingTokens();
```

## Architecture

### StorageService

The main class that provides the unified storage interface. It uses:

- **MMKV**: For fast, synchronous key-value storage of non-sensitive data
- **SecureStorage**: For secure, asynchronous storage of sensitive tokens

### SecureStorage

A wrapper around Expo SecureStore that provides:

- Platform-specific secure storage (iOS Keychain, Android Keystore)
- Asynchronous API for secure operations
- Simple key-value interface

## Security Considerations

- **Never store sensitive data using MMKV methods** - use the secure token methods instead
- Access tokens and refresh tokens are automatically stored in platform keychain
- MMKV storage is encrypted with a default key (should be device-specific in production)
- All secure operations are asynchronous to ensure proper encryption

## Performance

- **MMKV**: Synchronous operations, ~10x faster than AsyncStorage
- **SecureStore**: Asynchronous operations, uses platform-native secure storage
- **Memory efficient**: MMKV uses memory-mapped files for optimal performance

## Testing

The library includes comprehensive unit tests covering:

- Secure token storage and retrieval
- Fast key-value storage for all data types
- Object serialization/deserialization
- Error handling for invalid JSON
- Clear operations

Run tests with:

```bash
npm test -- libs/shared/storage
```

## Responsibilities

This library provides:

- Secure token storage using platform-specific secure storage
- JWT token storage and retrieval
- Fast synchronous storage for TanStack Query persistence

## Dependencies

- `react-native-mmkv`: Fast key-value storage
- `expo-secure-store`: Secure token storage
