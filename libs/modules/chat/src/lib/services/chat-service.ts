import { httpClient } from '@viby/shared/networking';
import { socketManager } from '@viby/modules/realtime';
import { analyticsTracker } from '@viby/shared/analytics';
import { debounce, validateAndFilterMessage } from '@viby/shared/utils';
import type {
  Message,
  SendMessageResponse,
  LoadHistoryResponse,
  MessageReceivedPayload,
  TypingIndicatorPayload,
  ReadReceiptPayload,
} from '../types';

/**
 * ChatService handles realtime messaging functionality.
 * 
 * Integrates with:
 * - SocketManager from realtime module for WebSocket events
 * - HttpClient from networking module for REST API calls
 * 

 */
export class ChatService {
  private eventHandlers: Map<string, (data: any) => void> = new Map();
  private debouncedTypingIndicators: Map<string, (isTyping: boolean) => void> = new Map();

  /**
   * Subscribe to chat events from WebSocket for a specific room
   * Sets up event handlers for chat:message, chat:typing, and chat:read events
   * @param roomId - The room ID to subscribe to
   * 
   * Subscribe to WebSocket_Service chat events for message delivery
   */
  subscribeToChat(roomId: string): void {
    // Handler for chat:message event
    const messageHandler = (payload: MessageReceivedPayload) => {
      if (payload.message.roomId === roomId) {
        console.log('Message received:', payload.message);
      }
    };

    // Handler for chat:typing event
    const typingHandler = (payload: TypingIndicatorPayload) => {
      if (payload.roomId === roomId) {
        console.log('Typing indicator:', payload.userId, payload.isTyping);
      }
    };

    // Handler for chat:read event
    const readHandler = (payload: ReadReceiptPayload) => {
      if (payload.roomId === roomId) {
        console.log('Read receipt:', payload.userId, payload.messageId);
      }
    };

    // Store handlers for cleanup with room-specific keys
    this.eventHandlers.set(`chat:message:${roomId}`, messageHandler);
    this.eventHandlers.set(`chat:typing:${roomId}`, typingHandler);
    this.eventHandlers.set(`chat:read:${roomId}`, readHandler);

    // Subscribe to WebSocket events
    socketManager.subscribe('chat:message', messageHandler);
    socketManager.subscribe('chat:typing', typingHandler);
    socketManager.subscribe('chat:read', readHandler);
  }

  /**
   * Unsubscribe from chat events for a specific room
   * Cleans up all WebSocket event subscriptions for the room
   * @param roomId - The room ID to unsubscribe from
   * 
   * Clean up chat subscriptions when leaving a chat
   */
  unsubscribeFromChat(roomId: string): void {
    // Unsubscribe from all events for this room
    const messageHandler = this.eventHandlers.get(`chat:message:${roomId}`);
    const typingHandler = this.eventHandlers.get(`chat:typing:${roomId}`);
    const readHandler = this.eventHandlers.get(`chat:read:${roomId}`);

    if (messageHandler) {
      socketManager.unsubscribe('chat:message', messageHandler);
      this.eventHandlers.delete(`chat:message:${roomId}`);
    }

    if (typingHandler) {
      socketManager.unsubscribe('chat:typing', typingHandler);
      this.eventHandlers.delete(`chat:typing:${roomId}`);
    }

    if (readHandler) {
      socketManager.unsubscribe('chat:read', readHandler);
      this.eventHandlers.delete(`chat:read:${roomId}`);
    }
  }

  /**
   * Send a message to a chat room
   * @param roomId - The room ID
   * @param content - The message content (max 500 characters)
   * @returns Promise resolving to the sent message
   * 
   * Send messages via API
   * Support sending text messages up to 500 characters
   * Implement content moderation for chat messages to prevent abuse (Requirement 24.5)
   */
  async sendMessage(roomId: string, content: string): Promise<Message> {
    try {
      // Validate and filter message content
      const validation = validateAndFilterMessage(content);
      
      if (!validation.isValid) {
        throw new Error(validation.reason || 'Invalid message');
      }

      // Use filtered content (profanity replaced with asterisks)
      const filteredContent = validation.filtered;

      const response = await httpClient.post<SendMessageResponse>(
        `/chat/${roomId}/messages`,
        { content: filteredContent }
      );
      
      // Track message sent
      analyticsTracker.engagement.trackMessageSent(roomId, filteredContent.length);
      
      // Track if profanity was filtered
      if (validation.containsProfanity) {
        analyticsTracker.engagement.trackEvent('message_profanity_filtered', {
          roomId,
          originalLength: content.length,
          filteredLength: filteredContent.length,
        });
      }
      
      return response.message;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  /**
   * Load message history for a chat room
   * @param roomId - The room ID
   * @param options - Pagination options (limit and offset)
   * @returns Promise resolving to the message history
   * 
   * Load message history from Backend_API when opening an existing chat
   */
  async loadHistory(
    roomId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<LoadHistoryResponse> {
    try {
      const params = new URLSearchParams();
      if (options?.limit) {
        params.append('limit', options.limit.toString());
      }
      if (options?.offset) {
        params.append('offset', options.offset.toString());
      }

      const queryString = params.toString();
      const url = `/chat/${roomId}/messages${queryString ? `?${queryString}` : ''}`;

      const response = await httpClient.get<LoadHistoryResponse>(url);
      return response;
    } catch (error) {
      console.error('Failed to load message history:', error);
      throw error;
    }
  }

  /**
   * Send a typing indicator to the chat room
   * @param roomId - The room ID
   * @param isTyping - Whether the user is currently typing
   * 
   * Display typing indicators when the other user is typing
   * 
   * Note: This method is debounced per room to avoid excessive WebSocket messages.
   * The debounce delay is 300ms, meaning typing indicators will only be sent
   * after the user stops typing for 300ms.
   */
  sendTypingIndicator(roomId: string, isTyping: boolean = true): void {
    try {
      // Get or create debounced function for this room
      if (!this.debouncedTypingIndicators.has(roomId)) {
        const debouncedFn = debounce((typing: boolean) => {
          socketManager.emit('chat:typing', { roomId, isTyping: typing });
        }, 300);
        this.debouncedTypingIndicators.set(roomId, debouncedFn);
      }

      // Call the debounced function
      const debouncedFn = this.debouncedTypingIndicators.get(roomId)!;
      debouncedFn(isTyping);
    } catch (error) {
      console.error('Failed to send typing indicator:', error);
      // Don't throw - typing indicators are non-critical
    }
  }
}

// Export singleton instance
export const chatService = new ChatService();
