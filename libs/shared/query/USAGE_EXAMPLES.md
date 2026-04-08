# TanStack Query Usage Examples

This document provides practical examples of using the TanStack Query configuration in the Viby mobile app.

## Table of Contents

1. [Setup](#setup)
2. [Basic Queries](#basic-queries)
3. [Mutations with Optimistic Updates](#mutations-with-optimistic-updates)
4. [Cache Invalidation](#cache-invalidation)
5. [Polling Queries](#polling-queries)
6. [Dependent Queries](#dependent-queries)
7. [Infinite Queries](#infinite-queries)
8. [WebSocket Integration](#websocket-integration)

## Setup

### App Provider Setup

```typescript
import React from 'react';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, queryPersister } from '@viby/shared/query';

export function App() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: queryPersister }}
    >
      {/* Your app components */}
    </PersistQueryClientProvider>
  );
}
```

### DevTools (Development Only)

```typescript
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@viby/shared/query';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Your app components */}
      {__DEV__ && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
```

## Basic Queries

### Fetching User Profile

```typescript
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@viby/shared/query';
import { profileService } from '@viby/modules/profile';

function ProfileScreen({ userId }: { userId: string }) {
  const {
    data: profile,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.profile(userId),
    queryFn: () => profileService.getProfile(userId),
    // Override default staleTime for this specific query
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return <ErrorView error={error} onRetry={refetch} />;
  }

  return <ProfileView profile={profile} />;
}
```

### Fetching with Enabled Flag

```typescript
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@viby/shared/query';
import { useAuthStore } from '@viby/modules/auth';

function CurrentUserProfile() {
  const { user, isAuthenticated } = useAuthStore();

  const { data: profile } = useQuery({
    queryKey: queryKeys.profile(user?.id ?? ''),
    queryFn: () => profileService.getProfile(user!.id),
    // Only fetch when user is authenticated
    enabled: isAuthenticated && !!user?.id,
  });

  return profile ? <ProfileView profile={profile} /> : null;
}
```

## Mutations with Optimistic Updates

### Updating User Profile

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@viby/shared/query';
import { profileService } from '@viby/modules/profile';
import { useAuthStore } from '@viby/modules/auth';

function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: (updates: Partial<Profile>) =>
      profileService.updateProfile(updates),

    // Optimistic update
    onMutate: async (updates) => {
      if (!user?.id) return;

      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.profile(user.id),
      });

      // Snapshot previous value
      const previousProfile = queryClient.getQueryData(
        queryKeys.profile(user.id)
      );

      // Optimistically update cache
      queryClient.setQueryData(
        queryKeys.profile(user.id),
        (old: Profile) => ({
          ...old,
          ...updates,
        })
      );

      return { previousProfile };
    },

    // Rollback on error
    onError: (err, updates, context) => {
      if (user?.id && context?.previousProfile) {
        queryClient.setQueryData(
          queryKeys.profile(user.id),
          context.previousProfile
        );
      }
      // Show error toast
      console.error('Failed to update profile:', err);
    },

    // Refetch after mutation
    onSettled: () => {
      if (user?.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.profile(user.id),
        });
      }
    },
  });
}

// Usage in component
function EditProfileScreen() {
  const updateProfile = useUpdateProfile();

  const handleSave = (updates: Partial<Profile>) => {
    updateProfile.mutate(updates, {
      onSuccess: () => {
        // Navigate back or show success message
        console.log('Profile updated successfully');
      },
    });
  };

  return (
    <ProfileForm
      onSave={handleSave}
      isLoading={updateProfile.isPending}
    />
  );
}
```

### Sending Chat Message

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@viby/shared/query';
import { chatService } from '@viby/modules/chat';
import { useChatStore } from '@viby/modules/chat';
import { useAuthStore } from '@viby/modules/auth';

function useSendMessage(roomId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { addMessage, updateMessageStatus } = useChatStore();

  return useMutation({
    mutationFn: (content: string) => chatService.sendMessage(roomId, content),

    onMutate: async (content) => {
      // Create temporary message
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        roomId,
        userId: user!.id,
        content,
        status: 'sending',
        timestamp: new Date().toISOString(),
      };

      // Add to Zustand store for immediate UI update
      addMessage(roomId, tempMessage);

      return { tempMessage };
    },

    onSuccess: (message, content, context) => {
      // Update temp message with real message
      updateMessageStatus(roomId, context.tempMessage.id, 'sent');

      // Invalidate chat history
      queryClient.invalidateQueries({
        queryKey: queryKeys.chatHistory(roomId),
      });
    },

    onError: (err, content, context) => {
      if (context?.tempMessage) {
        updateMessageStatus(roomId, context.tempMessage.id, 'failed');
      }
    },
  });
}
```

## Cache Invalidation

### Invalidating Specific Query

```typescript
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@viby/shared/query';

function useInvalidateProfile(userId: string) {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.profile(userId),
    });
  };
}
```

### Invalidating Multiple Related Queries

```typescript
import { useQueryClient } from '@tanstack/react-query';
import { queryKeyPrefixes } from '@viby/shared/query';

function useInvalidateDiscovery() {
  const queryClient = useQueryClient();

  return () => {
    // Invalidate all discovery-related queries
    queryKeyPrefixes.discovery.forEach((prefix) => {
      queryClient.invalidateQueries({
        queryKey: [prefix],
      });
    });
  };
}
```

### Invalidating on WebSocket Event

```typescript
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@viby/shared/query';
import { socketManager } from '@viby/modules/realtime';

function useDiscoverySync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Invalidate listeners when someone joins
    const handleListenerAdded = () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.listeners(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.trackClusters(),
      });
    };

    // Invalidate listeners when someone leaves
    const handleListenerRemoved = () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.listeners(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.trackClusters(),
      });
    };

    socketManager.subscribe('listener:added', handleListenerAdded);
    socketManager.subscribe('listener:removed', handleListenerRemoved);

    return () => {
      socketManager.unsubscribe('listener:added', handleListenerAdded);
      socketManager.unsubscribe('listener:removed', handleListenerRemoved);
    };
  }, [queryClient]);
}
```

## Polling Queries

### Currently Playing Track

```typescript
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@viby/shared/query';
import { trackingService } from '@viby/modules/discovery';
import { useAppState } from 'react-native';

function useCurrentlyPlaying() {
  const appState = useAppState();

  return useQuery({
    queryKey: queryKeys.currentlyPlaying(),
    queryFn: () => trackingService.getCurrentlyPlaying(),
    // Poll every 5 seconds in foreground
    refetchInterval: appState === 'active' ? 5000 : false,
    // Poll every 30 seconds in background
    refetchIntervalInBackground: 30000,
  });
}
```

## Dependent Queries

### Fetch Profile Then Match History

```typescript
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@viby/shared/query';
import { profileService } from '@viby/modules/profile';

function useProfileWithHistory(userId: string) {
  // First query: fetch profile
  const profileQuery = useQuery({
    queryKey: queryKeys.profile(userId),
    queryFn: () => profileService.getProfile(userId),
  });

  // Second query: fetch match history (depends on profile)
  const matchHistoryQuery = useQuery({
    queryKey: queryKeys.matchHistory(userId),
    queryFn: () => profileService.getMatchHistory(userId),
    // Only fetch when profile is loaded
    enabled: !!profileQuery.data,
  });

  return {
    profile: profileQuery.data,
    matchHistory: matchHistoryQuery.data,
    isLoading: profileQuery.isLoading || matchHistoryQuery.isLoading,
  };
}
```

## Infinite Queries

### Paginated Chat History

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@viby/shared/query';
import { chatService } from '@viby/modules/chat';

function useChatHistory(roomId: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.chatHistory(roomId),
    queryFn: ({ pageParam = 0 }) =>
      chatService.loadHistory(roomId, {
        offset: pageParam,
        limit: 50,
      }),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < 50) return undefined;
      return allPages.length * 50;
    },
    initialPageParam: 0,
  });
}

