# Storage Service Usage Examples

## Example 1: Authentication Flow

```typescript
import { storageService } from '@viby/shared/storage';

// After successful OAuth login
async function handleLoginSuccess(tokens: { accessToken: string; refreshToken: string }) {
  // Store tokens securely
  await storageService.setAccessToken(tokens.accessToken);
  await storageService.setRefreshToken(tokens.refreshToken);
  
  // Store user preferences
  storageService.setBoolean('isAuthenticated', true);
  storageService.set('lastLoginTime', new Date().toISOString());
}

// Check authentication status
async function isUserAuthenticated(): Promise<boolean> {
  const accessToken = await storageService.getAccessToken();
  return accessToken !== null;
}

// Logout
async function handleLogout() {
  // Clear secure tokens
  await storageService.clearTokens();
  
  // Clear user session data
  storageService.delete('isAuthenticated');
  storageService.delete('lastLoginTime');
}
```

## Example 2: HTTP Client Integration

```typescript
import { storageService } from '@viby/shared/storage';
import axios from 'axios';

// Add auth token to requests
async function createAuthenticatedRequest(url: string) {
  const accessToken = await storageService.getAccessToken();
  
  return axios.get(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

// Refresh token flow
async function refreshAccessToken() {
  const refreshToken = await storageService.getRefreshToken();
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  
  const response = await axios.post('/auth/refresh', {
    refreshToken,
  });
  
  // Store new access token
  await storageService.setAccessToken(response.data.accessToken);
  
  return response.data.accessToken;
}
```

## Example 3: User Preferences

```typescript
import { storageService } from '@viby/shared/storage';

interface UserPreferences {
  theme: 'dark' | 'light';
  notifications: {
    matches: boolean;
    messages: boolean;
    games: boolean;
  };
  language: string;
  soundEnabled: boolean;
}

// Save preferences
function saveUserPreferences(prefs: UserPreferences) {
  storageService.setObject('userPreferences', prefs);
}

// Load preferences with defaults
function loadUserPreferences(): UserPreferences {
  const saved = storageService.getObject<UserPreferences>('userPreferences');
  
  // Return saved preferences or defaults
  return saved || {
    theme: 'dark',
    notifications: {
      matches: true,
      messages: true,
      games: true,
    },
    language: 'en',
    soundEnabled: true,
  };
}

// Update specific preference
function updateTheme(theme: 'dark' | 'light') {
  const prefs = loadUserPreferences();
  prefs.theme = theme;
  saveUserPreferences(prefs);
}
```

## Example 4: Onboarding State

```typescript
import { storageService } from '@viby/shared/storage';

// Check if user has completed onboarding
function hasCompletedOnboarding(): boolean {
  return storageService.getBoolean('hasCompletedOnboarding') || false;
}

// Mark onboarding as complete
function completeOnboarding() {
  storageService.setBoolean('hasCompletedOnboarding', true);
  storageService.set('onboardingCompletedAt', new Date().toISOString());
}

// Reset onboarding (for testing)
function resetOnboarding() {
  storageService.delete('hasCompletedOnboarding');
  storageService.delete('onboardingCompletedAt');
}
```

## Example 5: Cache Management

```typescript
import { storageService } from '@viby/shared/storage';

interface CachedData<T> {
  data: T;
  timestamp: number;
  expiresIn: number; // milliseconds
}

// Cache data with expiration
function cacheData<T>(key: string, data: T, expiresIn: number = 300000) {
  const cached: CachedData<T> = {
    data,
    timestamp: Date.now(),
    expiresIn,
  };
  
  storageService.setObject(`cache:${key}`, cached);
}

// Get cached data if not expired
function getCachedData<T>(key: string): T | null {
  const cached = storageService.getObject<CachedData<T>>(`cache:${key}`);
  
  if (!cached) {
    return null;
  }
  
  const isExpired = Date.now() - cached.timestamp > cached.expiresIn;
  
  if (isExpired) {
    storageService.delete(`cache:${key}`);
    return null;
  }
  
  return cached.data;
}

// Clear all cache
function clearCache() {
  const allKeys = storageService.getAllKeys();
  const cacheKeys = allKeys.filter(key => key.startsWith('cache:'));
  
  cacheKeys.forEach(key => storageService.delete(key));
}
```

## Example 6: TanStack Query Persistence

```typescript
import { storageService } from '@viby/shared/storage';
import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

// Create persister using storage service
const persister = createSyncStoragePersister({
  storage: {
    getItem: (key) => storageService.get(key) || null,
    setItem: (key, value) => storageService.set(key, value),
    removeItem: (key) => storageService.delete(key),
  },
});

// Configure QueryClient with persistence
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
});
```

## Example 7: Feature Flags

```typescript
import { storageService } from '@viby/shared/storage';

interface FeatureFlags {
  enableNewMatchingAlgorithm: boolean;
  enableVoiceChat: boolean;
  enableAdvancedStats: boolean;
}

// Load feature flags
function getFeatureFlags(): FeatureFlags {
  return storageService.getObject<FeatureFlags>('featureFlags') || {
    enableNewMatchingAlgorithm: false,
    enableVoiceChat: false,
    enableAdvancedStats: false,
  };
}

// Check if feature is enabled
function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  const flags = getFeatureFlags();
  return flags[feature];
}

// Update feature flags (from remote config)
function updateFeatureFlags(flags: Partial<FeatureFlags>) {
  const current = getFeatureFlags();
  const updated = { ...current, ...flags };
  storageService.setObject('featureFlags', updated);
}
```

## Example 8: Analytics Tracking

```typescript
import { storageService } from '@viby/shared/storage';

interface AnalyticsSession {
  sessionId: string;
  startTime: number;
  eventCount: number;
}

// Start analytics session
function startAnalyticsSession() {
  const session: AnalyticsSession = {
    sessionId: `session_${Date.now()}`,
    startTime: Date.now(),
    eventCount: 0,
  };
  
  storageService.setObject('analyticsSession', session);
}

// Track event
function trackEvent(eventName: string) {
  const session = storageService.getObject<AnalyticsSession>('analyticsSession');
  
  if (session) {
    session.eventCount++;
    storageService.setObject('analyticsSession', session);
  }
}

// Get session duration
function getSessionDuration(): number {
  const session = storageService.getObject<AnalyticsSession>('analyticsSession');
  
  if (!session) {
    return 0;
  }
  
  return Date.now() - session.startTime;
}
```

## Best Practices

1. **Use secure storage for sensitive data**: Always use `setAccessToken()` and `setRefreshToken()` for JWT tokens
2. **Type your objects**: Use TypeScript generics with `setObject<T>()` and `getObject<T>()` for type safety
3. **Handle missing values**: Always check for `undefined` or `null` when retrieving values
4. **Clear on logout**: Always call `clearTokens()` or `clearAllIncludingTokens()` on logout
5. **Namespace your keys**: Use prefixes like `cache:`, `user:`, `settings:` to organize keys
6. **Validate JSON**: The service handles JSON parsing errors gracefully, but validate your data
7. **Use appropriate data types**: Use `setNumber()`, `setBoolean()` for primitives instead of strings
8. **Clean up expired data**: Implement cache expiration and cleanup strategies
