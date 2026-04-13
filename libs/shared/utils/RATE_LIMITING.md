# Rate Limiting Implementation

## Overview

The RateLimiter class provides client-side rate limiting to prevent abuse by limiting the frequency of user actions. It implements a sliding window algorithm that tracks requests over time and enforces configurable limits.

## Implementation

### RateLimiter Class

Located in `libs/shared/utils/src/lib/rate-limiter.ts`

```typescript
import { RateLimiter, rateLimiter } from '@viby/shared/utils';

// Create a new instance
const limiter = new RateLimiter();

// Or use the singleton
rateLimiter.isAllowed('action:userId', 5, 60000);
```

### Key Methods

#### `isAllowed(key: string, maxRequests: number, windowMs: number): boolean`

Checks if an action is allowed based on rate limits.

- **key**: Unique identifier for the action (e.g., 'match:userId')
- **maxRequests**: Maximum number of requests allowed in the time window
- **windowMs**: Time window in milliseconds
- **Returns**: `true` if allowed, `false` if rate limit exceeded

#### `reset(key: string): void`

Resets the rate limit for a specific key.

#### `clear(): void`

Clears all rate limit data.

#### `getRequestCount(key: string, windowMs: number): number`

Returns the number of requests made in the current window.

#### `getTimeUntilAllowed(key: string, maxRequests: number, windowMs: number): number`

Returns milliseconds until the next request is allowed, or 0 if allowed now.

## Usage Examples

### Basic Usage

```typescript
import { rateLimiter } from '@viby/shared/utils';

function handleAction(userId: string) {
  const key = `action:${userId}`;
  const maxRequests = 5;
  const windowMs = 60000; // 1 minute

  if (rateLimiter.isAllowed(key, maxRequests, windowMs)) {
    // Perform the action
    performAction();
  } else {
    // Show error to user
    const timeUntil = rateLimiter.getTimeUntilAllowed(key, maxRequests, windowMs);
    showError(`Please wait ${Math.ceil(timeUntil / 1000)} seconds`);
  }
}
```

### React Hook Integration

The `useRateLimitedMatchRequest` hook in the matchmaking module demonstrates how to integrate rate limiting into React hooks:

```typescript
import { useRateLimitedMatchRequest } from '@viby/modules/matchmaking';

function TrackClusterCard({ trackId }: { trackId: string }) {
  const {
    requestMatch,
    getRemainingRequests,
    getTimeUntilAllowed,
    isRequestAllowed,
  } = useRateLimitedMatchRequest();

  const handleMatchRequest = async () => {
    try {
      const match = await requestMatch(trackId);
      console.log('Match created:', match);
    } catch (error) {
      if (error.message.includes('Too many')) {
        const timeUntil = getTimeUntilAllowed();
        showToast(`Please wait ${Math.ceil(timeUntil / 1000)} seconds`);
      } else {
        showToast('Failed to request match');
      }
    }
  };

  const remaining = getRemainingRequests();
  const isAllowed = isRequestAllowed();

  return (
    <Button
      onPress={handleMatchRequest}
      disabled={!isAllowed}
    >
      Quick Match ({remaining} left)
    </Button>
  );
}
```

### Multiple Rate Limits

You can apply different rate limits to different actions:

```typescript
import { rateLimiter } from '@viby/shared/utils';

// Match requests: 5 per minute
if (rateLimiter.isAllowed(`match:${userId}`, 5, 60000)) {
  requestMatch();
}

// Chat messages: 10 per minute
if (rateLimiter.isAllowed(`chat:${userId}`, 10, 60000)) {
  sendMessage();
}

// Profile updates: 3 per hour
if (rateLimiter.isAllowed(`profile:${userId}`, 3, 3600000)) {
  updateProfile();
}
```

## Rate Limit Configuration

### Recommended Limits

Based on requirement 17.7, the following rate limits are recommended:

| Action | Max Requests | Time Window | Key Format |
|--------|-------------|-------------|------------|
| Match Requests | 5 | 1 minute | `match:${userId}` |
| Chat Messages | 10 | 1 minute | `chat:${userId}:${roomId}` |
| Profile Updates | 3 | 1 hour | `profile:${userId}` |
| Game Actions | 20 | 1 minute | `game:${userId}:${gameId}` |
| API Calls | 100 | 1 minute | `api:${userId}` |

### Sliding Window Algorithm

The rate limiter uses a sliding window algorithm:

1. When a request is made, the current timestamp is recorded
2. Old timestamps outside the time window are removed
3. If the number of valid timestamps is less than the max, the request is allowed
4. Otherwise, the request is blocked

This provides more accurate rate limiting than fixed windows, as it considers the exact timing of each request.

## Testing

The RateLimiter class has comprehensive unit tests covering:

- Basic rate limiting functionality
- Sliding window behavior
- Multiple keys (per-user limits)
- Edge cases (zero limits, very small/large windows)
- Helper methods (getRequestCount, getTimeUntilAllowed)

Run tests:

```bash
npx vitest run libs/shared/utils/src/lib/rate-limiter.test.ts
```

## Integration Points

### Matchmaking Module

The `useRateLimitedMatchRequest` hook wraps match requests with rate limiting:

- **Location**: `libs/modules/matchmaking/src/lib/hooks/use-rate-limited-match-request.ts`
- **Limit**: 5 match requests per minute per user
- **Key Format**: `match:${userId}`

### Future Integrations

Rate limiting should be applied to:

1. **Chat Module**: Limit message sending frequency
2. **Game Module**: Limit game action frequency
3. **Profile Module**: Limit profile update frequency
4. **Discovery Module**: Limit discovery refresh frequency

## Error Handling

When rate limits are exceeded, provide clear feedback to users:

```typescript
try {
  await requestMatch(trackId);
} catch (error) {
  if (error.message.includes('Too many')) {
    // Extract wait time from error message or use getTimeUntilAllowed
    const timeUntil = rateLimiter.getTimeUntilAllowed(key, max, window);
    showToast({
      message: `Please wait ${Math.ceil(timeUntil / 1000)} seconds before trying again`,
      type: 'warning',
    });
  } else {
    // Handle other errors
    showToast({
      message: 'An error occurred. Please try again.',
      type: 'error',
    });
  }
}
```

## Performance Considerations

- The rate limiter stores timestamps in memory using a Map
- Old timestamps are automatically cleaned up when checking limits
- Memory usage is proportional to the number of active users and their request frequency
- For production apps with many users, consider implementing periodic cleanup of inactive keys

## Security Notes

- Rate limiting is implemented client-side for UX purposes
- **Server-side rate limiting is still required** for security
- Client-side limits prevent accidental abuse and improve UX
- Malicious users can bypass client-side limits, so server validation is essential

## Compliance

This implementation satisfies:

- **Requirement 17.7**: "THE Viby_App SHALL implement rate limiting for user actions to prevent abuse"
- Prevents users from spamming match requests, messages, or other actions
- Provides clear feedback when limits are reached
- Uses a fair sliding window algorithm
