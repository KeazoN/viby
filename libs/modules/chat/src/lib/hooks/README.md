# Chat Hooks

React hooks for the Chat module providing access to chat state and WebSocket event subscriptions.

## Overview

The Chat module provides four main hooks:

1. **useChat** - Access to complete chat state and actions
2. **useChatMessages** - Selector hook for messages in a specific room
3. **useTypingIndicator** - Selector hook for typing indicators in a specific room
4. **useChatWebSocket** - WebSocket event subscription management

## Hooks

### useChat

Provides access to the complete chat store state and actions.

**Returns:** Complete chat store (messages, typingUsers, unreadCounts, and all actions)

**Example:**
```tsx
import { useChat } from '@viby/modules/chat';

function ChatScreen({ roomId }: { roomId: string }) {
  const { messages, typingUsers, addMessage, markAsRead } = useChat();
  
  useEffect(() => {
    // Mark messages as read when screen is focused
    markAsRead(roomId);
  }, [roomId, markAsRead]);
  
  return (
    <View>
      <MessageList messages={messages[roomId] || []} />
      {typingUsers[roomId]?.length > 0 && (
        <TypingIndicator users={typingUsers[roomId]} />
      )}
    </View>
  );
}
```

### useChatMessages

Selector hook that provides messages for a specific room. Only re-renders when messages for the specified room change.

**Parameters:**
- `roomId: string` - The room ID to get messages for

**Returns:** `Message[]` - Array of messages for the room

**Example:**
```tsx
import { useChatMessages } from '@viby/modules/chat';

function MessageList({ roomId }: { roomId: string }) {
  const messages = useChatMessages(roomId);
  
  return (
    <FlatList
      data={messages}
      renderItem={({ item }) => (
        <MessageBubble
          message={item}
          isOwn={item.userId === currentUserId}
        />
      )}
      keyExtractor={(item) => item.id}
    />
  );
}
```

### useTypingIndicator

Selector hook that provides typing indicators for a specific room. Only re-renders when typing users for the specified room change.

**Parameters:**
- `roomId: string` - The room ID to get typing indicators for

**Returns:** `string[]` - Array of user IDs who are currently typing

**Example:**
```tsx
import { useTypingIndicator } from '@viby/modules/chat';

function TypingIndicator({ roomId }: { roomId: string }) {
  const typingUsers = useTypingIndicator(roomId);
  
  if (typingUsers.length === 0) {
    return null;
  }
  
  return (
    <View>
      <Text>
        {typingUsers.length === 1
          ? 'Someone is typing...'
          : `${typingUsers.length} people are typing...`}
      </Text>
      <TypingAnimation />
    </View>
  );
}
```

### useChatWebSocket

Manages WebSocket event subscriptions for the Chat module. Automatically subscribes to chat events and updates the chat store.

**Events Handled:**
- `chat:message` - When a new message is received
- `chat:typing` - When a user starts/stops typing
- `chat:read` - When a user reads messages

**Parameters:**
- `options: UseChatWebSocketOptions`
  - `roomId: string` - The room ID to subscribe to (required)
  - `enabled?: boolean` - Whether to automatically subscribe (default: true)
  - `onMessageReceived?: (payload: MessageReceivedPayload) => void` - Callback when a message is received
  - `onTypingIndicator?: (payload: TypingIndicatorPayload) => void` - Callback when a typing indicator is received
  - `onReadReceipt?: (payload: ReadReceiptPayload) => void` - Callback when a read receipt is received

**Returns:** `void`

**Example:**
```tsx
import { useChatWebSocket, useChatMessages, useTypingIndicator } from '@viby/modules/chat';

function ChatScreen({ roomId }: { roomId: string }) {
  const messages = useChatMessages(roomId);
  const typingUsers = useTypingIndicator(roomId);
  
  // Subscribe to WebSocket events for this room
  useChatWebSocket({
    roomId,
    onMessageReceived: (payload) => {
      console.log('New message:', payload.message.content);
      // Play notification sound
      playNotificationSound();
    },
    onTypingIndicator: (payload) => {
      console.log('Typing indicator:', payload.userId, payload.isTyping);
    },
    onReadReceipt: (payload) => {
      console.log('Message read:', payload.messageId);
    },
  });
  
  return (
    <View>
      <MessageList messages={messages} />
      {typingUsers.length > 0 && <TypingIndicator />}
    </View>
  );
}
```