// Usage in component
function ChatScreen({ roomId }: { roomId: string }) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useChatHistory(roomId);

  const messages = data?.pages.flat() ?? [];

  return (
    <FlatList
      data={messages}
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      }}
      ListFooterComponent={
        isFetchingNextPage ? <LoadingSpinner /> : null
      }
    />
  );
}
```

## WebSocket Integration

### Syncing WebSocket Events with Query Cache

```typescript
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@viby/shared/query';
import { socketManager } from '@viby/modules/realtime';
import { useDiscoveryStore } from '@viby/modules/discovery';

function useDiscoveryWebSocket() {
  const queryClient = useQueryClient();
  const { addListener, removeListener, updateListenerCount } = useDiscoveryStore();

  useEffect(() => {
    // Handle listener added
    const handleListenerAdded = (data: Listener) => {
      // Update Zustand store for immediate UI update
      addListener(data);

      // Invalidate TanStack Query cache
      queryClient.invalidateQueries({
        queryKey: queryKeys.listeners(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.trackClusters(),
      });
    };

    // Handle listener removed
    const handleListenerRemoved = (data: { userId: string }) => {
      // Update Zustand store
      removeListener(data.userId);

      // Invalidate cache
      queryClient.invalidateQueries({
        queryKey: queryKeys.listeners(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.trackClusters(),
      });
    };

    // Handle listener count update
    const handleListenerCount = (data: { trackId: string; count: number }) => {
      // Update Zustand store
      updateListenerCount(data.trackId, data.count);

      // Invalidate cache
      queryClient.invalidateQueries({
        queryKey: queryKeys.trackClusters(),
      });
    };

    // Subscribe to events
    socketManager.subscribe('listener:added', handleListenerAdded);
    socketManager.subscribe('listener:removed', handleListenerRemoved);
    socketManager.subscribe('listener:count', handleListenerCount);

    return () => {
      socketManager.unsubscribe('listener:added', handleListenerAdded);
      socketManager.unsubscribe('listener:removed', handleListenerRemoved);
      socketManager.unsubscribe('listener:count', handleListenerCount);
    };
  }, [queryClient, addListener, removeListener, updateListenerCount]);
}
```

## Best Practices

### 1. Use Query Keys Consistently

```typescript
// ✅ Good: Use centralized query keys
import { queryKeys } from '@viby/shared/query';
const key = queryKeys.profile(userId);

// ❌ Bad: Hardcoded query keys
const key = ['profile', userId];
```

### 2. Handle Loading and Error States

```typescript
function ProfileScreen({ userId }: { userId: string }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.profile(userId),
    queryFn: () => profileService.getProfile(userId),
  });

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorView error={error} />;
  if (!data) return <EmptyState />;

  return <ProfileView profile={data} />;
}
```

### 3. Use Optimistic Updates for Better UX

```typescript
// Always implement optimistic updates for mutations
// that affect the UI immediately
const mutation = useMutation({
  mutationFn: updateFn,
  onMutate: async (newData) => {
    // Cancel queries and update cache optimistically
  },
  onError: (err, newData, context) => {
    // Rollback on error
  },
  onSettled: () => {
    // Refetch to ensure consistency
  },
});
```

### 4. Invalidate Related Queries

```typescript
// When updating data, invalidate all related queries
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: queryKeys.profile(userId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.matchHistory(userId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.musicStats(userId) });
};
```

### 5. Use Enabled Flag for Conditional Fetching

```typescript
// Only fetch when dependencies are ready
const { data } = useQuery({
  queryKey: queryKeys.profile(userId),
  queryFn: () => profileService.getProfile(userId),
  enabled: !!userId && isAuthenticated,
});
```
