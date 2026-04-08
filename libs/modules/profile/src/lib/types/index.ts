/**
 * Profile module types
 */

export interface User {
  id: string;
  username: string;
  avatar: string | null;
  email: string;
  createdAt: string;
}

export interface Profile {
  id: string;
  userId: string;
  username: string;
  avatar: string | null;
  bio: string | null;
  musicStats: MusicStats | null;
  preferences: UserPreferences;
  spotifyLinked: boolean;
  deezerLinked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MusicStats {
  topArtists: Artist[];
  topTracks: Track[];
  topGenres: string[];
  totalListeningTime: number; // in seconds
  totalMatches: number;
  totalGamesPlayed: number;
}

export interface Artist {
  id: string;
  name: string;
  image: string | null;
  genres: string[];
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

export interface UserPreferences {
  notificationsEnabled: boolean;
  matchNotifications: boolean;
  messageNotifications: boolean;
  privacyMode: 'public' | 'friends' | 'private';
}

export interface Match {
  id: string;
  users: MatchUser[];
  track: Track;
  gameResult: GameResult | null;
  createdAt: string;
  completedAt: string | null;
}

export interface MatchUser {
  id: string;
  username: string;
  avatar: string | null;
}

export interface GameResult {
  winner: string | null; // userId or null for tie
  scores: Record<string, number>;
  totalRounds: number;
}

// API request/response types
export interface GetProfileRequest {
  userId: string;
}

export interface GetProfileResponse {
  profile: Profile;
}

export interface UpdateProfileRequest {
  username?: string;
  avatar?: string;
  bio?: string;
  preferences?: Partial<UserPreferences>;
}

export interface UpdateProfileResponse {
  profile: Profile;
}

export interface GetMatchHistoryRequest {
  userId?: string;
  limit?: number;
  offset?: number;
}

export interface GetMatchHistoryResponse {
  matches: Match[];
  hasMore: boolean;
  total: number;
}

export interface GetMusicStatsRequest {
  userId?: string;
}

export interface GetMusicStatsResponse {
  stats: MusicStats;
}
