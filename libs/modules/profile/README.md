# Profile Module

The Profile module handles user profile data, match history, and music statistics for the Viby mobile application.

## Overview

This module provides services for:
- Fetching user profile information
- Updating user profile data (username, avatar, bio, preferences)
- Retrieving match history with pagination
- Fetching music statistics (top artists, tracks, genres)

## Architecture

```
profile/
├── src/
│   ├── lib/
│   │   ├── services/
│   │   │   ├── profile-service.ts       # Profile API service
│   │   │   ├── profile-service.test.ts  # Unit tests
│   │   │   └── index.ts
│   │   ├── stores/                      # Zustand stores (future)
│   │   ├── hooks/                       # React hooks (future)
│   │   └── types/
│   │       └── index.ts                 # TypeScript types
│   └── index.ts
├── jest.config.js
├── tsconfig.json
├── tsconfig.spec.json
└── README.md
```

## Services

### ProfileService

The `ProfileService` class provides methods for interacting with the profile API endpoints.

#### Methods

##### `getProfile(userId: string): Promise<Profile>`

Fetches user profile data by user ID.

**Parameters:**
- `userId` - The user ID to fetch profile for

**Returns:** Promise resolving to the user profile

**Example:**
```typescript
import { profileService } from '@viby/modules/profile';

const profile = await profileService.getProfile('user-123');
console.log(profile.username, profile.avatar);
```

##### `updateProfile(updates: UpdateProfileRequest): Promise<Profile>`

Updates the current user's profile.

**Parameters:**
- `updates` - Partial profile updates (username, avatar, bio, preferences)

**Returns:** Promise resolving to the updated profile

**Example:**
```typescript
const updatedProfile = await profileService.updateProfile({
  username: 'newusername',
  avatar: 'https://example.com/avatar.jpg',
  preferences: {
    notificationsEnabled: false
  }
});
```

##### `getMatchHistory(options?: { limit?: number; offset?: number }): Promise<GetMatchHistoryResponse>`

Fetches match history for the current user with pagination support.

**Parameters:**
- `options.limit` - Maximum number of matches to return (optional)
- `options.offset` - Number of matches to skip (optional)

**Returns:** Promise resolving to match history with pagination info

**Example:**
```typescript
const history = await profileService.getMatchHistory({ limit: 10, offset: 0 });
console.log(`Total matches: ${history.total}`);
console.log(`Has more: ${history.hasMore}`);
```

##### `getMusicStats(): Promise<MusicStats>`

Fetches music statistics for the current user.

**Returns:** Promise resolving to music statistics

**Example:**
```typescript
const stats = await profileService.getMusicStats();
console.log('Top Artists:', stats.topArtists);
console.log('Top Tracks:', stats.topTracks);
console.log('Total Listening Time:', stats.totalListeningTime);
```

## Types

### Profile

```typescript
interface Profile {
  id: string;
  userId: string;
  username: string;
  avatar: string | null;
  bio: string | null;
  musicStats: MusicStats | null;
  preferences: UserPreferences;
  spotifyLinked: boolean;
  deezerLinked: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### MusicStats

```typescript
interface MusicStats {
  topArtists: Artist[];
  topTracks: Track[];
  topGenres: string[];
  totalListeningTime: number; // in seconds
  totalMatches: number;
  totalGamesPlayed: number;
}
```

### Match

```typescript
interface Match {
  id: string;
  users: MatchUser[];
  track: Track;
  gameResult: GameResult | null;
  createdAt: string;
  completedAt: string | null;
}
```

## API Endpoints

The ProfileService integrates with the following backend endpoints:

- `GET /profile/:userId` - Get user profile
- `PATCH /profile` - Update user profile
- `GET /profile/matches` - Get match history (with pagination)
- `GET /profile/music-stats` - Get music statistics

## Testing

The module includes comprehensive unit tests covering:
- Profile fetching with various scenarios
- Profile updates (username, avatar, preferences)
- Match history with pagination
- Music statistics
- Error handling

Run tests:
```bash
npm test -- libs/modules/profile
```

## Features

This module covers:

- Display user information including username, avatar, and music statistics
- Display match history with past opponents and game results
- Allow users to edit their username and avatar
- Send updates to Backend_API when profile changes are saved
- Display user's top artists, tracks, and genres from streaming service

## Integration

The Profile module integrates with:
- **@viby/shared/networking** - HTTP client for API calls
- **@viby/shared/query** - TanStack Query for server state management (future)
- **@viby/modules/auth** - Authentication state for current user context (future)

## Future Enhancements

Planned features for future tasks:
- Profile store (Zustand) for client-side state management
- React hooks for profile queries and mutations
- Optimistic updates for profile changes
- Cache invalidation strategies
- Profile screen components
