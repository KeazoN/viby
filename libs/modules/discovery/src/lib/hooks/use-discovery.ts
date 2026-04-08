import { useDiscoveryStore } from '../stores/discovery-store';

/**
 * useDiscovery Hook
 * 
 * Provides access to the complete discovery state and actions.
 * 
 * @returns Discovery store state and actions
 * 
 * 
 * @example
 * ```tsx
 * function DiscoveryScreen() {
 *   const { listeners, trackClusters, currentlyPlaying } = useDiscovery();
 *   
 *   return (
 *     <View>
 *       <Text>Active Listeners: {listeners.length}</Text>
 *       <Text>Track Clusters: {trackClusters.length}</Text>
 *     </View>
 *   );
 * }
 * ```
 */
export function useDiscovery() {
  return useDiscoveryStore();
}
