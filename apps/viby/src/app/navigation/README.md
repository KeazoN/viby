# Navigation Structure

This directory contains the complete navigation configuration for the Viby mobile app using React Navigation v7.

## Architecture

The navigation follows a hierarchical structure:

```
NavigationContainer (Root)
├── RootStackNavigator
    ├── AuthStackNavigator (Unauthenticated)
    │   ├── Welcome
    │   ├── Login
    │   ├── OAuth
    │   └── Onboarding
    │
    └── MainTabNavigator (Authenticated)
        ├── Discovery (Tab)
        ├── Profile (Tab)
        ├── Settings (Tab)
        └── Modal Screens
            ├── Match (Modal)
            ├── Game (Modal)
            └── Chat (Modal)
```

## Files

### `types.ts`
Defines TypeScript types for all navigation stacks and their parameters. This ensures type-safe navigation throughout the app.

**Key Types:**
- `RootStackParamList`: Root-level navigation parameters
- `AuthStackParamList`: Authentication flow parameters
- `MainTabParamList`: Main tab navigation parameters

### `linking.ts`
Configures deep linking support for the app. Maps URL schemes and paths to specific screens.

**Supported URL Schemes:**
- `viby://`
- `https://viby.app`
- `https://*.viby.app`

**Example Deep Links:**
- `viby://match/123` → Opens Match screen with matchId=123
- `viby://game/abc` → Opens Game screen with roomId=abc
- `viby://profile/user123` → Opens Profile screen for user123

**Authentication Checks:**
Deep links to protected screens (Match, Game, Chat, Main) require authentication. If a user is not authenticated, the deep link is stored and the user is redirected to the auth flow. After successful authentication, the user is automatically navigated to the intended destination.

See [DEEP_LINKING_GUIDE.md](./DEEP_LINKING_GUIDE.md) for detailed documentation.

### `deep-link-handler.ts`
Core logic for deep link authentication checks and pending link management.

**Key Functions:**
- `isProtectedScreen()` - Check if a screen requires authentication
- `setPendingDeepLink()` - Store a pending deep link for later navigation
- `getPendingDeepLink()` - Retrieve and clear the pending deep link
- `handleDeepLink()` - Handle deep link with authentication check
- `processPendingDeepLink()` - Navigate to pending deep link after auth
### `NavigationContainer.tsx`
Root navigation component that wraps the entire app. Handles:
- Deep linking configuration
- Navigation state management
- Authentication-based routing
- Deep link authentication checks
- Pending deep link processing after authentication
### `RootStackNavigator.tsx`
Top-level stack navigator that switches between:
- **Auth flow** (for unauthenticated users)
- **Main app** (for authenticated users)
- **Modal screens** (Match, Game, Chat)

The navigator conditionally renders based on authentication state from the Auth Zustand store.

### `AuthStackNavigator.tsx`
Handles the authentication flow:
1. **Welcome** - App introduction and branding
2. **Login** - OAuth provider selection (Spotify/Deezer)
3. **OAuth** - OAuth callback and token exchange
4. **Onboarding** - Initial user setup

All screens use fade animations for smooth transitions.

### `MainTabNavigator.tsx`
Bottom tab navigation for authenticated users:
- **Discovery** - Realtime listener feed and track clusters
- **Profile** - User profile, match history, music stats
- **Settings** - App settings and preferences

Uses a dark theme with neon accent colors (#00ff88).

## Usage

### Basic Navigation

```typescript
import { useNavigation } from '@react-navigation/native';
import type { RootStackParamList } from './navigation/types';

function MyComponent() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  
  // Navigate to a screen
  navigation.navigate('Match', { matchId: '123' });
  
  // Go back
  navigation.goBack();
}
```

### Type-Safe Navigation

```typescript
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from './navigation/types';

type MatchScreenProps = NativeStackScreenProps<RootStackParamList, 'Match'>;

function MatchScreen({ route, navigation }: MatchScreenProps) {
  const { matchId } = route.params; // Type-safe params
  
  // Navigate with type checking
  navigation.navigate('Game', { roomId: 'abc' });
}
```

### Deep Linking

Deep links are automatically handled by the linking configuration with authentication checks:

```typescript
// External link: viby://match/123
// If authenticated: Navigates directly to Match screen
// If not authenticated: Redirects to auth, then navigates after login

// From notification:
Linking.openURL('viby://game/abc');

// Manual deep link handling:
import { handleDeepLink } from './navigation';

handleDeepLink(
  navigationRef,
  isAuthenticated,
  'Match',
  { matchId: '123' }
);
```

**Protected Screens:**
The following screens require authentication:
- `Match` - Match notification screen
- `Game` - Game session screen  
- `Chat` - Chat screen
- `Main` - Main app (Discovery, Profile, Settings tabs)

**Authentication Flow:**
1. User clicks deep link to protected screen while unauthenticated
2. Deep link is stored as pending
3. User is redirected to Welcome screen (auth flow)
4. User completes OAuth authentication
5. User is automatically navigated to the intended destination

See [DEEP_LINKING_GUIDE.md](./DEEP_LINKING_GUIDE.md) for comprehensive documentation.

## Authentication Flow

The navigation automatically switches between Auth and Main flows based on the `isAuthenticated` state from the Auth Zustand store:

```typescript
// In App.tsx
const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

<NavigationContainer isAuthenticated={isAuthenticated} />
```

When `isAuthenticated` changes:
- `false` → Shows AuthStackNavigator (Welcome, Login, OAuth, Onboarding)
- `true` → Shows MainTabNavigator (Discovery, Profile, Settings) + Modal screens

## Modal Screens

Modal screens are presented as overlays on top of the current screen:

- **Match** - Match notification with user profile preview
- **Game** - Music trivia game session
- **Chat** - Realtime messaging interface

All modals use `slide_from_bottom` animation and `modal` presentation style.

## Navigation capabilities

- Tab-based main app with Discovery, Profile, and Settings
- Game and Chat as modal overlays
- Deep linking for match notifications and game invitations
- Authentication check before opening protected destinations
- Separate auth stack vs main app stack
- Guests only see the authentication flow

## Roadmap

- Flesh out screen UIs and tab bar icons
- Extend flows for match, game, and chat as product needs evolve

## Notes

- Screen components can be evolved independently of this navigation shell
