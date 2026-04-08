# @viby/shared/networking

HTTP client library and network detection for the Viby mobile application with automatic token management, retry logic, request/response logging, and real-time network connectivity monitoring.

## Features

### HTTP Client
- **Automatic Token Injection**: Injects JWT access tokens into all requests via Authorization header
- **Token Refresh on 401**: Automatically refreshes expired tokens and retries failed requests
- **Retry Logic**: Exponential backoff retry for network errors and 5xx server errors
- **Request/Response Logging**: Comprehensive logging for debugging (enabled in development mode)
- **Type-Safe**: Full TypeScript support with type inference

### Network Detection
- **Real-time Monitoring**: Tracks network connectivity status using `@react-native-community/netinfo`
- **Connection Type Detection**: Identifies WiFi, cellular, and other connection types
- **Internet Reachability**: Monitors actual internet access, not just network connection
- **Event-Based Updates**: Emits events on network state changes
- **Zustand Store Integration**: Global state management for network status

### Offline Queue
- **Request Queuing**: Automatically queues failed requests when offline
- **Persistent Storage**: Persists queue to AsyncStorage for reliability
- **Automatic Processing**: Processes queue when network is restored
- **Retry Logic**: Retries failed requests up to 3 times
- **FIFO Processing**: Maintains request order during processing

## Installation

This library is part of the Viby monorepo and is automatically available to other workspace packages.

```typescript
// HTTP Client
import { httpClient } from '@viby/shared/networking';

// Network Detection
import { 
  useNetworkMonitor, 
  useNetworkState, 
  useIsOnline,
  networkMonitor 
} from '@viby/shared/networking';

// Offline Queue
import { offlineQueue } from '@viby/shared/networking';
```

## Usage

### Network Detection

#### Initialize Network Monitoring

Add the `useNetworkMonitor` hook at your app's root level:

```typescript
import { useNetworkMonitor } from '@viby/shared/networking';

export function App() {
  // Initialize network monitoring
  useNetworkMonitor();

  return <YourApp />;
}
```

#### Check Network Status

```typescript
import { useNetworkState, useIsOnline } from '@viby/shared/networking';

function MyComponent() {
  const { isConnected, isInternetReachable, connectionType } = useNetworkState();
  const isOnline = useIsOnline();

  if (!isOnline) {
    return <OfflineIndicator />;
  }

  return <OnlineContent />;
}
```

#### Listen to Network Changes

```typescript
import { useNetworkStateChange } from '@viby/shared/networking';

function MyComponent() {
  useNetworkStateChange((state) => {
    if (!state.isConnected) {
      console.log('Connection lost');
    } else if (state.isInternetReachable) {
      console.log('Connection restored');
      // Reconnect WebSocket, sync data, etc.
    }
  });

  return <YourContent />;
}
```

For detailed network detection usage, see [NETWORK_DETECTION_USAGE.md](./NETWORK_DETECTION_USAGE.md).

### Offline Queue

#### Initialize Offline Queue

Initialize the offline queue during app startup:

```typescript
import { offlineQueue } from '@viby/shared/networking';
import NetInfo from '@react-native-community/netinfo';

// In your app initialization
async function initializeApp() {
  await offlineQueue.init();
  
  // Set up automatic queue processing
  NetInfo.addEventListener(state => {
    if (state.isConnected && state.isInternetReachable) {
      offlineQueue.processQueue();
    }
  });
}
```

#### Queue Requests When Offline

```typescript
import { offlineQueue, useNetworkStore } from '@viby/shared/networking';

async function sendMessage(content: string) {
  const { isConnected, isInternetReachable } = useNetworkStore.getState();
  
  if (!isConnected || !isInternetReachable) {
    // Queue for later delivery
    await offlineQueue.enqueue({
      method: 'POST',
      url: '/api/messages',
      data: { content },
    });
    return;
  }
  
  // Send immediately if online
  await httpClient.post('/api/messages', { content });
}
```

For detailed offline queue usage, see [OFFLINE_QUEUE_USAGE.md](./OFFLINE_QUEUE_USAGE.md).

