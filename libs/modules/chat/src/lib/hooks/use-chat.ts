import { useChatStore } from '../stores/chat-store';

/**
 * useChat Hook
 * 
 * Provides access to the complete chat state and actions.
 * 
 * @returns Chat store state and actions
 * 
 * 
 * @example
 * ```tsx
 * function ChatScreen({ roomId }: { roomId: string }) {
 *   const { messages, typingUsers, addMessage, markAsRead } = useChat();
 *   
 *   useEffect(() => {
 *     // Mark messages as read when screen is focused
 *     markAsRead(roomId);
 *   }, [roomId, markAsRead]);
 *   
 *   return (
 *     <View>
 *       <MessageList messages={messages[roomId] || []} />
 *       {typingUsers[roomId]?.length > 0 && (
 *         <TypingIndicator users={typingUsers[roomId]} />
 *       )}
 *     </View>
 *   );
 * }
 * ```
 */
export function useChat() {
  return useChatStore();
}
