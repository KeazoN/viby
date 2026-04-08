# @viby/shared/query

TanStack Query configuration for Viby mobile app with MMKV persistence.

## Features

- **Optimized Caching**: 5-minute stale time, 30-minute cache time
- **Smart Retry Logic**: Exponential backoff with max 30s delay
- **Offline Support**: MMKV-based persistence for offline-first experience
- **Auto Refetch**: Refetches on window focus and network reconnect
- **Type-Safe Query Keys**: Centralized query key management

## Installation

This library is part of the Viby monorepo and is automatically available to all apps and libraries.

```typescript
import { queryClient, queryPersister, queryKeys } from '@viby/shared/query';
```

## Usage

### Setting up the QueryClient

```typescript
import { QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, queryPersister } from '@viby/shared/query';

function App() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: queryPersister }}
    >
      {/* Your app */}
    </PersistQueryClientProvider>
  );
}
```

### Using Query Keys

```typescript
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@viby/shared/query';

function ProfileScreen({ userId }: { userId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.profile(userId),
    queryFn: () => profileService.getProfile(userId),
  });

  // ...
}
```

### Invalidating Queries

```typescript
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@viby/shared/query';

function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates) => profileService.updateProfile(updates),
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({
        queryKey: queryKeys.profile(data.userId),
      });
    },
  });
}
```

## Configuration

### Default Query Options

- **staleTime**: 5 minutes (300,000ms)
- **gcTime**: 30 minutes (1,800,000ms)
- **retry**: 3 attempts
- **retryDelay**: Exponential backoff (1s, 2s, 4s, 8s, 16s, max 30s)
- **refetchOnWindowFocus**: true
- **refetchOnReconnect**: true
- **refetchOnMount**: true

### Default Mutation Options

- **retry**: 1 attempt
- **retryDelay**: 0ms

## Query Keys

All query keys are centralized in `queryKeys`:

```typescript
queryKeys.profile(userId)           // ['profile', userId]
queryKeys.matchHistory(userId)      // ['matchHistory', userId]
queryKeys.musicStats(userId)        // ['musicStats', userId]
queryKeys.currentlyPlaying()        // ['currentlyPlaying']
queryKeys.listeners()               // ['listeners']
queryKeys.trackClusters()           // ['trackClusters']
queryKeys.chatHistory(roomId)       // ['chatHistory', roomId]
queryKeys.chatMessages(roomId)      // ['chatMessages', roomId]
queryKeys.gameSession(roomId)       // ['gameSession', roomId]
queryKeys.gameHistory(userId)       // ['gameHistory', userId]
queryKeys.matches()                 // ['matches']
queryKeys.activeMatch()             // ['activeMatch']
```

## Scope

Implements the app’s server-state layer
- Uses TanStack Query for server-fetched data with caching and invalidation
- Integrates with MMKV storage for persistence
- Provides optimized caching strategy for performance

## Dependencies

- `@tanstack/react-query`: ^5.62.11
- `@tanstack/query-sync-storage-persister`: Latest
- `@tanstack/react-query-persist-client`: Latest
- `@viby/shared/storage`: Workspace dependency

## Base Query Hooks

### useProfileQuery

Fetches user profile data with 10-minute stale time.

```typescript
const { data, isLoading, error } = useProfileQuery(userId);
```

**Features:**
- Automatic caching and deduplication
- Only fetches when userId is provided
- Includes user stats, music preferences, and match history

[See detailed usage →](./HOOKS_USAGE.md#useprofilequery)

### useCurrentlyPlayingQuery

Fetches currently playing track with automatic polling.

```typescript
const { data, isLoading } = useCurrentlyPlayingQuery();
```

**Features:**
- Polls every 5 seconds in foreground
- Polls every 30 seconds in background
- Automatic pause when app is inactive
- Handles network errors gracefully

[See detailed usage →](./HOOKS_USAGE.md#usecurrentlyplayingquery)

### useChatHistoryQuery

Fetches chat message history with pagination support.

```typescript
const { data, isLoading } = useChatHistoryQuery(roomId, limit);
```

**Features:**
- 5-minute stale time (messages are mostly realtime)
- Pagination support via cursor
- Automatic caching per room
- Only fetches when roomId is provided

[See detailed usage →](./HOOKS_USAGE.md#usechathistoryquery)

## Additional Documentation

- [Hooks Usage Guide](./HOOKS_USAGE.md) - Detailed guide for using base query hooks
- [Integration Guide](./INTEGRATION_GUIDE.md) - How to integrate with your app
- [Usage Examples](./USAGE_EXAMPLES.md) - Common patterns and examples
