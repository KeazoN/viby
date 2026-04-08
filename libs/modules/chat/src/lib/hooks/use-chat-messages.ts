import { useChatStore } from '../stores/chat-store';
import type { Message } from '../types';

/**
 * useChatMessages Hook
 * 
 * Provides access to messages for a specific chat room.
 * This is a selector hook that only subscribes to messages for the given roomId,
 * minimizing re-renders when other chat state changes.
 * 
 * @param roomId - The room ID to get messages for
 * @returns Array of messages for the room, sorted by timestamp
 * 
 * 
 * @example
 * ```tsx
 * function MessageList({ roomId }: { roomId: string }) {
 *   const messages = useChatMessages(roomId);
 *   
 *   return (
 *     <FlatList
 *       data={messages}
 *       renderItem={({ item }) => (
 *         <MessageBubble
 *           message={item}
 *           isOwn={item.userId === currentUserId}
 *         />
 *       )}
 *       keyExtractor={(item) => item.id}
 *     />
 *   );
 * }
 * ```
 */
export function useChatMessages(roomId: string): Message[] {
  return useChatStore((state) => state.messages[roomId] || []);
}
