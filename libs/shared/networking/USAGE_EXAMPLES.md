# HTTP Client Usage Examples

## Basic CRUD Operations

### Fetching Data

```typescript
import { httpClient } from '@viby/shared/networking';

// Get a single user
async function getUser(userId: string) {
  try {
    const user = await httpClient.get<User>(`/users/${userId}`);
    console.log('User:', user);
    return user;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw error;
  }
}

// Get a list of users
async function getUsers() {
  const users = await httpClient.get<User[]>('/users');
  return users;
}

// Get with query parameters
async function searchUsers(query: string) {
  const users = await httpClient.get<User[]>('/users', {
    params: { q: query, limit: 10 },
  });
  return users;
}
```

### Creating Data

```typescript
// Create a new user
async function createUser(userData: CreateUserDto) {
  const newUser = await httpClient.post<User>('/users', userData);
  return newUser;
}

// Upload with form data
async function uploadAvatar(userId: string, file: File) {
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await httpClient.post<{ url: string }>(
    `/users/${userId}/avatar`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.url;
}
```

### Updating Data

```typescript
// Full update with PUT
async function updateUser(userId: string, userData: UpdateUserDto) {
  const updatedUser = await httpClient.put<User>(
    `/users/${userId}`,
    userData
  );
  return updatedUser;
}

// Partial update with PATCH
async function updateUserEmail(userId: string, email: string) {
  const updatedUser = await httpClient.patch<User>(`/users/${userId}`, {
    email,
  });
  return updatedUser;
}
```

### Deleting Data

```typescript
async function deleteUser(userId: string) {
  await httpClient.delete(`/users/${userId}`);
}
```

## Viby-Specific Examples

### Authentication

```typescript
// Login (no token required)
async function login(email: string, password: string) {
  const response = await httpClient.post<AuthResponse>('/auth/login', {
    email,
    password,
  });

  // Tokens are automatically stored by the auth module
  return response;
}

// Logout
async function logout() {
  await httpClient.post('/auth/logout');
  // Tokens are automatically cleared
}
```

### Currently Playing

```typescript
// Get currently playing track
async function getCurrentlyPlaying() {
  const track = await httpClient.get<Track>('/tracking/currently-playing');
  return track;
}

// Update currently playing
async function updateCurrentlyPlaying(trackId: string) {
  await httpClient.post('/tracking/currently-playing', { trackId });
}
```

### Discovery

```typescript
// Get active listeners
async function getActiveListeners() {
  const listeners = await httpClient.get<Listener[]>('/discovery/listeners');
  return listeners;
}

// Get track clusters
async function getTrackClusters() {
  const clusters = await httpClient.get<TrackCluster[]>(
    '/discovery/track-clusters'
  );
  return clusters;
}
```

### Matchmaking

```typescript
// Request a match
async function requestMatch(trackId: string) {
  const match = await httpClient.post<Match>('/matchmaking/request', {
    trackId,
  });
  return match;
}

// Accept a match
async function acceptMatch(matchId: string) {
  const gameSession = await httpClient.post<GameSession>(
    `/matchmaking/${matchId}/accept`
  );
  return gameSession;
}

// Decline a match
async function declineMatch(matchId: string) {
  await httpClient.post(`/matchmaking/${matchId}/decline`);
}
```

### Game

```typescript
// Submit answer
async function submitAnswer(roomId: string, answer: string) {
  const result = await httpClient.post<AnswerResult>(
    `/game/${roomId}/answer`,
    { answer }
  );
  return result;
}

// Leave game
async function leaveGame(roomId: string) {
  await httpClient.post(`/game/${roomId}/leave`);
}
```

### Chat

```typescript
// Load chat history
async function loadChatHistory(roomId: string, limit = 50) {
  const messages = await httpClient.get<Message[]>(`/chat/${roomId}/history`, {
    params: { limit },
  });
  return messages;
}

// Send message (via WebSocket is preferred, but HTTP fallback available)
async function sendMessage(roomId: string, content: string) {
  const message = await httpClient.post<Message>(`/chat/${roomId}/messages`, {
    content,
  });
  return message;
}
```

### Profile

```typescript
// Get user profile
async function getProfile(userId: string) {
  const profile = await httpClient.get<Profile>(`/profile/${userId}`);
  return profile;
}

// Update profile
async function updateProfile(updates: Partial<Profile>) {
  const profile = await httpClient.patch<Profile>('/profile', updates);
  return profile;
}

// Get match history
async function getMatchHistory() {
  const matches = await httpClient.get<Match[]>('/profile/match-history');
  return matches;
}

// Get music stats
async function getMusicStats() {
  const stats = await httpClient.get<MusicStats>('/profile/music-stats');
  return stats;
}
```

## Error Handling

### Basic Error Handling

