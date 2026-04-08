import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Message, MessageStatus } from '../types';

/**
 * Chat Store State
 * 
 * Manages chat state on the client side including:
 * - Messages by room ID
 * - Typing indicators by room ID
 * - Unread counts by room ID
 * 
 */
interface ChatState {
  messages: Record<string, Message[]>;
  typingUsers: Record<string, string[]>;
  unreadCounts: Record<string, number>;
}

/**
 * Chat Store Actions
 */
interface ChatActions {
  /**
   * Add a message to a room
   * Implements optimistic update - adds message immediately before server confirmation
   * 
   * @param roomId - The room ID
   * @param message - The message to add
   * 
   */
  addMessage: (roomId: string, message: Message) => void;

  /**
   * Update message status
   * Called when server confirms message delivery or reports failure
   * 
   * @param roomId - The room ID
   * @param messageId - The message ID to update
   * @param status - The new status ('sending' | 'sent' | 'failed')
   * 
   */
  updateMessageStatus: (
    roomId: string,
    messageId: string,
    status: MessageStatus
  ) => void;

  /**
   * Set typing indicator for a user in a room
   * 
   * @param roomId - The room ID
   * @param userId - The user ID
   * @param isTyping - Whether the user is typing
   * 
   */
  setTyping: (roomId: string, userId: string, isTyping: boolean) => void;

  /**
   * Mark all messages in a room as read
   * Resets unread count to 0
   * 
   * @param roomId - The room ID
   * 
   */
  markAsRead: (roomId: string) => void;
}

type ChatStore = ChatState & ChatActions;

/**
 * Chat Zustand Store
 * 
 * Manages client-side chat state with:
 * - Devtools integration for debugging
 * - Immer for immutable state updates
 * - Optimistic message updates
 * 
 */
export const useChatStore = create<ChatStore>()(
  devtools(
    immer((set) => ({
      // Initial state
      messages: {},
      typingUsers: {},
      unreadCounts: {},

      // Actions
      addMessage: (roomId: string, message: Message) =>
        set((state) => {
          if (!state.messages[roomId]) {
            state.messages[roomId] = [];
          }
          state.messages[roomId].push(message);
        }),

      updateMessageStatus: (
        roomId: string,
        messageId: string,
        status: MessageStatus
      ) =>
        set((state) => {
          const messages = state.messages[roomId];
          if (messages) {
            const message = messages.find((m) => m.id === messageId);
            if (message) {
              message.status = status;
            }
          }
        }),

      setTyping: (roomId: string, userId: string, isTyping: boolean) =>
        set((state) => {
          if (!state.typingUsers[roomId]) {
            state.typingUsers[roomId] = [];
          }
          if (isTyping) {
            if (!state.typingUsers[roomId].includes(userId)) {
              state.typingUsers[roomId].push(userId);
            }
          } else {
            state.typingUsers[roomId] = state.typingUsers[roomId].filter(
              (id) => id !== userId
            );
          }
        }),

      markAsRead: (roomId: string) =>
        set((state) => {
          state.unreadCounts[roomId] = 0;
        }),
    })),
    {
      name: 'ChatStore',
    }
  )
);
