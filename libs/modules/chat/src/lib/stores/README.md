# Chat Store

The Chat Store manages client-side chat state using Zustand with devtools and immer middleware.

## Features

- **Messages by Room**: Stores messages organized by room ID
- **Typing Indicators**: Tracks which users are typing in each room
- **Unread Counts**: Maintains unread message counts per room
- **Optimistic Updates**: Supports immediate UI updates before server confirmation
- **Devtools Integration**: Full Redux DevTools support for debugging

## State Structure

```typescript
interface ChatState {
  messages: Record<string, Message[]>;      // Messages indexed by roomId
  typingUsers: Record<string, string[]>;    // Typing users indexed by roomId
  unreadCounts: Record<string, number>;     // Unread counts indexed by roomId
}
```

## Actions

### addMessage(roomId, message)

Adds a message to a room. Automatically initializes the messages array if the room doesn't exist.

**Use Case**: Optimistic message updates when sending a message.

```typescript
import { useChatStore } from '@viby/modules/chat';

const { addMessage } = useChatStore();

// Add optimistic message
const tempMessage: Message = {
  id: `temp-${Date.now()}`,
  roomId: 'room-1',
  userId: 'user-1',
  content: 'Hello!',
  status: 'sending',
  createdAt: new Date().toISOString(),
};

addMessage('room-1', tempMessage);
```

### updateMessageStatus(roomId, messageId, status)

Updates the status of a specific message. Used to confirm message delivery or mark failures.

**Statuses**: `'sending'` | `'sent'` | `'failed'`

```typescript
// Update message status when server confirms
updateMessageStatus('room-1', 'temp-123', 'sent');

// Mark message as failed on error
updateMessageStatus('room-1', 'temp-123', 'failed');
```

### setTyping(roomId, userId, isTyping)

Sets the typing indicator for a user in a room.

```typescript
// User starts typing
setTyping('room-1', 'user-2', true);

// User stops typing
setTyping('room-1', 'user-2', false);
```

### markAsRead(roomId)

Marks all messages in a room as read by resetting the unread count to 0.

```typescript
// Mark room as read when user opens chat
markAsRead('room-1');
```

## Usage Examples

### Sending a Message with Optimistic Update

```typescript
import { useChatStore } from '@viby/modules/chat';
import { chatService } from '@viby/modules/chat';

function useSendMessage(roomId: string) {
  const { addMessage, updateMessageStatus } = useChatStore();

  const sendMessage = async (content: string) => {
    // Create temporary message
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      roomId,
      userId: currentUserId,
      content,
      status: 'sending',
      createdAt: new Date().toISOString(),
    };

    // Optimistic update
    addMessage(roomId, tempMessage);

    try {
      // Send to server
      const sentMessage = await chatService.sendMessage(roomId, content);
      
      // Update with server response
      updateMessageStatus(roomId, tempMessage.id, 'sent');
    } catch (error) {
      // Mark as failed
      updateMessageStatus(roomId, tempMessage.id, 'failed');
    }
  };

  return { sendMessage };
}
```

### Displaying Messages

```typescript
import { useChatStore } from '@viby/modules/chat';

function ChatMessages({ roomId }: { roomId: string }) {
  const messages = useChatStore((state) => state.messages[roomId] || []);

  return (
    <div>
      {messages.map((message) => (
        <div key={message.id}>
          <p>{message.content}</p>
          <span>{message.status}</span>
        </div>
      ))}
    </div>
  );
}
```

### Typing Indicators

```typescript
import { useChatStore } from '@viby/modules/chat';

function TypingIndicator({ roomId }: { roomId: string }) {
  const typingUsers = useChatStore((state) => state.typingUsers[roomId] || []);

  if (typingUsers.length === 0) return null;

  return <div>{typingUsers.length} user(s) typing...</div>;
}
```

### Unread Badge

```typescript
import { useChatStore } from '@viby/modules/chat';

function UnreadBadge({ roomId }: { roomId: string }) {
  const unreadCount = useChatStore((state) => state.unreadCounts[roomId] || 0);

  if (unreadCount === 0) return null;

  return <span className="badge">{unreadCount}</span>;
}
```

## Integration with WebSocket Events

The store is designed to work seamlessly with WebSocket events from the chat service:

```typescript
import { useChatStore } from '@viby/modules/chat';
import { socketManager } from '@viby/modules/realtime';

function useChatWebSocket(roomId: string) {
  const { addMessage, setTyping } = useChatStore();

  useEffect(() => {
    // Subscribe to message events
    const handleMessage = (payload: MessageReceivedPayload) => {
      if (payload.message.roomId === roomId) {
        addMessage(roomId, payload.message);
      }
    };

    // Subscribe to typing events
    const handleTyping = (payload: TypingIndicatorPayload) => {
      if (payload.roomId === roomId) {
        setTyping(roomId, payload.userId, payload.isTyping);
      }
    };

    socketManager.subscribe('chat:message', handleMessage);
    socketManager.subscribe('chat:typing', handleTyping);

    return () => {
      socketManager.unsubscribe('chat:message', handleMessage);
      socketManager.unsubscribe('chat:typing', handleTyping);
    };
  }, [roomId]);
}
```

## Performance Optimization

Use selector-based subscriptions to minimize re-renders:

```typescript
// ❌ Bad - subscribes to entire store
const store = useChatStore();

// ✅ Good - subscribes only to specific room messages
const messages = useChatStore((state) => state.messages[roomId] || []);

// ✅ Good - subscribes only to typing users
const typingUsers = useChatStore((state) => state.typingUsers[roomId] || []);
```

## Behavior checks

- ✅ Implements optimistic message updates via `addMessage`
- ✅ Updates message status via `updateMessageStatus`
- ✅ Manages typing indicators via `setTyping`
- ✅ Tracks unread counts per room
- ✅ Marks messages as read via `markAsRead`

## Testing

The store includes comprehensive unit tests covering:
- Message addition and retrieval
- Optimistic updates and status changes
- Typing indicator management
- Unread count tracking
- Multi-room scenarios
- Complete chat flow integration

Run tests:
```bash
nx test chat --testFile=chat-store.test.ts
```