```typescript
import { AxiosError } from 'axios';

async function fetchUserWithErrorHandling(userId: string) {
  try {
    const user = await httpClient.get<User>(`/users/${userId}`);
    return user;
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.response) {
        // Server responded with error status
        console.error('Server error:', error.response.status);
        console.error('Error data:', error.response.data);
      } else if (error.request) {
        // Request was made but no response received
        console.error('Network error:', error.message);
      } else {
        // Something else happened
        console.error('Error:', error.message);
      }
    }
    throw error;
  }
}
```

### Handling Specific Status Codes

```typescript
async function fetchUserWithStatusHandling(userId: string) {
  try {
    const user = await httpClient.get<User>(`/users/${userId}`);
    return user;
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      switch (error.response.status) {
        case 404:
          console.error('User not found');
          return null;
        case 403:
          console.error('Access forbidden');
          throw new Error('You do not have permission to view this user');
        case 500:
          console.error('Server error');
          throw new Error('Server error, please try again later');
        default:
          throw error;
      }
    }
    throw error;
  }
}
```

### Retry with Custom Logic

```typescript
async function fetchWithCustomRetry<T>(
  url: string,
  maxAttempts = 3
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await httpClient.get<T>(url);
    } catch (error) {
      lastError = error as Error;
      console.log(`Attempt ${attempt} failed, retrying...`);

      if (attempt < maxAttempts) {
        // Wait before retrying
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * Math.pow(2, attempt - 1))
        );
      }
    }
  }

  throw lastError!;
}
```

## Advanced Usage

### Custom Headers

```typescript
// Add custom headers to a single request
async function fetchWithCustomHeaders() {
  const data = await httpClient.get('/data', {
    headers: {
      'X-Custom-Header': 'value',
      'Accept-Language': 'en-US',
    },
  });
  return data;
}
```

### Request Timeout

```typescript
// Override timeout for a specific request
async function fetchWithCustomTimeout() {
  const data = await httpClient.get('/slow-endpoint', {
    timeout: 30000, // 30 seconds
  });
  return data;
}
```

### Cancel Requests

```typescript
import axios from 'axios';

async function fetchWithCancellation() {
  const source = axios.CancelToken.source();

  // Start the request
  const promise = httpClient.get('/data', {
    cancelToken: source.token,
  });

  // Cancel after 5 seconds
  setTimeout(() => {
    source.cancel('Request cancelled by user');
  }, 5000);

  try {
    const data = await promise;
    return data;
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request cancelled:', error.message);
    } else {
      throw error;
    }
  }
}
```

### Response Transformation

```typescript
// Transform response data
async function fetchWithTransformation() {
  const axiosInstance = httpClient.getAxiosInstance();

  const response = await axiosInstance.get('/users', {
    transformResponse: [
      (data) => {
        const parsed = JSON.parse(data);
        // Transform the data
        return parsed.map((user: any) => ({
          ...user,
          fullName: `${user.firstName} ${user.lastName}`,
        }));
      },
    ],
  });

  return response.data;
}
```

### Progress Tracking

```typescript
// Track upload progress
async function uploadWithProgress(file: File, onProgress: (progress: number) => void) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await httpClient.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      const progress = progressEvent.total
        ? (progressEvent.loaded / progressEvent.total) * 100
        : 0;
      onProgress(progress);
    },
  });

  return response;
}
```

## Integration with TanStack Query

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { httpClient } from '@viby/shared/networking';

// Query hook
function useUser(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => httpClient.get<User>(`/users/${userId}`),
  });
}

// Mutation hook with optimistic update
function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: Partial<User> }) =>
      httpClient.patch<User>(`/users/${userId}`, data),
    onMutate: async ({ userId, data }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['user', userId] });

      // Snapshot previous value
      const previousUser = queryClient.getQueryData(['user', userId]);

      // Optimistically update
      queryClient.setQueryData(['user', userId], (old: User) => ({
        ...old,
        ...data,
      }));

      return { previousUser };
    },
    onError: (err, { userId }, context) => {
      // Rollback on error
      if (context?.previousUser) {
        queryClient.setQueryData(['user', userId], context.previousUser);
      }
    },
    onSettled: (data, error, { userId }) => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
    },
  });
}
```

## Testing

### Mocking HTTP Client in Tests

```typescript
import { httpClient } from '@viby/shared/networking';

jest.mock('@viby/shared/networking', () => ({
  httpClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('UserService', () => {
  it('should fetch user', async () => {
    const mockUser = { id: '1', name: 'Test User' };
    (httpClient.get as jest.Mock).mockResolvedValue(mockUser);

    const user = await userService.getUser('1');

    expect(httpClient.get).toHaveBeenCalledWith('/users/1');
    expect(user).toEqual(mockUser);
  });
});
```
