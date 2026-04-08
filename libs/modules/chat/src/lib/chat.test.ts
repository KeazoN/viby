import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { chatService } from './services/chat-service';
import { useChatStore } from './stores/chat-store';
import { httpClient } from '@viby/shared/networking';
import { socketManager } from '@viby/modules/realtime';
import type {
  Message,
  SendMessageResponse,
  LoadHistoryResponse,
  MessageReceivedPayload,
  TypingIndicatorPayload,
  ReadReceiptPayload,
} from './types';

/**
 * Chat Module Unit Tests
 * 
 * Tests the complete chat module functionality including:
 * - Message sending
 * - Typing indicators
 * - Read receipts
 * - Message history loading
 * 
 */

// Mock dependencies
vi.mock('@viby/shared/networking', () => ({
  httpClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

vi.mock('@viby/modules/realtime', () => ({
  socketManager: {
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    emit: vi.fn(),
  },
}));

describe('Chat Module - Message Sending', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    const { result } = renderHook(() => useChatStore());
    act(() => {
      result.current.messages = {};
      result.current.typingUsers = {};
      result.current.unreadCounts = {};
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Test: Send message successfully
   * Validates: Enable chat for game sessions
   * Validates: Subscribe to WebSocket chat events
   */
  it('should send a message successfully via chat service', async () => {
    const roomId = 'room-123';
    const content = 'Hello, world!';

    const mockMessage: Message = {
      id: 'msg-1',
      roomId,
      userId: 'user-1',
      content,
      status: 'sent',
      createdAt: new Date().toISOString(),
    };

    const mockResponse: SendMessageResponse = {
      message: mockMessage,
    };

    (httpClient.post as any).mockResolvedValue(mockResponse);

    const result = await chatService.sendMessage(roomId, content);

    expect(httpClient.post).toHaveBeenCalledWith(
      `/chat/${roomId}/messages`,
      { content }
    );
    expect(result).toEqual(mockMessage);
  });

  /**
   * Test: Optimistic message update
   * Validates: Display messages with optimistic updates
   */
  it('should add message optimistically before server confirmation', () => {
    const { result } = renderHook(() => useChatStore());

    const optimisticMessage: Message = {
      id: 'temp-123',
      roomId: 'room-1',
      userId: 'user-1',
      content: 'Sending...',
      status: 'sending',
      createdAt: new Date().toISOString(),
    };

    act(() => {
      result.current.addMessage('room-1', optimisticMessage);
    });

    expect(result.current.messages['room-1']).toHaveLength(1);
    expect(result.current.messages['room-1'][0].status).toBe('sending');
  });

  /**
   * Test: Update message status on server confirmation
   * Validates: Update message status when confirmed by server
   */
  it('should update message status from sending to sent on server confirmation', () => {
    const { result } = renderHook(() => useChatStore());

    const message: Message = {
      id: 'msg-1',
      roomId: 'room-1',
      userId: 'user-1',
      content: 'Hello!',
      status: 'sending',
      createdAt: new Date().toISOString(),
    };

    act(() => {
      result.current.addMessage('room-1', message);
    });

    expect(result.current.messages['room-1'][0].status).toBe('sending');

    act(() => {
      result.current.updateMessageStatus('room-1', 'msg-1', 'sent');
    });

    expect(result.current.messages['room-1'][0].status).toBe('sent');
  });

  /**
   * Test: Handle message send failure
   * Validates: Update message status on failure
   */
  it('should update message status to failed on send error', () => {
    const { result } = renderHook(() => useChatStore());

    const message: Message = {
      id: 'msg-1',
      roomId: 'room-1',
      userId: 'user-1',
      content: 'Hello!',
      status: 'sending',
      createdAt: new Date().toISOString(),
    };

    act(() => {
      result.current.addMessage('room-1', message);
      result.current.updateMessageStatus('room-1', 'msg-1', 'failed');
    });

    expect(result.current.messages['room-1'][0].status).toBe('failed');
  });

  /**
   * Test: Enforce 500 character limit
   * Validates: Support sending text messages up to 500 characters
   */
  it('should reject messages exceeding 500 characters', async () => {
    const roomId = 'room-123';
    const content = 'a'.repeat(501);

    await expect(chatService.sendMessage(roomId, content)).rejects.toThrow(
      'Message content exceeds 500 characters'
    );

    expect(httpClient.post).not.toHaveBeenCalled();
  });

  /**
   * Test: Accept messages at 500 character limit
   * Validates: Support sending text messages up to 500 characters
   */
  it('should accept messages at exactly 500 characters', async () => {
    const roomId = 'room-123';
    const content = 'a'.repeat(500);

    const mockMessage: Message = {
      id: 'msg-1',
      roomId,
      userId: 'user-1',
      content,
      status: 'sent',
      createdAt: new Date().toISOString(),
    };

    (httpClient.post as any).mockResolvedValue({ message: mockMessage });

    const result = await chatService.sendMessage(roomId, content);

    expect(httpClient.post).toHaveBeenCalled();
    expect(result.content).toHaveLength(500);
  });

  /**
   * Test: Handle multiple messages in sequence
   * Validates: Display messages with optimistic updates
   */
  it('should handle multiple messages sent in sequence', () => {
    const { result } = renderHook(() => useChatStore());

    const message1: Message = {
      id: 'msg-1',
      roomId: 'room-1',
      userId: 'user-1',
      content: 'First message',
      status: 'sent',
      createdAt: new Date().toISOString(),
    };

    const message2: Message = {
      id: 'msg-2',
      roomId: 'room-1',
      userId: 'user-1',
      content: 'Second message',
      status: 'sent',
      createdAt: new Date().toISOString(),
    };

    act(() => {
      result.current.addMessage('room-1', message1);
      result.current.addMessage('room-1', message2);
    });

    expect(result.current.messages['room-1']).toHaveLength(2);
    expect(result.current.messages['room-1'][0]).toEqual(message1);
    expect(result.current.messages['room-1'][1]).toEqual(message2);
  });
});

describe('Chat Module - Typing Indicators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    const { result } = renderHook(() => useChatStore());
    act(() => {
      result.current.messages = {};
      result.current.typingUsers = {};
      result.current.unreadCounts = {};
    });
  });

  /**
   * Test: Send typing indicator
   * Validates: Display typing indicators when the other user is typing
   */
  it('should send typing indicator via WebSocket', () => {
    const roomId = 'room-123';

    chatService.sendTypingIndicator(roomId, true);

    expect(socketManager.emit).toHaveBeenCalledWith('chat:typing', {
      roomId,
      isTyping: true,
    });
  });

  /**
   * Test: Receive typing indicator
   * Validates: Display typing indicators
   * Validates: Display typing indicators when the other user is typing
   */
  it('should handle incoming typing indicator event', () => {
    const roomId = 'room-123';
    const { result } = renderHook(() => useChatStore());

    act(() => {
      result.current.setTyping(roomId, 'user-2', true);
    });

    expect(result.current.typingUsers[roomId]).toContain('user-2');
  });

  /**
   * Test: Stop typing indicator
   * Validates: Display typing indicators when the other user is typing
   */
  it('should remove typing indicator when user stops typing', () => {
    const roomId = 'room-123';
    const { result } = renderHook(() => useChatStore());

    act(() => {
      result.current.setTyping(roomId, 'user-2', true);
    });

    expect(result.current.typingUsers[roomId]).toContain('user-2');

    act(() => {
      result.current.setTyping(roomId, 'user-2', false);
    });

    expect(result.current.typingUsers[roomId]).not.toContain('user-2');
  });

  /**
   * Test: Multiple users typing simultaneously
   * Validates: Display typing indicators
   */
  it('should handle multiple users typing in the same room', () => {
    const roomId = 'room-123';
    const { result } = renderHook(() => useChatStore());

    act(() => {
      result.current.setTyping(roomId, 'user-2', true);
      result.current.setTyping(roomId, 'user-3', true);
    });

    expect(result.current.typingUsers[roomId]).toHaveLength(2);
    expect(result.current.typingUsers[roomId]).toContain('user-2');
    expect(result.current.typingUsers[roomId]).toContain('user-3');
  });

  /**
   * Test: Prevent duplicate typing indicators
   * Validates: Display typing indicators
   */
  it('should not add duplicate typing indicators for the same user', () => {
    const roomId = 'room-123';
    const { result } = renderHook(() => useChatStore());

    act(() => {
      result.current.setTyping(roomId, 'user-2', true);
      result.current.setTyping(roomId, 'user-2', true);
    });

    expect(result.current.typingUsers[roomId]).toHaveLength(1);
  });

  /**
   * Test: Typing indicators across multiple rooms
   * Validates: Display typing indicators
   */
  it('should handle typing indicators in different rooms independently', () => {
    const { result } = renderHook(() => useChatStore());

    act(() => {
      result.current.setTyping('room-1', 'user-2', true);
      result.current.setTyping('room-2', 'user-3', true);
    });

    expect(result.current.typingUsers['room-1']).toContain('user-2');
    expect(result.current.typingUsers['room-2']).toContain('user-3');
    expect(result.current.typingUsers['room-1']).not.toContain('user-3');
    expect(result.current.typingUsers['room-2']).not.toContain('user-2');
  });

  /**
   * Test: Subscribe to typing events
   * Validates: Subscribe to WebSocket_Service chat events
   */
  it('should subscribe to typing indicator events', () => {
    const roomId = 'room-123';

    chatService.subscribeToChat(roomId);

    const typingSubscription = (socketManager.subscribe as any).mock.calls.find(
      (call: any[]) => call[0] === 'chat:typing'
    );

    expect(typingSubscription).toBeDefined();
    expect(typingSubscription[1]).toBeInstanceOf(Function);
  });
});

describe('Chat Module - Read Receipts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    const { result } = renderHook(() => useChatStore());
    act(() => {
      result.current.messages = {};
      result.current.typingUsers = {};
      result.current.unreadCounts = {};
    });
  });

  /**
   * Test: Mark messages as read
   * Validates: Display read receipts when the other user has seen messages
   */
  it('should mark messages as read and reset unread count', () => {
    const { result } = renderHook(() => useChatStore());

    // Set initial unread count
    act(() => {
      result.current.unreadCounts['room-1'] = 5;
    });

    expect(result.current.unreadCounts['room-1']).toBe(5);

    act(() => {
      result.current.markAsRead('room-1');
    });

    expect(result.current.unreadCounts['room-1']).toBe(0);
  });

  /**
   * Test: Subscribe to read receipt events
   * Validates: Display read receipts when the other user has seen messages
   */
  it('should subscribe to read receipt events', () => {
    const roomId = 'room-123';

    chatService.subscribeToChat(roomId);

    const readSubscription = (socketManager.subscribe as any).mock.calls.find(
      (call: any[]) => call[0] === 'chat:read'
    );

    expect(readSubscription).toBeDefined();
    expect(readSubscription[1]).toBeInstanceOf(Function);
  });

  /**
   * Test: Handle read receipt event
   * Validates: Display read receipts when the other user has seen messages
   */
  it('should handle incoming read receipt event', () => {
    const roomId = 'room-123';
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    chatService.subscribeToChat(roomId);

    const readSubscription = (socketManager.subscribe as any).mock.calls.find(
      (call: any[]) => call[0] === 'chat:read'
    );
    const handler = readSubscription[1];

    const payload: ReadReceiptPayload = {
      roomId,
      userId: 'user-2',
      messageId: 'msg-1',
      timestamp: new Date(),
    };

    handler(payload);

    expect(consoleSpy).toHaveBeenCalledWith('Read receipt:', payload.userId, payload.messageId);
    consoleSpy.mockRestore();
  });

  /**
   * Test: Mark as read for non-existent room
   * Validates: Display read receipts
   */
  it('should handle marking non-existent room as read', () => {
    const { result } = renderHook(() => useChatStore());

    act(() => {
      result.current.markAsRead('non-existent-room');
    });

    expect(result.current.unreadCounts['non-existent-room']).toBe(0);
  });

  /**
   * Test: Read receipts across multiple rooms
   * Validates: Display read receipts
   */
  it('should handle read receipts independently across rooms', () => {
    const { result } = renderHook(() => useChatStore());

    act(() => {
      result.current.unreadCounts['room-1'] = 5;
      result.current.unreadCounts['room-2'] = 3;
      result.current.markAsRead('room-1');
    });

    expect(result.current.unreadCounts['room-1']).toBe(0);
    expect(result.current.unreadCounts['room-2']).toBe(3);
  });
});

