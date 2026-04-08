/**
 * Game module types
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

export interface Round {
  id: string;
  roundNumber: number;
  question: string;
  options: string[];
  correctAnswer: string | null; // null until both users answer
  timeLimit: number; // seconds
  startedAt: string;
}

export interface GameSession {
  id: string;
  roomId: string;
  users: User[];
  track: Track;
  currentRound: number;
  totalRounds: number;
  scores: Record<string, number>;
  status: 'active' | 'completed' | 'abandoned';
  createdAt: string;
}

export type GameStatus = 'active' | 'completed' | 'abandoned';

// WebSocket event payloads
export interface GameStartedPayload {
  game: GameSession;
  timestamp: Date;
}

export interface RoundStartedPayload {
  roomId: string;
  round: Round;
  timestamp: Date;
}

export interface AnswerSubmittedPayload {
  roomId: string;
  userId: string;
  roundId: string;
  timestamp: Date;
}

export interface RoundEndedPayload {
  roomId: string;
  roundId: string;
  correctAnswer: string;
  scores: Record<string, number>;
  timestamp: Date;
}

export interface GameEndedPayload {
  roomId: string;
  finalScores: Record<string, number>;
  winner: string | null; // null for tie
  timestamp: Date;
}

// API request/response types
export interface SubmitAnswerRequest {
  roomId: string;
  roundId: string;
  answer: string;
}

export interface SubmitAnswerResponse {
  success: boolean;
  timestamp: string;
}

export interface LeaveGameRequest {
  roomId: string;
}

export interface LeaveGameResponse {
  success: boolean;
}
