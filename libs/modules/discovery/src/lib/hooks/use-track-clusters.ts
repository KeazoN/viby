import { useDiscoveryStore } from '../stores/discovery-store';
import type { TrackCluster } from '../types';

/**
 * useTrackClusters Hook
 * 
 * Provides access to track clusters (grouped listeners by track).
 * This is a selector hook that only subscribes to trackClusters state,
 * minimizing re-renders when other discovery state changes.
 * 
 * @returns Array of track clusters sorted by listener count
 * 
 * 
 * @example
 * ```tsx
 * function TrackClusterList() {
 *   const trackClusters = useTrackClusters();
 *   
 *   return (
 *     <FlatList
 *       data={trackClusters}
 *       renderItem={({ item }) => (
 *         <TrackClusterCard
 *           track={item.track}
 *           listenerCount={item.listenerCount}
 *         />
 *       )}
 *     />
 *   );
 * }
 * ```
 */
export function useTrackClusters(): TrackCluster[] {
  return useDiscoveryStore((state) => state.trackClusters);
}
