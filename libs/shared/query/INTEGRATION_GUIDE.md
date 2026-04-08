# TanStack Query Integration Guide

This guide shows how to integrate the TanStack Query configuration into the Viby mobile app.

## Step 1: Install Dependencies

The required dependencies are already installed in the root `package.json`:

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.62.11",
    "@tanstack/query-sync-storage-persister": "latest",
    "@tanstack/react-query-persist-client": "latest"
  }
}
```

## Step 2: Set Up Query Provider in App Root

Update your main `App.tsx` to wrap the app with the Query Provider:

```typescript
// apps/viby/src/app/App.tsx
import React from 'react';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, queryPersister } from '@viby/shared/query';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from './navigation/RootNavigator';

export function App() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: queryPersister }}
    >
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </PersistQueryClientProvider>
  );
}

export default App;
```

## Step 3: Add DevTools (Development Only)

For development, you can add React Query DevTools:

```typescript
// apps/viby/src/app/App.tsx
import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@viby/shared/query';

// Note: DevTools are not available for React Native yet
// This is for web development only
if (__DEV__ && typeof window !== 'undefined') {
  import('@tanstack/react-query-devtools').then(({ ReactQueryDevtools }) => {
    // DevTools will be available in web builds
  });
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Your app */}
    </QueryClientProvider>
  );
}
```

## Step 4: Create Query Hooks

Create custom hooks for your queries in domain modules:

```typescript
// libs/modules/profile/src/lib/hooks/use-profile.ts
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@viby/shared/query';
import { profileService } from '../services/profile-service';

