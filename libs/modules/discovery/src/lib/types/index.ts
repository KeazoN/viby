/**
 * Discovery module types
 */

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  artwork: string | null;
  duration: number;
  isrc: string | null;
  provider: 'spotify' | 'deezer';
}

export interface Listener {
  userId: string;
  username: string;
  avatar: string | null;
  trackId: string;
  track: Track;
  startedAt: string;
}

export interface TrackCluster {
  trackId: string;
  track: Track;
  listenerCount: number;
  listeners: Listener[];
}

// WebSocket event payloads
export interface ListenerAddedPayload {
  listener: Listener;
  timestamp: Date;
}

export interface ListenerRemovedPayload {
  userId: string;
  timestamp: Date;
}

export interface ListenerCountUpdatePayload {
  trackId: string;
  count: number;
  timestamp: Date;
}
