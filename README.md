# Viby Mobile App

A production-grade React Native mobile application that provides a realtime social layer on top of music streaming services. Discover who's listening to the same music right now, match with users based on shared listening, and engage through realtime games and chat.

**Core Value Proposition**: "See who's vibing to the same music, connect instantly, play together."

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the App](#running-the-app)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Documentation](#documentation)
- [Contributing](#contributing)

## Features

- **Realtime Discovery**: See who's listening to music right now with live updates
- **Smart Matching**: Connect with users listening to the same tracks
- **Music Trivia Games**: Play realtime music trivia with your matches
- **Realtime Chat**: Message your matches during and after games
- **User Profiles**: View match history, music stats, and preferences
- **Offline Support**: Queue messages and actions when offline
- **Push Notifications**: Get notified of matches and messages
- **Accessibility**: WCAG AA compliant with screen reader support
- **Performance**: 60 FPS animations, <2s launch time, <100ms WebSocket latency

## Tech Stack

- **Framework**: React Native (Expo SDK 52)
- **Language**: TypeScript 5.x (strict mode)
- **Monorepo**: NX 22.6
- **State Management**: Zustand (client state) + TanStack Query (server state)
- **Realtime**: Socket.IO client
- **Styling**: NativeWind (Tailwind for React Native)
- **Navigation**: React Navigation v7
- **Animations**: Reanimated 3
- **Storage**: MMKV + Expo SecureStore
- **Networking**: Axios with interceptors
- **Error Tracking**: Sentry
- **Testing**: Jest, React Native Testing Library, Fast-check (property-based testing)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v20.x or higher
- **npm**: v10.x or higher (comes with Node.js)
- **Git**: Latest version
- **Expo CLI**: Installed globally (`npm install -g expo-cli`)

### Platform-Specific Requirements

#### iOS Development
- **macOS**: Required for iOS development
- **Xcode**: 15.0 or higher
- **CocoaPods**: Latest version (`sudo gem install cocoapods`)
- **iOS Simulator**: Installed via Xcode

#### Android Development
- **Android Studio**: Latest version
- **Android SDK**: API 31 (Android 12) or higher
- **Java Development Kit (JDK)**: 17 or higher
- **Android Emulator**: Configured via Android Studio

### Backend Requirements

The app requires a running NestJS backend. See `apps/viby-backend/README.md` for backend setup instructions.

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd viby
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Install iOS dependencies** (macOS only):
   ```bash
   cd apps/viby/ios
   pod install
   cd ../../..
   ```

4. **Configure environment variables**:
   
   Copy the example environment file:
   ```bash
   cp .env.example .env.development
   ```
   
   Edit `.env.development` and configure:
   ```env
   # Backend API
   API_BASE_URL=http://localhost:3000
   WS_BASE_URL=ws://localhost:3000
   
   # OAuth Credentials
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_REDIRECT_URI=viby://oauth/callback
   DEEZER_APP_ID=your_deezer_app_id
   DEEZER_REDIRECT_URI=viby://oauth/callback
   
   # Sentry (optional)
   SENTRY_DSN=your_sentry_dsn
   
   # Analytics (optional)
   ANALYTICS_API_KEY=your_analytics_key
   ```

5. **Start the backend** (in a separate terminal):
   ```bash
   cd apps/viby-backend
   npm install
   npm run start:dev
   ```

## Running the App

### Development Mode

#### Start Metro Bundler
```bash
npx nx start viby
```

#### Run on iOS Simulator
```bash
npx nx run-ios viby
```

#### Run on Android Emulator
```bash
npx nx run-android viby
```

#### Run on Physical Device
1. Install Expo Go app on your device
2. Scan the QR code displayed in the terminal
3. The app will load on your device

### Production Build

#### iOS
```bash
npx nx build-ios viby --configuration=production
```

#### Android
```bash
npx nx build-android viby --configuration=production
```

### Environment-Specific Builds

The app supports multiple environments:

- **Development**: `.env.development`
- **Staging**: `.env.staging`
- **Production**: `.env.production`

To run with a specific environment:
```bash
# Staging
npx nx start viby --configuration=staging

# Production
npx nx start viby --configuration=production
```

## Testing

### Run All Tests
```bash
npm test
```

### Run Tests for Specific Module
```bash
# Auth module
npx nx test auth

# Discovery module
npx nx test discovery

# Design system
npx nx test design-system
```

### Run Tests with Coverage
```bash
npx nx test viby --coverage
```

### Run Property-Based Tests
```bash
npx nx test viby --testPathPattern=property.test
```

### Run Integration Tests
```bash
npx nx test viby --testPathPattern=integration.test
```

### Run Specific Test File
```bash
npx nx test viby --testFile=src/app/App.test.tsx
```

### Run Tests in Watch Mode
```bash
npx nx test viby --watch
```

### Visual Regression Tests (Storybook)
```bash
# Run visual tests
npm run test:visual

# Update snapshots
npm run test:visual:update
```

### Linting
```bash
# Lint all projects
npm run lint

# Lint specific project
npx nx lint viby
```

### Format Code
```bash
npm run format
```

## Project Structure

```
viby/
├── apps/
│   ├── viby/                      # Main React Native app
│   │   ├── src/
│   │   │   ├── app/               # App root, navigation, providers
│   │   │   └── screens/           # Screen components
│   │   ├── app.json               # Expo configuration
│   │   └── package.json
│   │
│   └── viby-backend/              # NestJS backend (separate app)
│
├── libs/
│   ├── modules/                   # Domain modules
│   │   ├── auth/                  # Authentication & OAuth
│   │   ├── discovery/             # Listener discovery & track clusters
│   │   ├── matchmaking/           # User matching
│   │   ├── game/                  # Game sessions
│   │   ├── chat/                  # Realtime messaging
│   │   ├── profile/               # User profiles
│   │   └── realtime/              # WebSocket infrastructure
│   │
│   └── shared/                    # Shared libraries
│       ├── design-system/         # UI components & tokens
│       ├── networking/            # HTTP client & interceptors
│       ├── storage/               # MMKV & secure storage
│       ├── query/                 # TanStack Query config
│       ├── monitoring/            # Error tracking & logging
│       ├── notifications/         # Push notifications
│       ├── analytics/             # Analytics tracking
│       ├── lifecycle/             # App state management
│       ├── security/              # Security utilities
│       └── utils/                 # Shared utilities
│
├── .env.example                   # Environment variables template
├── .env.development               # Development environment
├── .env.staging                   # Staging environment
├── .env.production                # Production environment
├── nx.json                        # NX configuration
├── tsconfig.base.json             # Base TypeScript config
└── package.json                   # Root package.json
```

### Module Boundaries

The NX monorepo enforces strict module boundaries:

- **Apps** can depend on any library
- **Domain modules** (`libs/modules/*`) can depend on shared libraries only
- **Shared libraries** (`libs/shared/*`) cannot depend on domain modules
- **No circular dependencies** allowed (enforced by NX)

## Documentation

Comprehensive documentation is available in the following locations:

### Architecture & Design
- [Architecture Documentation](./docs/ARCHITECTURE.md) - System architecture and module structure
- [API Integration Guide](./docs/API_INTEGRATION.md) - REST endpoints and WebSocket events
- [State Management Guide](./docs/STATE_MANAGEMENT.md) - Zustand and TanStack Query patterns

### Implementation Guides
- [Accessibility Implementation](./ACCESSIBILITY_IMPLEMENTATION.md)
- [Certificate Pinning](./CERTIFICATE_PINNING_IMPLEMENTATION.md)
- [Request Signing](./REQUEST_SIGNING_IMPLEMENTATION.md)
- [Debouncing](./DEBOUNCING_IMPLEMENTATION.md)
- [Render Optimization](./RENDER_OPTIMIZATION_SUMMARY.md)
- [Code Splitting](./apps/viby/CODE_SPLITTING_IMPLEMENTATION.md)

### Module Documentation
- [Auth Module](./libs/modules/auth/README.md)
- [Discovery Module](./libs/modules/discovery/README.md)
- [Realtime Module](./libs/modules/realtime/README.md)
- [Design System](./libs/shared/design-system/README.md)
- [Networking](./libs/shared/networking/README.md)
- [Storage](./libs/shared/storage/README.md)
- [Monitoring](./libs/shared/monitoring/README.md)
- [Notifications](./libs/shared/notifications/README.md)
- [Analytics](./libs/shared/analytics/README.md)

### Test Documentation
- [Integration Tests Summary](./INTEGRATION_TESTS_SUMMARY.md)
- [Security Tests Summary](./SECURITY_TESTS_SUMMARY.md)

## Contributing

### Development Workflow

1. Create a feature branch from `main`
2. Make your changes
3. Run tests: `npm test`
4. Run linting: `npm run lint`
5. Format code: `npm run format`
6. Commit with conventional commits format
7. Push and create a pull request

### Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Example:
```
feat(auth): add Deezer OAuth support

Implement Deezer OAuth flow alongside existing Spotify authentication.
Includes token storage and refresh logic.

Closes #123
```

### Pre-commit Hooks

The project uses Husky and lint-staged to run checks before commits:

- ESLint on staged files
- Prettier formatting
- TypeScript type checking

### Code Style

- Use TypeScript strict mode
- Follow ESLint and Prettier configurations
- Write tests for new features
- Document complex logic with comments
- Use meaningful variable and function names

## Troubleshooting

### Common Issues

#### Metro Bundler Issues
```bash
# Clear Metro cache
npx nx start viby --reset-cache
```

#### iOS Build Issues
```bash
# Clean iOS build
cd apps/viby/ios
xcodebuild clean
pod install
cd ../../..
```

#### Android Build Issues
```bash
# Clean Android build
cd apps/viby/android
./gradlew clean
cd ../../..
```

#### Dependency Issues
```bash
# Clear all caches and reinstall
rm -rf node_modules
rm -rf apps/viby/node_modules
rm -rf apps/viby/ios/Pods
npm install
cd apps/viby/ios && pod install
```

### Getting Help

- Check existing [GitHub Issues](https://github.com/your-org/viby/issues)
- Review [NX Documentation](https://nx.dev)
- Review [Expo Documentation](https://docs.expo.dev)
- Review [React Native Documentation](https://reactnative.dev)

## License

MIT License - see LICENSE file for details
