/**
 * Matchmaking module types
 */

export interface User {
  id: string;
  username: string;
  avatar: string | null;
}

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

export interface Match {
  id: string;
  trackId: string;
  track: Track;
  users: User[];
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: string;
  expiresAt: string;
}

export type MatchStatus = 'pending' | 'accepted' | 'declined' | 'expired';

// WebSocket event payloads
export interface MatchCreatedPayload {
  match: Match;
  timestamp: Date;
}

export interface MatchAcceptedPayload {
  matchId: string;
  roomId: string;
  timestamp: Date;
}

export interface MatchDeclinedPayload {
  matchId: string;
  timestamp: Date;
}

export interface MatchExpiredPayload {
  matchId: string;
  timestamp: Date;
}

// API request/response types
export interface RequestMatchRequest {
  trackId: string;
}

export interface RequestMatchResponse {
  match: Match;
}

export interface AcceptMatchResponse {
  roomId: string;
  match: Match;
}