## Complete Chat Screen Example

Here's a complete example showing how to use all hooks together:

```tsx
import React, { useEffect, useState } from 'react';
import { View, FlatList, TextInput, Button } from 'react-native';
import {
  useChat,
  useChatMessages,
  useTypingIndicator,
  useChatWebSocket,
} from '@viby/modules/chat';
import { chatService } from '@viby/modules/chat';

function ChatScreen({ roomId, currentUserId }: Props) {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const { markAsRead } = useChat();
  const messages = useChatMessages(roomId);
  const typingUsers = useTypingIndicator(roomId);
  
  // Subscribe to WebSocket events
  useChatWebSocket({
    roomId,
    onMessageReceived: (payload) => {
      // Play notification sound if message is from other user
      if (payload.message.userId !== currentUserId) {
        playNotificationSound();
      }
    },
  });
  
  // Mark messages as read when screen is focused
  useEffect(() => {
    markAsRead(roomId);
  }, [roomId, markAsRead]);
  
  // Handle typing indicator
  useEffect(() => {
    if (isTyping) {
      chatService.sendTypingIndicator(roomId, true);
      
      // Stop typing indicator after 3 seconds of inactivity
      const timeout = setTimeout(() => {
        setIsTyping(false);
        chatService.sendTypingIndicator(roomId, false);
      }, 3000);
      
      return () => clearTimeout(timeout);
    }
  }, [isTyping, roomId]);
  
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    
    try {
      await chatService.sendMessage(roomId, inputText);
      setInputText('');
      setIsTyping(false);
      chatService.sendTypingIndicator(roomId, false);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };
  
  const handleTextChange = (text: string) => {
    setInputText(text);
    if (text.length > 0 && !isTyping) {
      setIsTyping(true);
    }
  };
  
  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={messages}
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            isOwn={item.userId === currentUserId}
          />
        )}
        keyExtractor={(item) => item.id}
        inverted
      />
      
      {typingUsers.length > 0 && (
        <TypingIndicator count={typingUsers.length} />
      )}
      
      <View style={{ flexDirection: 'row', padding: 10 }}>
        <TextInput
          value={inputText}
          onChangeText={handleTextChange}
          placeholder="Type a message..."
          style={{ flex: 1, marginRight: 10 }}
        />
        <Button title="Send" onPress={handleSendMessage} />
      </View>
    </View>
  );
}
```

## Performance Optimization

The hooks are designed for optimal performance:

1. **Selector Hooks**: `useChatMessages` and `useTypingIndicator` use Zustand selectors to minimize re-renders. They only re-render when their specific slice of state changes.

2. **Room Isolation**: Each hook filters events by room ID, ensuring components only update for relevant changes.

3. **Automatic Cleanup**: `useChatWebSocket` automatically unsubscribes from events when the component unmounts or when the room ID changes.

## Testing

All hooks include comprehensive unit tests covering:

- Basic functionality
- State updates
- Event handling
- Room isolation
- Edge cases
- Cleanup behavior

Run tests with:
```bash
nx test chat --testPathPattern="hooks"
```

## Integration with Other Modules

The Chat hooks integrate with:

- **Chat Service** (`chatService`) - For sending messages and typing indicators
- **Chat Store** (`useChatStore`) - For state management
- **Realtime Module** (`socketManager`) - For WebSocket event subscriptions

## Behavior checks

- Chat session creation and management ✓
- Message sending and receiving via WebSocket ✓
- Typing indicators ✓
- Message history loading ✓

## Next Steps

After implementing the Chat hooks, you can:

1. Build Chat UI components using these hooks
2. Implement message input with typing indicators
3. Add message status indicators (sending, sent, failed)
4. Implement read receipts
5. Add message history pagination
