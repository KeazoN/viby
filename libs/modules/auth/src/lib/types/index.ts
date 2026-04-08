/**
 * Auth module types
 */

export type MusicProvider = 'spotify' | 'deezer';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  provider: MusicProvider;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface OAuthInitiateResponse {
  authUrl: string;
}