export function useProfile(userId: string) {
  return useQuery({
    queryKey: queryKeys.profile(userId),
    queryFn: () => profileService.getProfile(userId),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useMatchHistory(userId: string) {
  return useQuery({
    queryKey: queryKeys.matchHistory(userId),
    queryFn: () => profileService.getMatchHistory(userId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useMusicStats(userId: string) {
  return useQuery({
    queryKey: queryKeys.musicStats(userId),
    queryFn: () => profileService.getMusicStats(userId),
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}
```

## Step 5: Create Mutation Hooks

Create custom hooks for mutations:

```typescript
// libs/modules/profile/src/lib/hooks/use-update-profile.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@viby/shared/query';
import { profileService } from '../services/profile-service';
import { useAuthStore } from '@viby/modules/auth';

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: (updates: Partial<Profile>) =>
      profileService.updateProfile(updates),

    onMutate: async (updates) => {
      if (!user?.id) return;

      await queryClient.cancelQueries({
        queryKey: queryKeys.profile(user.id),
      });

      const previousProfile = queryClient.getQueryData(
        queryKeys.profile(user.id)
      );

      queryClient.setQueryData(
        queryKeys.profile(user.id),
        (old: Profile) => ({
          ...old,
          ...updates,
        })
      );

      return { previousProfile };
    },

    onError: (err, updates, context) => {
      if (user?.id && context?.previousProfile) {
        queryClient.setQueryData(
          queryKeys.profile(user.id),
          context.previousProfile
        );
      }
    },

    onSettled: () => {
      if (user?.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.profile(user.id),
        });
      }
    },
  });
}
```

## Step 6: Use Queries in Components

Use the custom hooks in your components:

```typescript
// apps/viby/src/screens/ProfileScreen.tsx
import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useProfile, useUpdateProfile } from '@viby/modules/profile';
import { useAuthStore } from '@viby/modules/auth';

export function ProfileScreen() {
  const { user } = useAuthStore();
  const { data: profile, isLoading, isError, error } = useProfile(user!.id);
  const updateProfile = useUpdateProfile();

  if (isLoading) {
    return <ActivityIndicator />;
  }

  if (isError) {
    return <Text>Error: {error.message}</Text>;
  }

  const handleUpdate = (updates: Partial<Profile>) => {
    updateProfile.mutate(updates, {
      onSuccess: () => {
        console.log('Profile updated successfully');
      },
      onError: (err) => {
        console.error('Failed to update profile:', err);
      },
    });
  };

  return (
    <View>
      <Text>{profile.username}</Text>
      {/* Profile UI */}
    </View>
  );
}
```

## Step 7: Integrate with WebSocket Events

Sync WebSocket events with query cache:

```typescript
// libs/modules/discovery/src/lib/hooks/use-discovery-sync.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@viby/shared/query';
import { socketManager } from '@viby/modules/realtime';
import { useDiscoveryStore } from '../stores/discovery-store';

export function useDiscoverySync() {
  const queryClient = useQueryClient();
  const { addListener, removeListener, updateListenerCount } = useDiscoveryStore();

  useEffect(() => {
    const handleListenerAdded = (data: Listener) => {
      addListener(data);
      queryClient.invalidateQueries({ queryKey: queryKeys.listeners() });
      queryClient.invalidateQueries({ queryKey: queryKeys.trackClusters() });
    };

    const handleListenerRemoved = (data: { userId: string }) => {
      removeListener(data.userId);
      queryClient.invalidateQueries({ queryKey: queryKeys.listeners() });
      queryClient.invalidateQueries({ queryKey: queryKeys.trackClusters() });
    };

    const handleListenerCount = (data: { trackId: string; count: number }) => {
      updateListenerCount(data.trackId, data.count);
      queryClient.invalidateQueries({ queryKey: queryKeys.trackClusters() });
    };

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

## Step 8: Handle Network Status

Integrate with network status for better offline support:

```typescript
// apps/viby/src/app/providers/QueryProvider.tsx
import React, { useEffect } from 'react';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { onlineManager } from '@tanstack/react-query';
import { queryClient, queryPersister } from '@viby/shared/query';
import NetInfo from '@react-native-community/netinfo';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Sync online status with TanStack Query
    const unsubscribe = NetInfo.addEventListener((state) => {
      onlineManager.setOnline(state.isConnected ?? false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: queryPersister }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
```

## Step 9: Add Focus Manager

Integrate with app state for automatic refetching:

```typescript
// apps/viby/src/app/providers/QueryProvider.tsx
import React, { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { focusManager } from '@tanstack/react-query';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Sync app state with TanStack Query focus manager
    const subscription = AppState.addEventListener(
      'change',
      (status: AppStateStatus) => {
        focusManager.setFocused(status === 'active');
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: queryPersister }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
```

## Complete Provider Setup

Here's the complete provider setup combining all features:

```typescript
// apps/viby/src/app/providers/QueryProvider.tsx
import React, { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { onlineManager, focusManager } from '@tanstack/react-query';
import { queryClient, queryPersister } from '@viby/shared/query';
import NetInfo from '@react-native-community/netinfo';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Sync online status
    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      onlineManager.setOnline(state.isConnected ?? false);
    });

    // Sync app state
    const subscription = AppState.addEventListener(
      'change',
      (status: AppStateStatus) => {
        focusManager.setFocused(status === 'active');
      }
    );

    return () => {
      unsubscribeNetInfo();
      subscription.remove();
    };
  }, []);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: queryPersister }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
```

## Testing

### Mock Query Client for Tests

```typescript
// libs/shared/query/src/__mocks__/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      cacheTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
});

export const queryPersister = {
  persistClient: jest.fn(),
  restoreClient: jest.fn(),
  removeClient: jest.fn(),
};
```

### Test Component with Queries

```typescript
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@viby/shared/query';
import { useProfile } from './use-profile';

describe('useProfile', () => {
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('should fetch profile data', async () => {
    const { result } = renderHook(() => useProfile('user-123'), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
  });
});
```

## Troubleshooting

### Issue: Queries not persisting

**Solution**: Ensure MMKV storage is properly initialized before QueryClient:

```typescript
import { storageService } from '@viby/shared/storage';

// Initialize storage before creating query client
storageService.set('test', 'value');
```

### Issue: Queries refetching too often

**Solution**: Adjust staleTime for specific queries:

```typescript
const { data } = useQuery({
  queryKey: queryKeys.profile(userId),
  queryFn: () => profileService.getProfile(userId),
  staleTime: 1000 * 60 * 10, // 10 minutes
});
```

### Issue: Mutations not invalidating cache

**Solution**: Ensure you're using the correct query keys:

```typescript
import { queryKeys } from '@viby/shared/query';

// ✅ Correct
queryClient.invalidateQueries({ queryKey: queryKeys.profile(userId) });

// ❌ Incorrect
queryClient.invalidateQueries({ queryKey: ['profile', userId] });
```

## Next Steps

1. Create query hooks for each domain module
2. Integrate WebSocket events with cache invalidation
3. Add error boundaries for query errors
4. Set up analytics for query performance
5. Configure background fetch for iOS

## Resources

- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [React Query Persistence](https://tanstack.com/query/latest/docs/react/plugins/persistQueryClient)
- [MMKV Storage](https://github.com/mrousavy/react-native-mmkv)
