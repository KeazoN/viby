/**
 * Chat Store Usage Example
 * 
 * This file demonstrates how to use the Chat Store in a React component.
 * This is for documentation purposes only and is not part of the production code.
 */

import { useChatStore } from './chat-store';
import type { Message } from '../types';

/**
 * Example: Sending a message with optimistic update
 */
export function exampleSendMessage(roomId: string, content: string, userId: string) {
  const { addMessage, updateMessageStatus } = useChatStore.getState();

  // Create temporary message for optimistic update
  const tempMessage: Message = {
    id: `temp-${Date.now()}`,
    roomId,
    userId,
    content,
    status: 'sending',
    createdAt: new Date().toISOString(),
  };

  // Add message immediately (optimistic)
  addMessage(roomId, tempMessage);

  // Simulate server response
  setTimeout(() => {
    // On success: update status to 'sent'
    updateMessageStatus(roomId, tempMessage.id, 'sent');

    // On failure: update status to 'failed'
    // updateMessageStatus(roomId, tempMessage.id, 'failed');
  }, 1000);
}

/**
 * Example: Handling typing indicators
 */
export function exampleTypingIndicator(roomId: string, userId: string) {
  const { setTyping } = useChatStore.getState();

  // User starts typing
  setTyping(roomId, userId, true);

  // User stops typing after 3 seconds
  setTimeout(() => {
    setTyping(roomId, userId, false);
  }, 3000);
}

/**
 * Example: Marking messages as read
 */
export function exampleMarkAsRead(roomId: string) {
  const { markAsRead } = useChatStore.getState();

  // Mark all messages in room as read
  markAsRead(roomId);
}

/**
 * Example: React component using the store
 */
export function ChatComponent({ roomId }: { roomId: string }) {
  // Subscribe to messages for this room
  const messages = useChatStore((state) => state.messages[roomId] || []);
  
  // Subscribe to typing users for this room
  const typingUsers = useChatStore((state) => state.typingUsers[roomId] || []);
  
  // Subscribe to unread count for this room
  const unreadCount = useChatStore((state) => state.unreadCounts[roomId] || 0);

  return {
    messages,
    typingUsers,
    unreadCount,
  };
}

/**
 * Example: Selector-based subscription for performance
 */
export function useRoomMessages(roomId: string) {
  // Only re-renders when messages for this specific room change
  return useChatStore((state) => state.messages[roomId] || []);
}

export function useTypingUsers(roomId: string) {
  // Only re-renders when typing users for this specific room change
  return useChatStore((state) => state.typingUsers[roomId] || []);
}

export function useUnreadCount(roomId: string) {
  // Only re-renders when unread count for this specific room changes
  return useChatStore((state) => state.unreadCounts[roomId] || 0);
}
