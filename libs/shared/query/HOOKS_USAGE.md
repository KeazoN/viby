# Query Hooks Usage Guide

This guide demonstrates how to use the base query hooks provided by `@viby/shared/query`.

## Overview

The query hooks provide type-safe data fetching with automatic caching, polling, and error handling. They are built on top of TanStack Query and integrate seamlessly with the Viby backend API.

## Available Hooks

### useProfileQuery

Fetches user profile data including stats, music preferences, and match history.

**Features:**
- 10-minute stale time (profiles don't change frequently)
- Automatic caching and deduplication
- Only fetches when userId is provided

**Usage:**

```typescript
import { useProfileQuery } from '@viby/shared/query';

function ProfileScreen({ userId }: { userId: string }) {
  const { data: profile, isLoading, error, refetch } = useProfileQuery(userId);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={refetch} />;
  }

  if (!profile) {
    return <EmptyState />;
  }

  return (
    <View>
      <Avatar source={{ uri: profile.user.avatar }} />
      <Text>{profile.user.username}</Text>
      <Text>Win Rate: {(profile.stats.winRate * 100).toFixed(1)}%</Text>
      <Text>Total Games: {profile.stats.totalGames}</Text>
    </View>
  );
}
```

**Conditional Fetching:**

```typescript
// Only fetch when userId is available
const { data } = useProfileQuery(userId || '');

// The hook won't fetch if userId is empty
```

### useCurrentlyPlayingQuery

Fetches the currently playing track with automatic polling.

**Features:**
- Polls every 5 seconds in foreground
- Polls every 30 seconds in background
- Automatic pause when app is inactive
- Handles network errors gracefully

**Usage:**

```typescript
import { useCurrentlyPlayingQuery } from '@viby/shared/query';

function NowPlayingWidget() {
  const { data: currentlyPlaying, isLoading } = useCurrentlyPlayingQuery();

  if (isLoading) {
    return <Skeleton />;
  }

  if (!currentlyPlaying?.track) {
    return (
      <View>
        <Text>Not listening to anything right now</Text>
        <Text>Start playing music to connect with others!</Text>
      </View>
    );
  }

  const { track, isPlaying, progress } = currentlyPlaying;

  return (
    <View>
      <Image source={{ uri: track.artwork }} />
      <Text>{track.title}</Text>
      <Text>{track.artist}</Text>
      {isPlaying && <PlayingAnimation />}
      <ProgressBar progress={progress} duration={track.duration} />
    </View>
  );
}
```

**Polling Behavior:**

The hook automatically adjusts polling frequency based on app state:
- **Foreground (active)**: Polls every 5 seconds
- **Background**: Polls every 30 seconds
- **Inactive**: Continues polling in background

This ensures realtime updates while conserving battery and network resources.

### useChatHistoryQuery

Fetches chat message history for a room.

**Features:**
- 5-minute stale time (messages are mostly realtime via WebSocket)
- Pagination support via cursor
- Automatic caching per room
- Only fetches when roomId is provided

**Usage:**

```typescript
import { useChatHistoryQuery } from '@viby/shared/query';

function ChatScreen({ roomId }: { roomId: string }) {
  const { data: history, isLoading, error } = useChatHistoryQuery(roomId);

  if (isLoading) {
    return <LoadingMessages />;
  }

  if (error) {
    return <ErrorMessage error={error} />;
  }

  return (
    <FlatList
      data={history?.messages || []}
      renderItem={({ item }) => <MessageBubble message={item} />}
      keyExtractor={(item) => item.id}
    />
  );
}
```

**Custom Limit:**

```typescript
// Fetch only 20 messages
const { data } = useChatHistoryQuery(roomId, 20);
```

**Pagination:**

```typescript
function ChatScreen({ roomId }: { roomId: string }) {
  const { data: history, fetchNextPage, hasNextPage } = useChatHistoryQuery(roomId);

  const loadMore = () => {
    if (history?.hasMore && history?.nextCursor) {
      // Use the cursor to fetch more messages
      // This would require extending the hook to support infinite queries
      fetchNextPage();
    }
  };

  return (
    <FlatList
      data={history?.messages || []}
      renderItem={({ item }) => <MessageBubble message={item} />}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
    />
  );
}
```

## Advanced Usage

### Manual Refetching

All hooks return a `refetch` function for manual data updates:

```typescript
const { data, refetch } = useProfileQuery(userId);

// Manually refetch data
const handleRefresh = async () => {
  await refetch();
};

return (
  <ScrollView
    refreshControl={
      <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />
    }
  >
    {/* Content */}
  </ScrollView>
);
```

### Error Handling

All hooks provide error information:

```typescript
const { data, error, isError } = useProfileQuery(userId);

if (isError) {
  // Handle different error types
  if (error.message.includes('Network')) {
    return <NetworkError onRetry={refetch} />;
  }
  
  if (error.message.includes('404')) {
    return <NotFoundError />;
  }
  
  return <GenericError error={error} />;
}
```

### Loading States

Distinguish between initial loading and background refetching:

```typescript
const { data, isLoading, isFetching, isRefetching } = useProfileQuery(userId);

// isLoading: true only on initial fetch (no cached data)
// isFetching: true whenever data is being fetched (including refetch)
// isRefetching: true when refetching with existing data

if (isLoading) {
  return <FullScreenLoader />;
}

return (
  <View>
    {isFetching && <TopBarLoader />}
    <ProfileContent profile={data} />
  </View>
);
```

### Cache Invalidation

Invalidate cached data when needed:

```typescript
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@viby/shared/query';

function ProfileEditScreen({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  
  const handleSave = async (updates: Partial<Profile>) => {
    await updateProfile(updates);
    
    // Invalidate profile cache to trigger refetch
    queryClient.invalidateQueries({
      queryKey: queryKeys.profile(userId),
    });
  };
  
  return <ProfileForm onSave={handleSave} />;
}
```

## Integration with WebSocket

The query hooks work seamlessly with WebSocket updates. When realtime events occur, invalidate the relevant queries:

```typescript
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socketManager } from '@viby/modules/realtime';
import { queryKeys } from '@viby/shared/query';

function useRealtimeSync() {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    // Invalidate currently playing when track changes
    socketManager.subscribe('track:changed', () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.currentlyPlaying(),
      });
    });
    
    // Invalidate chat history when new message arrives
    socketManager.subscribe('message:received', (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.chatHistory(data.roomId),
      });
    });
    
    return () => {
      socketManager.unsubscribe('track:changed');
      socketManager.unsubscribe('message:received');
    };
  }, [queryClient]);
}
```

## Best Practices

### 1. Use Conditional Fetching

Only fetch data when needed:

```typescript
// ✅ Good: Only fetch when userId is available
const { data } = useProfileQuery(userId || '');

// ❌ Bad: Always fetching even without userId
const { data } = useProfileQuery(userId);
```

### 2. Handle All States

Always handle loading, error, and empty states:

```typescript
function Component() {
  const { data, isLoading, error } = useProfileQuery(userId);
  
  if (isLoading) return <Loading />;
  if (error) return <Error error={error} />;
  if (!data) return <Empty />;
  
  return <Content data={data} />;
}
```

### 3. Leverage Caching

Don't refetch unnecessarily - trust the cache:

```typescript
// ✅ Good: Let TanStack Query handle caching
const { data } = useProfileQuery(userId);

// ❌ Bad: Forcing refetch on every render
const { data, refetch } = useProfileQuery(userId);
useEffect(() => {
  refetch();
}, []);
```

### 4. Use Query Keys Consistently

Always use the exported query keys:

```typescript
// ✅ Good: Using exported query keys
import { queryKeys } from '@viby/shared/query';
queryClient.invalidateQueries({ queryKey: queryKeys.profile(userId) });

// ❌ Bad: Hardcoding query keys
queryClient.invalidateQueries({ queryKey: ['profile', userId] });
```

## Behavior checks

These hooks cover:

- Currently playing detection with 5-second foreground polling and 30-second background polling
- TanStack Query for server state management with caching and invalidation

## Related Documentation

- [Query Client Configuration](./README.md#query-client-configuration)
- [Query Keys Structure](./README.md#query-keys)
- [Integration Guide](./INTEGRATION_GUIDE.md)
- [Usage Examples](./USAGE_EXAMPLES.md)