describe('Chat Module - Message History Loading', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test: Load message history
   * Validates: Load message history from Backend_API when opening an existing chat
   */
  it('should load message history from API', async () => {
    const roomId = 'room-123';

    const mockMessages: Message[] = [
      {
        id: 'msg-1',
        roomId,
        userId: 'user-1',
        content: 'Hello!',
        status: 'sent',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'msg-2',
        roomId,
        userId: 'user-2',
        content: 'Hi there!',
        status: 'sent',
        createdAt: new Date().toISOString(),
      },
    ];

    const mockResponse: LoadHistoryResponse = {
      messages: mockMessages,
      hasMore: false,
    };

    (httpClient.get as any).mockResolvedValue(mockResponse);

    const result = await chatService.loadHistory(roomId);

    expect(httpClient.get).toHaveBeenCalledWith(`/chat/${roomId}/messages`);
    expect(result.messages).toHaveLength(2);
    expect(result.hasMore).toBe(false);
  });

  /**
   * Test: Load message history with pagination
   * Validates: Load message history from Backend_API
   */
  it('should load message history with pagination options', async () => {
    const roomId = 'room-123';
    const options = { limit: 50, offset: 100 };

    const mockResponse: LoadHistoryResponse = {
      messages: [],
      hasMore: true,
    };

    (httpClient.get as any).mockResolvedValue(mockResponse);

    const result = await chatService.loadHistory(roomId, options);

    expect(httpClient.get).toHaveBeenCalledWith(`/chat/${roomId}/messages?limit=50&offset=100`);
    expect(result.hasMore).toBe(true);
  });

  /**
   * Test: Load history with only limit
   * Validates: Load message history from Backend_API
   */
  it('should load message history with only limit parameter', async () => {
    const roomId = 'room-123';
    const options = { limit: 20 };

    const mockResponse: LoadHistoryResponse = {
      messages: [],
      hasMore: false,
    };

    (httpClient.get as any).mockResolvedValue(mockResponse);

    await chatService.loadHistory(roomId, options);

    expect(httpClient.get).toHaveBeenCalledWith(`/chat/${roomId}/messages?limit=20`);
  });

  /**
   * Test: Load history with only offset
   * Validates: Load message history from Backend_API
   */
  it('should load message history with only offset parameter', async () => {
    const roomId = 'room-123';
    const options = { offset: 50 };

    const mockResponse: LoadHistoryResponse = {
      messages: [],
      hasMore: false,
    };

    (httpClient.get as any).mockResolvedValue(mockResponse);

    await chatService.loadHistory(roomId, options);

    expect(httpClient.get).toHaveBeenCalledWith(`/chat/${roomId}/messages?offset=50`);
  });

  /**
   * Test: Handle load history error
   * Validates: Load message history from Backend_API
   */
  it('should handle load history error', async () => {
    const roomId = 'room-123';
    const error = new Error('Network error');

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (httpClient.get as any).mockRejectedValue(error);

    await expect(chatService.loadHistory(roomId)).rejects.toThrow('Network error');

    expect(consoleSpy).toHaveBeenCalledWith('Failed to load message history:', error);
    consoleSpy.mockRestore();
  });

  /**
   * Test: Load empty history
   * Validates: Load message history from Backend_API
   */
  it('should handle loading empty message history', async () => {
    const roomId = 'room-123';

    const mockResponse: LoadHistoryResponse = {
      messages: [],
      hasMore: false,
    };

    (httpClient.get as any).mockResolvedValue(mockResponse);

    const result = await chatService.loadHistory(roomId);

    expect(result.messages).toHaveLength(0);
    expect(result.hasMore).toBe(false);
  });
});

