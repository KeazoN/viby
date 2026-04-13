import { useEffect, useState } from 'react';
import { AppStateStatus } from 'react-native';
import { appStateManager } from '../app-state-manager';

/**
 * Hook to listen to app state changes
 * 
 * Automatically initializes the AppStateManager on mount and cleans up on unmount.
 * Provides the current app state and allows subscribing to state changes.
 * 
 * @returns Current app state status
 * 
 * @example
 * ```typescript
 * function MyComponent() {
 *   const appState = useAppStateListener();
 * 
 *   useEffect(() => {
 *     if (appState === 'active') {
 *       console.log('App is in foreground');
 *     } else if (appState === 'background') {
 *       console.log('App is in background');
 *     }
 *   }, [appState]);
 * 
 *   return <Text>App State: {appState}</Text>;
 * }
 * ```
 */
export function useAppStateListener(): AppStateStatus {
  const [appState, setAppState] = useState<AppStateStatus>(
    appStateManager.getCurrentState()
  );

  useEffect(() => {
    // Initialize the app state manager
    appStateManager.initialize();

    // Subscribe to app state changes
    const unsubscribe = appStateManager.subscribe((state) => {
      setAppState(state);
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  return appState;
}

/**
 * Hook to execute callbacks on app state transitions
 * 
 * @param options - Callbacks for different app state transitions
 * 
 * @example
 * ```typescript
 * function MyComponent() {
 *   useAppStateTransitions({
 *     onForeground: () => {
 *       console.log('App entered foreground');
 *       // Refresh data, reconnect, etc.
 *     },
 *     onBackground: () => {
 *       console.log('App entered background');
 *       // Pause operations, save state, etc.
 *     },
 *   });
 * 
 *   return <View>...</View>;
 * }
 * ```
 */
export function useAppStateTransitions(options: {
  onForeground?: () => void;
  onBackground?: () => void;
  onInactive?: () => void;
}): void {
  const { onForeground, onBackground, onInactive } = options;

  useEffect(() => {
    // Initialize the app state manager
    appStateManager.initialize();

    let previousState = appStateManager.getCurrentState();

    // Subscribe to app state changes
    const unsubscribe = appStateManager.subscribe((nextState) => {
      // Detect transition to foreground
      if (
        previousState.match(/inactive|background/) &&
        nextState === 'active' &&
        onForeground
      ) {
        onForeground();
      }

      // Detect transition to background
      if (
        previousState.match(/active|foreground/) &&
        nextState === 'background' &&
        onBackground
      ) {
        onBackground();
      }

      // Detect transition to inactive
      if (nextState === 'inactive' && onInactive) {
        onInactive();
      }

      previousState = nextState;
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, [onForeground, onBackground, onInactive]);
}
