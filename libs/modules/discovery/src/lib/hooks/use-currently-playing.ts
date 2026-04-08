import { useDiscoveryStore } from '../stores/discovery-store';
import type { Track } from '../types';

/**
 * useCurrentlyPlaying Hook
 * 
 * Provides access to the currently playing track.
 * This is a selector hook that only subscribes to currentlyPlaying state,
 * minimizing re-renders when other discovery state changes.
 * 
 * @returns Currently playing track or null if nothing is playing
 * 
 * 
 * @example
 * ```tsx
 * function NowPlayingWidget() {
 *   const currentlyPlaying = useCurrentlyPlaying();
 *   
 *   if (!currentlyPlaying) {
 *     return <Text>Not playing anything</Text>;
 *   }
 *   
 *   return (
 *     <View>
 *       <Image source={{ uri: currentlyPlaying.artwork }} />
 *       <Text>{currentlyPlaying.title}</Text>
 *       <Text>{currentlyPlaying.artist}</Text>
 *     </View>
 *   );
 * }
 * ```
 */
export function useCurrentlyPlaying(): Track | null {
  return useDiscoveryStore((state) => state.currentlyPlaying);
}