### HTTP Client

#### Basic Usage

```typescript
import { httpClient } from '@viby/shared/networking';

// GET request
const user = await httpClient.get<User>('/users/123');

// POST request
const newUser = await httpClient.post<User>('/users', {
  name: 'John Doe',
  email: 'john@example.com',
});

// PUT request
const updatedUser = await httpClient.put<User>('/users/123', {
  name: 'Jane Doe',
});

// PATCH request
const patchedUser = await httpClient.patch<User>('/users/123', {
  email: 'jane@example.com',
});

// DELETE request
await httpClient.delete('/users/123');
```

### Custom Configuration

```typescript
import { HttpClient } from '@viby/shared/networking';

const customClient = new HttpClient({
  baseURL: 'https://api.example.com',
  timeout: 5000,
  maxRetries: 2,
  enableLogging: true,
});
```

### Advanced Usage

```typescript
// Access the underlying Axios instance for advanced features
const axiosInstance = httpClient.getAxiosInstance();

// Add custom interceptors
axiosInstance.interceptors.request.use((config) => {
  // Custom logic
  return config;
});
```

## Architecture

### Interceptors

The HTTP client uses a chain of interceptors to handle various concerns:

1. **Logging Interceptor**: Logs all requests, responses, and errors (development only)
2. **Auth Interceptor**: Injects access token from secure storage
3. **Token Refresh Interceptor**: Handles 401 errors by refreshing tokens
4. **Retry Interceptor**: Retries failed requests with exponential backoff

### Token Management

The client integrates with `@viby/shared/storage` for secure token storage:

- Access tokens are automatically injected into request headers
- On 401 errors, the client attempts to refresh the token using the refresh token
- If refresh fails, all tokens are cleared and the user is logged out
- Multiple concurrent requests during token refresh are queued and retried together

### Retry Strategy

The retry interceptor handles:

- **Network errors**: Connection timeouts, network failures
- **5xx server errors**: Internal server errors, service unavailable
- **Exponential backoff**: Delays between retries increase exponentially (1s, 2s, 4s, ...)
- **Max retries**: Configurable maximum retry attempts (default: 3)

Requests are NOT retried for:

- 4xx client errors (except 401, which is handled by token refresh)
- Requests that have already been retried the maximum number of times

### Logging

In development mode, the client logs:

- **Requests**: Method, URL, headers (sanitized), request data
- **Responses**: Status, duration, response data
- **Errors**: Status, error message, duration, retry count

Authorization headers are automatically redacted in logs for security.

## Configuration

### Environment Variables

- `EXPO_PUBLIC_API_URL`: Base URL for API requests (default: `http://localhost:3000`)

### HttpClientConfig Options

```typescript
interface HttpClientConfig {
  baseURL?: string;        // Base URL for all requests
  timeout?: number;        // Request timeout in milliseconds (default: 10000)
  maxRetries?: number;     // Maximum retry attempts (default: 3)
  enableLogging?: boolean; // Enable request/response logging (default: __DEV__)
}
```

## Feature mapping

### HTTP Client
- JWT tokens included in all Backend_API requests via Authorization header
- Backend_API request failures with network error retry up to 3 times with exponential backoff
- Backend_API request failures with 5xx error retry up to 3 times
- Backend_API request failures with 4xx error (except 401) display error without retry
- 401 Unauthorized error triggers token refresh before retrying request

### Network Detection
- Show a clear indicator when connectivity is lost
- While offline, keep cached profile and message history readable where possible
- When connectivity returns, flush queued work and resync with the API

### Offline Queue
- Queue outgoing messages while offline for delivery after reconnect
- On reconnect, send queued messages and reconcile state with the API

## Testing

Run tests for the networking library:

```bash
nx test shared-networking
```

## Dependencies

- `axios`: HTTP client
- `@viby/shared/storage`: Secure token storage
- `@react-native-community/netinfo`: Network state detection
- `@react-native-async-storage/async-storage`: Offline queue persistence
- `zustand`: State management for network status
