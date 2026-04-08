# Auth Store

The Auth Store manages client-side authentication state using Zustand.

## Features

- **User State**: Stores current user information
- **Authentication Status**: Tracks if user is authenticated
- **Loading State**: Manages loading state during auth operations
- **Persistence**: Persists `isAuthenticated` flag using MMKV storage
- **Secure Token Storage**: Tokens are stored separately in SecureStore via AuthService

## Usage

```typescript
import { useAuthStore } from '@viby/modules/auth';

function MyComponent() {
  const { user, isAuthenticated, isLoading, login, logout, setUser } = useAuthStore();

  // Login example
  const handleLogin = async (tokens: AuthTokens, user: User) => {
    login(tokens, user);
  };

  // Logout example
  const handleLogout = async () => {
    await logout();
  };

  // Update user example
  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <View>
      {isAuthenticated ? (
        <Text>Welcome, {user?.displayName}!</Text>
      ) : (
        <Text>Please log in</Text>
      )}
    </View>
  );
}
```

## State Structure

```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
```

## Actions

### `login(tokens: AuthTokens, user: User)`

Sets user and authentication state after successful OAuth flow.

**Parameters:**
- `tokens`: Auth tokens from OAuth callback
- `user`: User data from backend

**Covers:** Persisting authentication state

### `logout()`

Clears user and authentication state, and calls AuthService to clear tokens from SecureStore.

**Covers:** Clearing state on logout

### `setUser(user: User)`

Updates user data without changing authentication state.

**Parameters:**
- `user`: Updated user data

### `setLoading(isLoading: boolean)`

Updates loading state.

**Parameters:**
- `isLoading`: Loading state

## Persistence

The store persists only the `isAuthenticated` flag using MMKV storage for fast synchronous access. Tokens are stored separately in platform-specific secure storage (Keychain on iOS, Keystore on Android) via the AuthService.

**Persisted:**
- `isAuthenticated`: boolean

**Not Persisted:**
- `user`: User data (fetched from backend on app launch)
- `isLoading`: Loading state (ephemeral)
- Tokens (stored in SecureStore via AuthService)

## Integration with AuthService

The Auth Store integrates with AuthService for token management:

1. **Login Flow:**
   - AuthService handles OAuth callback and stores tokens in SecureStore
   - Auth Store updates client state with user data and authentication status

2. **Logout Flow:**
   - Auth Store calls `authService.logout()` to clear tokens from SecureStore
   - Auth Store clears client state

3. **Token Refresh:**
   - AuthService handles token refresh automatically via HTTP interceptor
   - Auth Store maintains authentication state

## State behavior

- Store authentication state persistently
  - ✅ `isAuthenticated` flag is persisted using MMKV storage
  - ✅ Tokens are stored securely in SecureStore via AuthService

- Clear state on logout
  - ✅ `logout()` action clears all client state
  - ✅ `logout()` calls AuthService to clear tokens from SecureStore
