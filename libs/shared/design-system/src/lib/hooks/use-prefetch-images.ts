/**
 * usePrefetchImages Hook
 * 
 * Prefetches images for better performance and user experience.
 * 
 * Requirements: 22.6
 * - 22.6: Prefetch album artwork for Active_Listener tracks in Track_Cluster views
 */

import { useEffect } from 'react';
import FastImage from 'react-native-fast-image';

export interface PrefetchImageOptions {
  /**
   * Image URIs to prefetch
   */
  uris: string[];
  /**
   * Loading priority (high, normal, low)
   * @default 'low'
   */
  priority?: 'high' | 'normal' | 'low';
}

/**
 * Hook to prefetch images in the background
 * 
 * @example
 * ```tsx
 * // Prefetch track artwork
 * usePrefetchImages({
 *   uris: trackClusters.map(c => c.track.artwork),
 *   priority: 'low'
 * });
 * ```
 */
export function usePrefetchImages({ uris, priority = 'low' }: PrefetchImageOptions) {
  useEffect(() => {
    if (!uris || uris.length === 0) {
      return;
    }

    const priorityMap = {
      high: FastImage.priority.high,
      normal: FastImage.priority.normal,
      low: FastImage.priority.low,
    };

    // Filter out empty/invalid URIs
    const validUris = uris.filter(uri => uri && typeof uri === 'string' && uri.trim().length > 0);

    if (validUris.length === 0) {
      return;
    }

    // Prefetch images
    const sources = validUris.map(uri => ({
      uri,
      priority: priorityMap[priority],
    }));

    FastImage.preload(sources);
  }, [uris, priority]);
}

/**
 * Hook to prefetch track artwork from track clusters
 * 
 * @example
 * ```tsx
 * const trackClusters = useTrackClusters();
 * usePrefetchTrackArtwork(trackClusters);
 * ```
 */
export function usePrefetchTrackArtwork(clusters: Array<{ track: { artwork?: string } }>) {
  const uris = clusters
    .map(c => c.track.artwork)
    .filter((uri): uri is string => !!uri);

  usePrefetchImages({ uris, priority: 'low' });
}
