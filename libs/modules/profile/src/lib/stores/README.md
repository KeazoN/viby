# Profile Stores

This directory contains Zustand stores for managing profile-related client state.

## Overview

The Profile module uses Zustand for client-side state management, following the same patterns as other modules (Auth, Discovery, Game, Chat, Matchmaking).

## Stores

### `useProfileStore`

Manages user profile data, match history, and music statistics on the client side.

**State:**
- `profile: Profile | null` - Current user's profile data
- `matchHistory: Match[]` - Array of past matches with opponents and results
- `musicStats: MusicStats | null` - User's music listening statistics

**Actions:**
- `setProfile(profile: Profile)` - Set the complete profile data
- `updateProfile(updates: Partial<Profile>)` - Update profile with partial data (for optimistic updates)
- `setMatchHistory(matches: Match[])` - Set the match history array
- `setMusicStats(stats: MusicStats)` - Set the music statistics
- `clear()` - Clear all profile state (called on logout)

## Usage Example

```typescript
import { useProfileStore } from '@viby/modules/profile';

function ProfileScreen() {
  const profile = useProfileStore((state) => state.profile);
  const matchHistory = useProfileStore((state) => state.matchHistory);
  const setProfile = useProfileStore((state) => state.setProfile);
  
  // Fetch and set profile
  useEffect(() => {
    profileService.getProfile(userId).then(setProfile);
  }, [userId]);
  
  return (
    <View>
      <Text>{profile?.username}</Text>
      <Text>Matches: {matchHistory.length}</Text>
    </View>
  );
}
```

## Optimistic Updates

The `updateProfile` action supports optimistic updates for profile changes:

```typescript
import { useProfileStore } from '@viby/modules/profile';
import { profileService } from '@viby/modules/profile';

function EditProfileScreen() {
  const updateProfile = useProfileStore((state) => state.updateProfile);
  
  const handleSave = async (updates: Partial<Profile>) => {
    // Optimistic update
    updateProfile(updates);
    
    try {
      // Send to server
      const updatedProfile = await profileService.updateProfile(updates);
      // Update with server response
      updateProfile(updatedProfile);
    } catch (error) {
      // Rollback on error (would need to store previous state)
      console.error('Failed to update profile:', error);
    }
  };
  
  return <EditForm onSave={handleSave} />;
}
```

## Integration with TanStack Query

While the store manages client state, TanStack Query should be used for server state management with caching and invalidation:

```typescript
import { useProfileQuery, useUpdateProfileMutation } from '@viby/shared/query';
import { useProfileStore } from '@viby/modules/profile';

function ProfileScreen() {
  const setProfile = useProfileStore((state) => state.setProfile);
  
  // Fetch profile with TanStack Query
  const { data: profile } = useProfileQuery(userId);
  
  // Update store when query data changes
  useEffect(() => {
    if (profile) {
      setProfile(profile);
    }
  }, [profile, setProfile]);
  
  // Use mutation for updates
  const updateMutation = useUpdateProfileMutation();
  
  return <ProfileView profile={profile} />;
}
```

## Behavior checks

This store is responsible for:

- Display user information including username, avatar, and music statistics
- Display match history with past opponents and game results
- Send updates to Backend_API when profile changes are saved

## Testing

Unit tests are located in `profile-store.test.ts` and cover:
- Initial state
- Setting profile data
- Updating profile with partial data
- Setting match history
- Setting music statistics
- Clearing state
- Behavior checks

Run tests:
```bash
nx test profile --testFile=stores/profile-store.test.ts
```

## Architecture Notes

- Uses Zustand with `devtools` middleware for debugging
- Uses `immer` middleware for immutable state updates
- No persistence configured (profile data is fetched from server on app launch)
- Follows the same patterns as other module stores for consistency
- Clear separation between client state (Zustand) and server state (TanStack Query)
