import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Listener, TrackCluster, Track } from '../types';

/**
 * Discovery Store State
 * 
 * Manages discovery state on the client side including:
 * - Active listeners
 * - Track clusters (grouped listeners by track)
 * - Currently playing track
 * 
 */
interface DiscoveryState {
  listeners: Listener[];
  trackClusters: TrackCluster[];
  currentlyPlaying: Track | null;
}

/**
 * Discovery Store Actions
 */
interface DiscoveryActions {
  /**
   * Add or update a listener in the store
   * Updates track clusters automatically
   * 
   * @param listener - Listener to add or update
   * 
   */
  addListener: (listener: Listener) => void;

  /**
   * Remove a listener from the store
   * Updates track clusters automatically
   * 
   * @param userId - User ID of the listener to remove
   * 
   */
  removeListener: (userId: string) => void;

  /**
   * Update listener count for a specific track
   * 
   * @param trackId - Track ID to update
   * @param count - New listener count
   * 
   */
  updateListenerCount: (trackId: string, count: number) => void;

  /**
   * Set the currently playing track
   * 
   * @param track - Track currently playing or null if nothing is playing
   */
  setCurrentlyPlaying: (track: Track | null) => void;

  /**
   * Clear all discovery state
   */
  clear: () => void;
}

type DiscoveryStore = DiscoveryState & DiscoveryActions;

/**
 * Helper function to rebuild track clusters from listeners
 * Groups listeners by trackId and creates TrackCluster objects
 * 
 * @param listeners - Array of active listeners
 * @returns Array of track clusters
 * 
 */
function buildTrackClusters(listeners: Listener[]): TrackCluster[] {
  // Group listeners by trackId
  const clusterMap = new Map<string, Listener[]>();
  
  listeners.forEach((listener) => {
    const existing = clusterMap.get(listener.trackId) || [];
    existing.push(listener);
    clusterMap.set(listener.trackId, existing);
  });

  // Convert map to TrackCluster array
  const clusters: TrackCluster[] = [];
  clusterMap.forEach((clusterListeners, trackId) => {
    // Use the track from the first listener (all listeners in cluster have same track)
    const track = clusterListeners[0].track;
    
    clusters.push({
      trackId,
      track,
      listenerCount: clusterListeners.length,
      listeners: clusterListeners,
    });
  });

  // Sort by listener count (descending) for better UX
  return clusters.sort((a, b) => b.listenerCount - a.listenerCount);
}

/**
 * Discovery Zustand Store
 * 
 * Manages client-side discovery state with:
 * - Devtools integration for debugging
 * - Immer for immutable state updates
 * - Automatic track clustering when listeners change
 * 
 */
export const useDiscoveryStore = create<DiscoveryStore>()(
  devtools(
    immer((set) => ({
      // Initial state
      listeners: [],
      trackClusters: [],
      currentlyPlaying: null,

      // Actions
      addListener: (listener: Listener) =>
        set((state) => {
          // Find existing listener by userId
          const existingIndex = state.listeners.findIndex(
            (l) => l.userId === listener.userId
          );

          if (existingIndex >= 0) {
            // Update existing listener
            state.listeners[existingIndex] = listener;
          } else {
            // Add new listener
            state.listeners.push(listener);
          }

          // Rebuild track clusters
          state.trackClusters = buildTrackClusters(state.listeners);
        }),

      removeListener: (userId: string) =>
        set((state) => {
          // Remove listener by userId
          state.listeners = state.listeners.filter((l) => l.userId !== userId);

          // Rebuild track clusters
          state.trackClusters = buildTrackClusters(state.listeners);
        }),

      updateListenerCount: (trackId: string, count: number) =>
        set((state) => {
          // Find the track cluster and update its count
          const cluster = state.trackClusters.find((c) => c.trackId === trackId);
          if (cluster) {
            cluster.listenerCount = count;
          }
        }),

      setCurrentlyPlaying: (track: Track | null) =>
        set((state) => {
          state.currentlyPlaying = track;
        }),

      clear: () =>
        set((state) => {
          state.listeners = [];
          state.trackClusters = [];
          state.currentlyPlaying = null;
        }),
    })),
    {
      name: 'DiscoveryStore',
    }
  )
);
