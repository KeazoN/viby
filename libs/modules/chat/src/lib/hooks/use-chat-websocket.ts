import { useEffect } from 'react';
import { socketManager } from '@viby/modules/realtime';
import { useChatStore } from '../stores/chat-store';
import { chatService } from '../services/chat-service';
import type {
  MessageReceivedPayload,
  TypingIndicatorPayload,
  ReadReceiptPayload,
} from '../types';

export interface UseChatWebSocketOptions {
  /**
   * The room ID to subscribe to chat events for
   */
  roomId: string;

  /**
   * Whether to automatically subscribe to chat events
   * @default true
   */
  enabled?: boolean;

  /**
   * Callback when a message is received
   */
  onMessageReceived?: (payload: MessageReceivedPayload) => void;

  /**
   * Callback when a typing indicator is received
   */
  onTypingIndicator?: (payload: TypingIndicatorPayload) => void;

  /**
   * Callback when a read receipt is received
   */
  onReadReceipt?: (payload: ReadReceiptPayload) => void;
}

/**
 * useChatWebSocket Hook
 * 
 * Manages WebSocket event subscriptions for the Chat module.
 * Automatically subscribes to chat events and updates the chat store.
 * 
 * Events handled:
 * - chat:message - When a new message is received
 * - chat:typing - When a user starts/stops typing
 * - chat:read - When a user reads messages
 * 
 * @param options - Configuration options including roomId
 * 
 * 
 * @example
 * ```tsx
 * function ChatScreen({ roomId }: { roomId: string }) {
 *   const messages = useChatMessages(roomId);
 *   const typingUsers = useTypingIndicator(roomId);
 *   
 *   // Subscribe to WebSocket events for this room
 *   useChatWebSocket({
 *     roomId,
 *     onMessageReceived: (payload) => {
 *       console.log('New message:', payload.message.content);
 *       // Play notification sound
 *     },
 *     onTypingIndicator: (payload) => {
 *       console.log('Typing indicator:', payload.userId, payload.isTyping);
 *     },
 *     onReadReceipt: (payload) => {
 *       console.log('Message read:', payload.messageId);
 *     },
 *   });
 *   
 *   return (
 *     <View>
 *       <MessageList messages={messages} />
 *       {typingUsers.length > 0 && <TypingIndicator />}
 *     </View>
 *   );
 * }
 * ```
 */
export function useChatWebSocket(
  options: UseChatWebSocketOptions
): void {
  const {
    roomId,
    enabled = true,
    onMessageReceived,
    onTypingIndicator,
    onReadReceipt,
  } = options;

  const {
    addMessage,
    updateMessageStatus,
    setTyping,
  } = useChatStore();

  useEffect(() => {
    if (!enabled || !roomId) return;

    // Handler for chat:message event
    const handleMessageReceived = (payload: MessageReceivedPayload) => {
      if (payload.message.roomId !== roomId) return;

      // Update store with new message
      addMessage(roomId, payload.message);

      // Call optional callback
      if (onMessageReceived) {
        onMessageReceived(payload);
      }
    };

    // Handler for chat:typing event
    const handleTypingIndicator = (payload: TypingIndicatorPayload) => {
      if (payload.roomId !== roomId) return;

      // Update typing indicator in store
      setTyping(roomId, payload.userId, payload.isTyping);

      // Call optional callback
      if (onTypingIndicator) {
        onTypingIndicator(payload);
      }
    };

    // Handler for chat:read event
    const handleReadReceipt = (payload: ReadReceiptPayload) => {
      if (payload.roomId !== roomId) return;

      // Update message status to indicate it was read
      updateMessageStatus(roomId, payload.messageId, 'sent');

      // Call optional callback
      if (onReadReceipt) {
        onReadReceipt(payload);
      }
    };

    // Subscribe to WebSocket events
    socketManager.subscribe('chat:message', handleMessageReceived);
    socketManager.subscribe('chat:typing', handleTypingIndicator);
    socketManager.subscribe('chat:read', handleReadReceipt);

    // Subscribe to chat events via service (sets up additional handlers)
    chatService.subscribeToChat(roomId);

    // Cleanup: unsubscribe on unmount or when roomId changes
    return () => {
      socketManager.unsubscribe('chat:message', handleMessageReceived);
      socketManager.unsubscribe('chat:typing', handleTypingIndicator);
      socketManager.unsubscribe('chat:read', handleReadReceipt);
      
      chatService.unsubscribeFromChat(roomId);
    };
  }, [
    roomId,
    enabled,
    addMessage,
    updateMessageStatus,
    setTyping,
    onMessageReceived,
    onTypingIndicator,
    onReadReceipt,
  ]);
}