describe('Chat Module - Integration Scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    const { result } = renderHook(() => useChatStore());
    act(() => {
      result.current.messages = {};
      result.current.typingUsers = {};
      result.current.unreadCounts = {};
    });
  });

  /**
   * Test: Complete message flow with optimistic updates
   */
  it('should handle complete message send flow with optimistic update', () => {
    const { result } = renderHook(() => useChatStore());

    // 1. Add message optimistically
    const tempMessage: Message = {
      id: 'temp-123',
      roomId: 'room-1',
      userId: 'user-1',
      content: 'Hello!',
      status: 'sending',
      createdAt: new Date().toISOString(),
    };

    act(() => {
      result.current.addMessage('room-1', tempMessage);
    });

    expect(result.current.messages['room-1'][0].status).toBe('sending');

    // 2. Server confirms
    act(() => {
      result.current.updateMessageStatus('room-1', 'temp-123', 'sent');
    });

    expect(result.current.messages['room-1'][0].status).toBe('sent');
  });

  /**
   * Test: Typing indicator during conversation
   */
  it('should handle typing indicators during active conversation', () => {
    const { result } = renderHook(() => useChatStore());

    // User 2 starts typing
    act(() => {
      result.current.setTyping('room-1', 'user-2', true);
    });

    expect(result.current.typingUsers['room-1']).toContain('user-2');

    // User 2 sends message and stops typing
    const message: Message = {
      id: 'msg-1',
      roomId: 'room-1',
      userId: 'user-2',
      content: 'Hi there!',
      status: 'sent',
      createdAt: new Date().toISOString(),
    };

    act(() => {
      result.current.addMessage('room-1', message);
      result.current.setTyping('room-1', 'user-2', false);
    });

    expect(result.current.messages['room-1']).toHaveLength(1);
    expect(result.current.typingUsers['room-1']).not.toContain('user-2');
  });

  /**
   * Test: Failed message retry flow
   * Validates: Update message status
   */
  it('should handle failed message retry flow', () => {
    const { result } = renderHook(() => useChatStore());

    const message: Message = {
      id: 'msg-1',
      roomId: 'room-1',
      userId: 'user-1',
      content: 'Hello!',
      status: 'sending',
      createdAt: new Date().toISOString(),
    };

    act(() => {
      result.current.addMessage('room-1', message);
    });

    // Message fails
    act(() => {
      result.current.updateMessageStatus('room-1', 'msg-1', 'failed');
    });

    expect(result.current.messages['room-1'][0].status).toBe('failed');

    // Retry - update status back to sending
    act(() => {
      result.current.updateMessageStatus('room-1', 'msg-1', 'sending');
    });

    expect(result.current.messages['room-1'][0].status).toBe('sending');

    // Success
    act(() => {
      result.current.updateMessageStatus('room-1', 'msg-1', 'sent');
    });

    expect(result.current.messages['room-1'][0].status).toBe('sent');
  });

  /**
   * Test: Multiple concurrent conversations
   */
  it('should handle multiple concurrent chat rooms', () => {
    const { result } = renderHook(() => useChatStore());

    // Room 1 activity
    const room1Message: Message = {
      id: 'msg-1',
      roomId: 'room-1',
      userId: 'user-1',
      content: 'Room 1 message',
      status: 'sent',
      createdAt: new Date().toISOString(),
    };

    // Room 2 activity
    const room2Message: Message = {
      id: 'msg-2',
      roomId: 'room-2',
      userId: 'user-2',
      content: 'Room 2 message',
      status: 'sent',
      createdAt: new Date().toISOString(),
    };

    act(() => {
      result.current.addMessage('room-1', room1Message);
      result.current.setTyping('room-1', 'user-2', true);
      result.current.addMessage('room-2', room2Message);
      result.current.setTyping('room-2', 'user-3', true);
    });

    expect(result.current.messages['room-1']).toHaveLength(1);
    expect(result.current.messages['room-2']).toHaveLength(1);
    expect(result.current.typingUsers['room-1']).toContain('user-2');
    expect(result.current.typingUsers['room-2']).toContain('user-3');
  });

  /**
   * Test: WebSocket subscription lifecycle
   * Validates: Subscribe to WebSocket_Service chat events
   */
  it('should handle WebSocket subscription and cleanup', () => {
    const roomId = 'room-123';

    // Subscribe
    chatService.subscribeToChat(roomId);

    expect(socketManager.subscribe).toHaveBeenCalledTimes(3);
    expect(socketManager.subscribe).toHaveBeenCalledWith('chat:message', expect.any(Function));
    expect(socketManager.subscribe).toHaveBeenCalledWith('chat:typing', expect.any(Function));
    expect(socketManager.subscribe).toHaveBeenCalledWith('chat:read', expect.any(Function));

    // Unsubscribe
    chatService.unsubscribeFromChat(roomId);

    expect(socketManager.unsubscribe).toHaveBeenCalledTimes(3);
    expect(socketManager.unsubscribe).toHaveBeenCalledWith('chat:message', expect.any(Function));
    expect(socketManager.unsubscribe).toHaveBeenCalledWith('chat:typing', expect.any(Function));
    expect(socketManager.unsubscribe).toHaveBeenCalledWith('chat:read', expect.any(Function));
  });
});
