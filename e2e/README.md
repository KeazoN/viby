# Viby E2E Tests

End-to-end tests for the Viby mobile application using Detox.

## Overview

This directory contains E2E tests that validate complete user flows across the Viby app. Tests are written using Detox, a gray-box testing framework for React Native apps.

## Prerequisites

### iOS
- Xcode 14+ installed
- iOS Simulator
- `applesimutils` installed: `brew tap wix/brew && brew install applesimutils`

### Android
- Android Studio installed
- Android SDK configured
- Android Emulator running (Pixel_7_API_34 or similar)
- `ANDROID_HOME` environment variable set

## Setup

1. Install dependencies:
```bash
npm install
```

2. Build the app for testing:

**iOS:**
```bash
npx detox build --configuration ios.sim.debug
```

**Android:**
```bash
npx detox build --configuration android.emu.debug
```

## Running Tests

### Run all tests

**iOS:**
```bash
npx detox test --configuration ios.sim.debug
```

**Android:**
```bash
npx detox test --configuration android.emu.debug
```

### Run specific test file

```bash
npx detox test --configuration ios.sim.debug e2e/auth.e2e.ts
```

### Run tests with specific device

```bash
npx detox test --configuration ios.sim.debug --device-name="iPhone 15 Pro"
```

### Debug mode

```bash
npx detox test --configuration ios.sim.debug --loglevel trace
```

### Record video

```bash
npx detox test --configuration ios.sim.debug --record-videos all
```

### Take screenshots

```bash
npx detox test --configuration ios.sim.debug --take-screenshots all
```

## Test Structure

```
e2e/
├── helpers/              # Test utilities and helpers
│   ├── matchers.ts       # Custom Detox matchers
│   ├── assertions.ts     # Custom assertions
│   ├── setup.ts          # Setup and teardown utilities
│   ├── mock-data.ts      # Mock data for tests
│   └── index.ts          # Exports all helpers
├── auth.e2e.ts           # Authentication flow tests
├── discovery.e2e.ts      # Discovery screen tests
├── game.e2e.ts           # Game session tests
├── chat.e2e.ts           # Chat functionality tests
├── jest.config.js        # Jest configuration for Detox
├── tsconfig.json         # TypeScript configuration
└── README.md             # This file
```

## Writing Tests

### Basic Test Structure

```typescript
import { device, element, by, expect as detoxExpect } from 'detox';
import { waitForElement, tapElement, assertVisible } from './helpers';

describe('Feature Name', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should do something', async () => {
    // Wait for element
    await waitForElement('screen-test-id');
    
    // Interact with element
    await tapElement('button-test-id');
    
    // Assert result
    await assertVisible('result-test-id');
  });
});
```

### Using Test Helpers

The `helpers/` directory provides utilities to simplify test writing:

**Matchers:**
- `waitForElement(testID, timeout)` - Wait for element to be visible
- `tapElement(testID)` - Tap an element
- `typeText(testID, text)` - Type into input field
- `scrollToElement(scrollViewID, elementID)` - Scroll to element
- `swipeElement(testID, direction)` - Swipe gesture

**Assertions:**
- `assertVisible(testID)` - Assert element is visible
- `assertScreenVisible(screenID)` - Assert screen is displayed
- `assertErrorMessage(message)` - Assert error is shown
- `assertModalVisible(modalID)` - Assert modal is open

**Setup:**
- `setupE2E()` - Initialize test environment
- `resetAppState()` - Reset app between tests
- `loginTestUser()` - Login for authenticated tests
- `setNetworkConnectivity(enabled)` - Toggle network

**Mock Data:**
- `mockUser` - Test user data
- `mockTrack` - Test track data
- `mockMatch` - Test match data
- `generateMockListeners(count)` - Generate multiple listeners

### Test IDs

All interactive elements in the app should have `testID` props for E2E testing:

```tsx
<Button testID="login-button" onPress={handleLogin}>
  Login
</Button>
```

Use descriptive, hierarchical test IDs:
- `welcome-screen`
- `login-button`
- `track-cluster-list`
- `track-cluster-item-0`
- `quick-match-button`

## Best Practices

1. **Use test IDs consistently**: Always add `testID` props to interactive elements
2. **Wait for elements**: Use `waitFor` instead of arbitrary timeouts
3. **Keep tests independent**: Each test should be able to run in isolation
4. **Use helpers**: Leverage the helper functions to keep tests DRY
5. **Test user flows**: Focus on complete user journeys, not individual components
6. **Handle async operations**: Always await Detox operations
7. **Clean up state**: Reset app state between tests
8. **Use descriptive names**: Test names should clearly describe what they test
9. **Avoid flakiness**: Use proper waits and avoid race conditions
10. **Test on both platforms**: Ensure tests pass on iOS and Android

## Debugging

### View test artifacts

Test artifacts (screenshots, videos, logs) are saved to:
- `artifacts/ios.sim.debug/`
- `artifacts/android.emu.debug/`

### Enable verbose logging

```bash
npx detox test --configuration ios.sim.debug --loglevel trace
```

### Debug specific test

```bash
npx detox test --configuration ios.sim.debug --debug-synchronization 500 e2e/auth.e2e.ts
```

### Common Issues

**App doesn't launch:**
- Ensure the app is built: `npx detox build`
- Check simulator/emulator is running
- Verify configuration in `.detoxrc.js`

**Element not found:**
- Check testID is correct
- Ensure element is rendered
- Use `waitFor` with appropriate timeout
- Check element is not hidden or off-screen

**Tests are flaky:**
- Increase timeouts
- Add proper waits for async operations
- Disable animations in test mode
- Check for race conditions

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npx detox build --configuration ios.sim.release
      - run: npx detox test --configuration ios.sim.release --cleanup

  e2e-android:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npx detox build --configuration android.emu.release
      - run: npx detox test --configuration android.emu.release --cleanup
```

## Resources

- [Detox Documentation](https://wix.github.io/Detox/)
- [Detox API Reference](https://wix.github.io/Detox/docs/api/actions)
- [React Native Testing Best Practices](https://github.com/wix/Detox/blob/master/docs/Introduction.GettingStarted.md)
- [Viby App Architecture](../docs/ARCHITECTURE.md)

## Support

For issues or questions about E2E tests, please refer to:
- Project documentation in `/docs`
- Detox GitHub issues
- Team Slack channel #viby-testing
