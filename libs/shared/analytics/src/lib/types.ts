/**
 * Analytics Types
 * 
 * Type definitions for analytics events and configuration
 */

/**
 * Analytics event names
 */
export enum AnalyticsEvent {
  // App lifecycle
  APP_LAUNCH = 'app_launch',
  APP_FOREGROUND = 'app_foreground',
  APP_BACKGROUND = 'app_background',
  
  // Screen views
  SCREEN_VIEW = 'screen_view',
  
  // Authentication
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  LOGOUT = 'logout',
  OAUTH_STARTED = 'oauth_started',
  OAUTH_COMPLETED = 'oauth_completed',
  
  // Discovery
  DISCOVERY_VIEWED = 'discovery_viewed',
  TRACK_CLUSTER_VIEWED = 'track_cluster_viewed',
  CURRENTLY_PLAYING_UPDATED = 'currently_playing_updated',
  
  // Matchmaking
  MATCH_REQUEST = 'match_request',
  MATCH_FOUND = 'match_found',
  MATCH_ACCEPTED = 'match_accepted',
  MATCH_DECLINED = 'match_declined',
  MATCH_EXPIRED = 'match_expired',
  
  // Game
  GAME_STARTED = 'game_started',
  GAME_ROUND_STARTED = 'game_round_started',
  GAME_ANSWER_SUBMITTED = 'game_answer_submitted',
  GAME_ROUND_COMPLETED = 'game_round_completed',
  GAME_COMPLETED = 'game_completed',
  
  // Chat
  MESSAGE_SENT = 'message_sent',
  MESSAGE_RECEIVED = 'message_received',
  CHAT_OPENED = 'chat_opened',
  
  // Profile
  PROFILE_VIEWED = 'profile_viewed',
  PROFILE_UPDATED = 'profile_updated',
  
  // Performance
  API_REQUEST = 'api_request',
  API_ERROR = 'api_error',
  WEBSOCKET_CONNECTED = 'websocket_connected',
  WEBSOCKET_DISCONNECTED = 'websocket_disconnected',
  WEBSOCKET_ERROR = 'websocket_error',
  SCREEN_TRANSITION = 'screen_transition',
  
  // Errors
  ERROR_OCCURRED = 'error_occurred',
  CRASH = 'crash',
}

/**
 * Analytics event properties
 */
export interface AnalyticsEventProperties {
  [key: string]: string | number | boolean | undefined;
}

/**
 * User properties for analytics
 */
export interface AnalyticsUserProperties {
  userId?: string;
  username?: string;
  provider?: 'spotify' | 'deezer';
  [key: string]: string | number | boolean | undefined;
}

/**
 * Analytics configuration
 */
export interface AnalyticsConfig {
  enabled: boolean;
  debug?: boolean;
  batchSize?: number;
  flushInterval?: number;
}

/**
 * PII (Personally Identifiable Information) patterns to filter
 */
export const PII_PATTERNS = {
  EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  PHONE: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
  TOKEN: /(?:bearer\s+)?[a-zA-Z0-9_-]{20,}/gi,
  PASSWORD: /password|passwd|pwd/i,
  CREDIT_CARD: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  SSN: /\b\d{3}-\d{2}-\d{4}\b/g,
  IP_ADDRESS: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
};

/**
 * Sensitive keys that should be filtered from analytics
 */
export const SENSITIVE_KEYS = [
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'access_token',
  'refresh_token',
  'authorization',
  'auth',
  'secret',
  'apiKey',
  'api_key',
  'privateKey',
  'private_key',
  'email',
  'phone',
  'phoneNumber',
  'phone_number',
  'creditCard',
  'credit_card',
  'ssn',
  'socialSecurityNumber',
  'social_security_number',
  'address',
  'ipAddress',
  'ip_address',
];
