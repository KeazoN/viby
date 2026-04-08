/**
 * Chat module types
 */

export interface User {
  id: string;
  username: string;
  avatar: string | null;
}

export interface Message {
  id: string;
  roomId: string;
  userId: string;
  content: string;
  status: MessageStatus;
  createdAt: string;
  user?: User;
}

export type MessageStatus = 'sending' | 'sent' | 'failed';

// WebSocket event payloads
export interface MessageReceivedPayload {
  message: Message;
  timestamp: Date;
}

export interface TypingIndicatorPayload {
  roomId: string;
  userId: string;
  isTyping: boolean;
  timestamp: Date;
}

export interface ReadReceiptPayload {
  roomId: string;
  userId: string;
  messageId: string;
  timestamp: Date;
}

// API request/response types
export interface SendMessageRequest {
  roomId: string;
  content: string;
}

export interface SendMessageResponse {
  message: Message;
}

export interface LoadHistoryRequest {
  roomId: string;
  limit?: number;
  offset?: number;
}

export interface LoadHistoryResponse {
  messages: Message[];
  hasMore: boolean;
}
