import { useChatStore } from '../stores/chat-store';

/**
 * useTypingIndicator Hook
 * 
 * Provides access to typing indicators for a specific chat room.
 * This is a selector hook that only subscribes to typing users for the given roomId,
 * minimizing re-renders when other chat state changes.
 * 
 * @param roomId - The room ID to get typing indicators for
 * @returns Array of user IDs who are currently typing in the room
 * 
 * 
 * @example
 * ```tsx
 * function TypingIndicator({ roomId }: { roomId: string }) {
 *   const typingUsers = useTypingIndicator(roomId);
 *   
 *   if (typingUsers.length === 0) {
 *     return null;
 *   }
 *   
 *   return (
 *     <View>
 *       <Text>
 *         {typingUsers.length === 1
 *           ? 'Someone is typing...'
 *           : `${typingUsers.length} people are typing...`}
 *       </Text>
 *       <TypingAnimation />
 *     </View>
 *   );
 * }
 * ```
 */
export function useTypingIndicator(roomId: string): string[] {
  return useChatStore((state) => state.typingUsers[roomId] || []);
}
