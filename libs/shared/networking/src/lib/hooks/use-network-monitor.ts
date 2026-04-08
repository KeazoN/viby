import { useEffect } from 'react';
import { networkMonitor } from '../network-monitor';
import { useNetworkStore } from '../stores/network-store';

/**
 * Hook to initialize and manage network monitoring
 * Should be called once at the app root level
 * 
 * @example
 * ```tsx
 * function App() {
 *   useNetworkMonitor();
 *   return <YourApp />;
 * }
 * ```
 */
export function useNetworkMonitor(): void {
  useEffect(() => {
    networkMonitor.start();

    return () => {
      networkMonitor.stop();
    };
  }, []);
}

/**
 * Hook to access network state
 * Returns the current network connection status
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isConnected, isInternetReachable, connectionType } = useNetworkState();
 *   
 *   if (!isConnected) {
 *     return <OfflineIndicator />;
 *   }
 *   
 *   return <OnlineContent />;
 * }
 * ```
 */
export function useNetworkState() {
  return useNetworkStore((state) => ({
    isConnected: state.isConnected,
    isInternetReachable: state.isInternetReachable,
    connectionType: state.connectionType,
  }));
}

/**
 * Hook to check if the device is online
 * Returns true if connected and internet is reachable
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isOnline = useIsOnline();
 *   
 *   return (
 *     <View>
 *       <Text>Status: {isOnline ? 'Online' : 'Offline'}</Text>
 *     </View>
 *   );
 * }
 * ```
 */
export function useIsOnline(): boolean {
  return useNetworkStore((state) => {
    // Consider online if connected and either internet is reachable or reachability is unknown
    return state.isConnected && (state.isInternetReachable !== false);
  });
}

/**
 * Hook to listen to network state changes
 * Calls the callback whenever network state changes
 * 
 * @param callback - Function to call on network state changes
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   useNetworkStateChange((state) => {
 *     if (!state.isConnected) {
 *       showToast('Connection lost');
 *     } else {
 *       showToast('Connection restored');
 *     }
 *   });
 *   
 *   return <YourContent />;
 * }
 * ```
 */
export function useNetworkStateChange(
  callback: (state: {
    isConnected: boolean;
    isInternetReachable: boolean | null;
    connectionType: string;
  }) => void
): void {
  const networkState = useNetworkState();

  useEffect(() => {
    callback(networkState);
  }, [networkState.isConnected, networkState.isInternetReachable, networkState.connectionType]);
}
