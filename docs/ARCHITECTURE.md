# Viby Mobile App - Architecture Documentation

## Table of Contents

- [Overview](#overview)
- [High-Level Architecture](#high-level-architecture)
- [NX Monorepo Structure](#nx-monorepo-structure)
- [Module Boundaries](#module-boundaries)
- [State Management](#state-management)
- [Domain Modules](#domain-modules)
- [Shared Libraries](#shared-libraries)
- [Data Flow](#data-flow)
- [Build System](#build-system)

## Overview

Viby Mobile is a production-grade React Native application built with NX monorepo architecture. The app provides a realtime social layer on top of music streaming services, enabling users to discover who's listening to the same music, match with them, and engage through games and chat.

### Core Principles

1. **Modularity**: Clear separation between domain modules and shared libraries
2. **Scalability**: Support for 10K+ concurrent users with optimized performance
3. **Maintainability**: Strict module boundaries enforced by NX
4. **Testability**: Comprehensive unit, integration, and property-based tests
5. **Type Safety**: TypeScript strict mode throughout the codebase

### Target Platforms

- iOS 15+ (iPhone and iPad)
- Android 12+ (API 31+)

## High-Level Architecture

The application follows a layered architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────────┐
│                      Viby Mobile App                            │
│                   (React Native + Expo)                         │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Presentation Layer                     │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │  │
│  │  │ Discovery  │  │   Match    │  │   Game     │         │  │
│  │  │  Screens   │  │  Screens   │  │  Screens   │         │  │
│  │  └────────────┘  └────────────┘  └────────────┘         │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │  │
│  │  │   Chat     │  │  Profile   │  │ Onboarding │         │  │
│  │  │  Screens   │  │  Screens   │  │  Screens   │         │  │
│  │  └────────────┘  └────────────┘  └────────────┘         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                     Domain Layer                          │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │  │
│  │  │    Auth    │  │ Discovery  │  │ Matchmaking│         │  │
│  │  │   Module   │  │   Module   │  │   Module   │         │  │
│  │  └────────────┘  └────────────┘  └────────────┘         │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │  │
│  │  │    Game    │  │    Chat    │  │  Profile   │         │  │
│  │  │   Module   │  │   Module   │  │   Module   │         │  │
│  │  └────────────┘  └────────────┘  └────────────┘         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  State Management Layer                   │  │
│  │  ┌──────────────────────┐  ┌──────────────────────┐     │  │
│  │  │   Zustand Stores     │  │   TanStack Query     │     │  │
│  │  │  (Client State)      │  │  (Server State)      │     │  │
│  │  └──────────────────────┘  └──────────────────────┘     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                 Infrastructure Layer                      │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │  │
│  │  │  Realtime  │  │    HTTP    │  │  Storage   │         │  │
│  │  │  (Socket)  │  │  (Axios)   │  │   (MMKV)   │         │  │
│  │  └────────────┘  └────────────┘  └────────────┘         │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │  │
│  │  │ Navigation │  │   Design   │  │ Analytics  │         │  │
│  │  │  (RN Nav)  │  │   System   │  │  (Sentry)  │         │  │
│  │  └────────────┘  └────────────┘  └────────────┘         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ REST + WebSocket
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                      NestJS Backend                             │
│  Auth │ Tracking │ Matchmaking │ Game │ Chat │ Profile         │
└─────────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

#### Presentation Layer
- Screen components and UI logic
- User interaction handling
- Navigation between screens
- Visual feedback and animations

#### Domain Layer
- Business logic for each feature domain
- Service classes for API communication
- Zustand stores for domain-specific state
- Custom hooks for component integration

#### State Management Layer
- Zustand stores for ephemeral client state
- TanStack Query for server-side data caching
- Cache invalidation strategies
- Optimistic updates

#### Infrastructure Layer
- HTTP client with interceptors
- WebSocket connection management
- Local storage (MMKV + SecureStore)
- Navigation configuration
- Design system components
- Analytics and error tracking

## NX Monorepo Structure

The project uses NX to organize code into apps and libraries with enforced boundaries:

```
viby/
├── apps/
│   ├── viby/                          # Main React Native app
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── App.tsx            # Root component
│   │   │   │   ├── navigation/        # Navigation configuration
│   │   │   │   │   ├── RootNavigator.tsx
│   │   │   │   │   ├── AuthNavigator.tsx
│   │   │   │   │   ├── MainTabNavigator.tsx
│   │   │   │   │   ├── deep-link-handler.ts
│   │   │   │   │   └── navigation-persistence.ts
│   │   │   │   └── components/        # App-level components
│   │   │   │       ├── ErrorBoundary.tsx
│   │   │   │       └── ErrorScreen.tsx
│   │   │   └── screens/               # Screen components
│   │   │       ├── auth/              # Authentication screens
│   │   │       ├── main/              # Main tab screens
│   │   │       ├── modals/            # Modal screens
│   │   │       ├── discovery/         # Discovery components
│   │   │       └── chat/              # Chat components
│   │   ├── app.json                   # Expo configuration
│   │   ├── metro.config.js            # Metro bundler config
│   │   └── package.json
│   │
│   └── viby-backend/                  # NestJS backend (separate)
│
├── libs/
│   ├── modules/                       # Domain modules
│   │   ├── auth/
│   │   ├── discovery/
│   │   ├── matchmaking/
│   │   ├── game/
│   │   ├── chat/
│   │   ├── profile/
│   │   └── realtime/
│   │
│   └── shared/                        # Shared libraries
│       ├── design-system/
│       ├── networking/
│       ├── storage/
│       ├── query/
│       ├── monitoring/
│       ├── notifications/
│       ├── analytics/
│       ├── lifecycle/
│       ├── security/
│       ├── utils/
│       ├── types/
│       └── config/
│
├── nx.json                            # NX configuration
├── tsconfig.base.json                 # Base TypeScript config
└── package.json                       # Root dependencies
```

### Library Structure Pattern

Each library follows a consistent structure:

```
libs/<category>/<library-name>/
├── src/
│   ├── lib/
│   │   ├── services/          # API services
│   │   ├── stores/            # Zustand stores
│   │   ├── hooks/             # React hooks
│   │   ├── components/        # React components (if applicable)
│   │   ├── types/             # TypeScript types
│   │   └── utils/             # Utility functions
│   └── index.ts               # Public API exports
├── README.md                  # Library documentation
├── project.json               # NX project configuration
├── tsconfig.json              # TypeScript config
├── tsconfig.lib.json          # Library-specific TS config
└── tsconfig.spec.json         # Test-specific TS config
```

## Module Boundaries

NX enforces strict module boundaries to maintain architectural integrity:

### Dependency Rules

1. **Apps** → Can depend on any library
2. **Domain Modules** (`libs/modules/*`) → Can depend on shared libraries only
3. **Shared Libraries** (`libs/shared/*`) → Cannot depend on domain modules
4. **No Circular Dependencies** → Enforced by NX

### Dependency Graph Example

```
┌─────────────┐
│  viby (app) │
└──────┬──────┘
       │
       ├─────────────────────────────────────┐
       │                                     │
       ▼                                     ▼
┌──────────────┐                    ┌──────────────┐
│ Auth Module  │                    │ Design System│
└──────┬───────┘                    └──────────────┘
       │
       ├──────────────┬──────────────┐
       │              │              │
       ▼              ▼              ▼
┌──────────┐   ┌──────────┐   ┌──────────┐
│ Storage  │   │Networking│   │  Query   │
└──────────┘   └──────────┘   └──────────┘
```

### Visualizing Dependencies

To visualize the dependency graph:

```bash
npx nx graph
```

This opens an interactive visualization showing all projects and their dependencies.

## State Management

The application uses a dual state management approach:

### Zustand (Client State)

Used for ephemeral, client-side state:

- UI state (modals, loading indicators)
- Temporary data (form inputs, selections)
- WebSocket connection status
- Active game session state
- Chat typing indicators

**Example Store**:

```typescript
// libs/modules/auth/src/lib/stores/auth-store.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (tokens: AuthTokens) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      immer((set) => ({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        
        login: (tokens: AuthTokens) => set((state) => {
          state.isAuthenticated = true;
        }),
        
        logout: () => set((state) => {
          state.user = null;
          state.isAuthenticated = false;
        }),
        
        setUser: (user: User) => set((state) => {
          state.user = user;
        }),
      })),
      {
        name: 'auth-storage',
        partialize: (state) => ({ 
          isAuthenticated: state.isAuthenticated 
        }),
      }
    )
  )
);
```

### TanStack Query (Server State)

Used for server-fetched data with caching:

- User profiles
- Match history
- Chat message history
- Currently playing track
- Active listeners

**Example Query**:

```typescript
// libs/modules/profile/src/lib/hooks/use-profile.tsx
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@viby-mobile/shared/query';
import { profileService } from '../services/profile-service';

export function useProfile(userId: string) {
  return useQuery({
    queryKey: queryKeys.profile.detail(userId),
    queryFn: () => profileService.getProfile(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
```

### State Synchronization

WebSocket events trigger cache invalidation:

```typescript
// Example: Invalidate profile cache when profile updates
socket.on('profile:updated', (data) => {
  queryClient.invalidateQueries({
    queryKey: queryKeys.profile.detail(data.userId)
  });
});
```

## Domain Modules

### Auth Module

**Location**: `libs/modules/auth`

**Responsibilities**:
- OAuth flow management (Spotify/Deezer)
- JWT token storage and refresh
- Authentication state management
- Token injection into HTTP requests

**Key Components**:
- `AuthService`: OAuth and token management
- `useAuthStore`: Authentication state
- `useAuth`: Hook for components
- `useRequireAuth`: Protected route hook

### Discovery Module

**Location**: `libs/modules/discovery`

**Responsibilities**:
- Realtime listener feed visualization
- Track cluster management
- Currently playing detection
- Listener count updates

**Key Components**:
- `DiscoveryService`: API calls and WebSocket subscriptions
- `useDiscoveryStore`: Listener and cluster state
- `useDiscovery`: Main hook
- `useTrackClusters`: Track clustering logic
- `useCurrentlyPlaying`: Currently playing track

### Realtime Module

**Location**: `libs/modules/realtime`

**Responsibilities**:
- WebSocket connection lifecycle
- Event subscription management
- Reconnection strategy
- Message queuing for offline mode
- Client-side event bus

**Key Components**:
- `SocketManager`: WebSocket connection management
- `EventBus`: Client-side event system
- `ReconnectionStrategy`: Exponential backoff logic
- `useRealtimeStore`: Connection state

**Reconnection Strategy**:
```
Attempt 1: 1 second
Attempt 2: 2 seconds
Attempt 3: 4 seconds
Attempt 4: 8 seconds
Attempt 5: 16 seconds
Attempt 6: 32 seconds
Attempts 7-10: 60 seconds each
```

### Game Module

**Location**: `libs/modules/game`

**Responsibilities**:
- Game session state management
- Round progression
- Answer submission with optimistic updates
- Score tracking

**Key Components**:
- `GameService`: Game API and WebSocket events
- `useGameStore`: Game session state
- `useGame`: Main hook
- `useGameSession`: Session-specific hook
- `useCurrentRound`: Current round data

### Chat Module

**Location**: `libs/modules/chat`

**Responsibilities**:
- Message sending and receiving
- Typing indicators
- Read receipts
- Message history loading
- Optimistic message updates

**Key Components**:
- `ChatService`: Chat API and WebSocket events
- `useChatStore`: Message and typing state
- `useChat`: Main hook
- `useChatMessages`: Message list
- `useTypingIndicator`: Typing status

### Profile Module

**Location**: `libs/modules/profile`

**Responsibilities**:
- User profile data management
- Match history
- Settings and preferences
- Music statistics

**Key Components**:
- `ProfileService`: Profile API calls
- `useProfileStore`: Profile state
- `useProfile`: Profile query hook
- `useUpdateProfile`: Profile mutation hook
- `useMatchHistory`: Match history query

### Matchmaking Module

**Location**: `libs/modules/matchmaking`

**Responsibilities**:
- User matching based on shared listening
- Match request handling
- Match accept/decline logic
- 30-second timeout management

**Key Components**:
- `MatchmakingService`: Match API and WebSocket events
- `useMatchmakingStore`: Match state
- `useMatchmaking`: Main hook
- `useMatchWebSocket`: WebSocket subscriptions

## Shared Libraries

### Design System

**Location**: `libs/shared/design-system`

**Responsibilities**:
- Design tokens (colors, spacing, typography)
- Reusable UI components
- Animation presets
- Theme configuration
- Accessibility utilities

**Key Components**:
- `tokens`: Design tokens
- `Button`, `Card`, `Input`, `Avatar`, `Badge`, `Modal`, `Toast`
- `animations/presets`: Animation configurations
- `utils/accessibility`: Accessibility helpers

### Networking

**Location**: `libs/shared/networking`

**Responsibilities**:
- HTTP client with Axios
- Request/response interceptors
- Retry logic with exponential backoff
- Token refresh on 401
- Certificate pinning
- Request signing

**Key Components**:
- `HttpClient`: Axios wrapper
- `interceptors/`: Auth, retry, logging, token refresh
- `certificate-pinning`: SSL pinning
- `request-signer`: Request signing for critical operations

### Storage

**Location**: `libs/shared/storage`

**Responsibilities**:
- Fast key-value storage (MMKV)
- Secure token storage (SecureStore)
- Object serialization
- Storage encryption

**Key Components**:
- `StorageService`: MMKV wrapper
- `SecureStorage`: SecureStore wrapper

### Query

**Location**: `libs/shared/query`

**Responsibilities**:
- TanStack Query configuration
- Query key factories
- Cache persistence
- Default query options

**Key Components**:
- `queryClient`: Configured QueryClient
- `queryKeys`: Query key factories
- `hooks`: Base query/mutation hooks

### Monitoring

**Location**: `libs/shared/monitoring`

**Responsibilities**:
- Error tracking (Sentry)
- Error boundaries
- Global error handler
- Toast notifications for errors

**Key Components**:
- `ErrorTracker`: Sentry integration
- `ErrorHandler`: Global error handling
- `ErrorBoundary`: React error boundary
- `ToastService`: Toast notifications

### Notifications

**Location**: `libs/shared/notifications`

**Responsibilities**:
- Push notification setup
- Notification display
- Notification navigation
- Notification channels (Android)

**Key Components**:
- `NotificationService`: Expo Notifications wrapper
- `NotificationEventHandler`: Notification tap handling

### Analytics

**Location**: `libs/shared/analytics`

**Responsibilities**:
- Analytics event tracking
- PII filtering
- Event batching
- Performance metrics

**Key Components**:
- `AnalyticsService`: Analytics SDK wrapper
- `AnalyticsTracker`: Event tracking
- `PIIFilter`: PII removal from events

### Lifecycle

**Location**: `libs/shared/lifecycle`

**Responsibilities**:
- App state management (foreground/background)
- Polling frequency adjustment
- WebSocket persistence in background
- Sensitive data clearing

**Key Components**:
- `AppStateManager`: App state tracking
- `useAppStateListener`: Hook for app state changes

### Security

**Location**: `libs/shared/security`

**Responsibilities**:
- Rate limiting
- Request signing
- Certificate pinning
- Token encryption

**Key Components**:
- `RateLimiter`: Rate limiting utility
- `RequestSigner`: Request signing
- `CertificatePinning`: SSL pinning

## Data Flow

### Authentication Flow

```
User → WelcomeScreen → OAuth Provider → OAuthCallbackScreen
  → AuthService.handleOAuthCallback()
  → StorageService.setTokens()
  → useAuthStore.login()
  → Navigate to MainApp
```

### Discovery Flow

```
DiscoveryScreen mounts
  → useDiscovery() hook
  → DiscoveryService.subscribeToListenerEvents()
  → SocketManager.subscribe('listener:joined')
  → useDiscoveryStore.addListener()
  → Track clustering logic
  → UI updates with new clusters
```

### Match Flow

```
User taps "Quick Match"
  → MatchmakingService.requestMatch()
  → Backend processes match
  → WebSocket event: 'match:found'
  → useMatchmakingStore.setActiveMatch()
  → Navigate to MatchScreen
  → User accepts/declines
  → MatchmakingService.acceptMatch() / declineMatch()
  → Navigate to GameScreen or back to Discovery
```

### Game Flow

```
Match accepted
  → GameService.subscribeToGameEvents()
  → WebSocket event: 'game:round_start'
  → useGameStore.updateRound()
  → User submits answer
  → useGameStore.submitAnswer() (optimistic update)
  → GameService.submitAnswer()
  → WebSocket event: 'game:round_end'
  → useGameStore.updateScores()
  → Repeat for next round or end game
```

### Chat Flow

```
User sends message
  → useChatStore.addMessage() (optimistic update)
  → ChatService.sendMessage()
  → WebSocket event: 'chat:message_sent' (confirmation)
  → useChatStore.updateMessageStatus()
  
Opponent sends message
  → WebSocket event: 'chat:message'
  → useChatStore.addMessage()
  → UI updates with new message
```

## Build System

### NX Build Configuration

NX manages builds with dependency-aware caching:

```json
{
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "cache": true
    },
    "test": {
      "dependsOn": ["^build"],
      "cache": true
    }
  }
}
```

### Build Process

1. **Dependency Resolution**: NX computes dependency graph
2. **Incremental Builds**: Only rebuilds changed libraries
3. **Caching**: Reuses cached builds when possible
4. **Parallel Execution**: Builds independent libraries in parallel

### Build Commands

```bash
# Build all projects
npx nx run-many --target=build --all

# Build specific library
npx nx build auth

# Build with dependencies
npx nx build viby --with-deps

# View build graph
npx nx graph
```

### Metro Bundler Configuration

The app uses Metro bundler with custom configuration:

```javascript
// apps/viby/metro.config.js
const { getDefaultConfig } = require('@react-native/metro-config');
const { withNxMetro } = require('@nx/react-native');

module.exports = withNxMetro(getDefaultConfig(__dirname), {
  // NX-specific configuration
  watchFolders: [
    // Include all workspace libraries
  ],
  resolver: {
    // Custom resolver for NX paths
  },
});
```

### Code Splitting

The app implements code splitting for optimal bundle size:

- Lazy-loaded screens
- Dynamic imports for heavy modules
- Separate bundles for iOS and Android
- Asset optimization

See `apps/viby/CODE_SPLITTING_IMPLEMENTATION.md` for details.

## Performance Considerations

### Optimization Strategies

1. **Memoization**: React.memo for list items and expensive components
2. **Selectors**: Zustand selectors to minimize re-renders
3. **Virtualization**: FlatList for long lists
4. **Image Optimization**: FastImage with caching
5. **Code Splitting**: Lazy loading of screens
6. **Bundle Size**: Tree shaking and minification

### Performance Targets

- App launch: < 2 seconds
- Screen transitions: < 300ms
- WebSocket latency: < 100ms
- Memory usage: < 200MB
- Frame rate: 60 FPS

## Security Architecture

### Security Layers

1. **Transport Security**: HTTPS with certificate pinning
2. **Authentication**: JWT tokens with refresh mechanism
3. **Storage Security**: Encrypted token storage
4. **Request Security**: Request signing for critical operations
5. **Rate Limiting**: Client-side rate limiting
6. **Data Sanitization**: Input validation and PII filtering

### Security Best Practices

- Never log sensitive data (tokens, passwords)
- Clear sensitive data on app background
- Validate all API responses
- Use secure storage for tokens
- Implement certificate pinning
- Sign critical requests

## Testing Strategy

### Test Types

1. **Unit Tests**: Individual functions and components
2. **Integration Tests**: Module interactions
3. **Property-Based Tests**: Universal correctness properties
4. **Visual Regression Tests**: Storybook snapshots
5. **E2E Tests**: Complete user flows (Detox)

### Test Coverage

- Target: 80%+ code coverage
- Focus on business logic and critical paths
- Mock external dependencies (API, WebSocket)
- Use React Native Testing Library for components

## Conclusion

The Viby Mobile App architecture provides a solid foundation for a scalable, maintainable, and performant React Native application. The NX monorepo structure enforces clear boundaries, the dual state management approach separates concerns, and the modular design enables independent development and testing of features.

For more details on specific modules, refer to their individual README files in the `libs/` directory.
