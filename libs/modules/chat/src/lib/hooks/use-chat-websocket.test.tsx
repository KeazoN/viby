import { renderHook, waitFor } from '@testing-library/react-native';
import { useChatWebSocket } from './use-chat-websocket';
import { useChatStore } from '../stores/chat-store';
import { socketManager } from '@viby/modules/realtime';
import { chatService } from '../services/chat-service';
import type {
  MessageReceivedPayload,
  TypingIndicatorPayload,
  ReadReceiptPayload,
} from '../types';

// Mock dependencies
jest.mock('@viby/modules/realtime', () => ({
  socketManager: {
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
  },
}));

jest.mock('../services/chat-service', () => ({
  chatService: {
    subscribeToChat: jest.fn(),
    unsubscribeFromChat: jest.fn(),
  },
}));

describe('useChatWebSocket', () => {
  beforeEach(() => {
    // Reset store before each test
    useChatStore.setState({
      messages: {},
      typingUsers: {},
      unreadCounts: {},
    });

    // Clear all mocks
    jest.clearAllMocks();
  });

  it('should subscribe to WebSocket events when enabled', () => {
    renderHook(() =>
      useChatWebSocket({
        roomId: 'room-1',
        enabled: true,
      })
    );

    expect(socketManager.subscribe).toHaveBeenCalledWith(
      'chat:message',
      expect.any(Function)
    );
    expect(socketManager.subscribe).toHaveBeenCalledWith(
      'chat:typing',
      expect.any(Function)
    );
    expect(socketManager.subscribe).toHaveBeenCalledWith(
      'chat:read',
      expect.any(Function)
    );
    expect(chatService.subscribeToChat).toHaveBeenCalledWith('room-1');
  });

  it('should not subscribe when disabled', () => {
    renderHook(() =>
      useChatWebSocket({
        roomId: 'room-1',
        enabled: false,
      })
    );

    expect(socketManager.subscribe).not.toHaveBeenCalled();
    expect(chatService.subscribeToChat).not.toHaveBeenCalled();
  });

  it('should not subscribe when roomId is empty', () => {
    renderHook(() =>
      useChatWebSocket({
        roomId: '',
        enabled: true,
      })
    );

    expect(socketManager.subscribe).not.toHaveBeenCalled();
    expect(chatService.subscribeToChat).not.toHaveBeenCalled();
  });

  it('should unsubscribe on unmount', () => {
    const { unmount } = renderHook(() =>
      useChatWebSocket({
        roomId: 'room-1',
        enabled: true,
      })
    );

    unmount();

    expect(socketManager.unsubscribe).toHaveBeenCalledWith(
      'chat:message',
      expect.any(Function)
    );
    expect(socketManager.unsubscribe).toHaveBeenCalledWith(
      'chat:typing',
      expect.any(Function)
    );
    expect(socketManager.unsubscribe).toHaveBeenCalledWith(
      'chat:read',
      expect.any(Function)
    );
    expect(chatService.unsubscribeFromChat).toHaveBeenCalledWith('room-1');
  });

  it('should handle message received event', () => {
    const onMessageReceived = jest.fn();

    renderHook(() =>
      useChatWebSocket({
        roomId: 'room-1',
        enabled: true,
        onMessageReceived,
      })
    );

    // Get the handler that was registered
    const messageHandler = (socketManager.subscribe as jest.Mock).mock.calls.find(
      (call) => call[0] === 'chat:message'
    )?.[1];

    expect(messageHandler).toBeDefined();

    const payload: MessageReceivedPayload = {
      message: {
        id: 'msg-1',
        roomId: 'room-1',
        userId: 'user-1',
        content: 'Hello!',
        status: 'sent',
        createdAt: new Date().toISOString(),
      },
      timestamp: new Date(),
    };

    // Simulate message received event
    messageHandler(payload);

    // Check that message was added to store
    const messages = useChatStore.getState().messages['room-1'];
    expect(messages).toHaveLength(1);
    expect(messages[0]).toEqual(payload.message);

    // Check that callback was called
    expect(onMessageReceived).toHaveBeenCalledWith(payload);
  });

  it('should ignore messages from other rooms', () => {
    const onMessageReceived = jest.fn();

    renderHook(() =>
      useChatWebSocket({
        roomId: 'room-1',
        enabled: true,
        onMessageReceived,
      })
    );

    const messageHandler = (socketManager.subscribe as jest.Mock).mock.calls.find(
      (call) => call[0] === 'chat:message'
    )?.[1];

    const payload: MessageReceivedPayload = {
      message: {
        id: 'msg-1',
        roomId: 'room-2', // Different room
        userId: 'user-1',
        content: 'Hello!',
        status: 'sent',
        createdAt: new Date().toISOString(),
      },
      timestamp: new Date(),
    };

    messageHandler(payload);

    // Should not add message to room-1
    expect(useChatStore.getState().messages['room-1']).toBeUndefined();

    // Should not call callback
    expect(onMessageReceived).not.toHaveBeenCalled();
  });

  it('should handle typing indicator event', () => {
    const onTypingIndicator = jest.fn();

    renderHook(() =>
      useChatWebSocket({
        roomId: 'room-1',
        enabled: true,
        onTypingIndicator,
      })
    );

    const typingHandler = (socketManager.subscribe as jest.Mock).mock.calls.find(
      (call) => call[0] === 'chat:typing'
    )?.[1];

    expect(typingHandler).toBeDefined();

    const payload: TypingIndicatorPayload = {
      roomId: 'room-1',
      userId: 'user-1',
      isTyping: true,
      timestamp: new Date(),
    };

    // Simulate typing indicator event
    typingHandler(payload);

    // Check that typing indicator was set in store
    const typingUsers = useChatStore.getState().typingUsers['room-1'];
    expect(typingUsers).toContain('user-1');

    // Check that callback was called
    expect(onTypingIndicator).toHaveBeenCalledWith(payload);
  });

  it('should ignore typing indicators from other rooms', () => {
    const onTypingIndicator = jest.fn();

    renderHook(() =>
      useChatWebSocket({
        roomId: 'room-1',
        enabled: true,
        onTypingIndicator,
      })
    );

    const typingHandler = (socketManager.subscribe as jest.Mock).mock.calls.find(
      (call) => call[0] === 'chat:typing'
    )?.[1];

    const payload: TypingIndicatorPayload = {
      roomId: 'room-2', // Different room
      userId: 'user-1',
      isTyping: true,
      timestamp: new Date(),
    };

    typingHandler(payload);

    // Should not set typing indicator for room-1
    expect(useChatStore.getState().typingUsers['room-1']).toBeUndefined();

    // Should not call callback
    expect(onTypingIndicator).not.toHaveBeenCalled();
  });

  it('should handle read receipt event', () => {
    const onReadReceipt = jest.fn();

    // Add a message first
    useChatStore.setState({
      messages: {
        'room-1': [
          {
            id: 'msg-1',
            roomId: 'room-1',
            userId: 'user-1',
            content: 'Hello!',
            status: 'sending',
            createdAt: new Date().toISOString(),
          },
        ],
      },
    });

    renderHook(() =>
      useChatWebSocket({
        roomId: 'room-1',
        enabled: true,
        onReadReceipt,
      })
    );

    const readHandler = (socketManager.subscribe as jest.Mock).mock.calls.find(
      (call) => call[0] === 'chat:read'
    )?.[1];

    expect(readHandler).toBeDefined();

    const payload: ReadReceiptPayload = {
      roomId: 'room-1',
      userId: 'user-2',
      messageId: 'msg-1',
      timestamp: new Date(),
    };

    // Simulate read receipt event
    readHandler(payload);

    // Check that message status was updated
    const messages = useChatStore.getState().messages['room-1'];
    expect(messages[0].status).toBe('sent');

    // Check that callback was called
    expect(onReadReceipt).toHaveBeenCalledWith(payload);
  });

  it('should ignore read receipts from other rooms', () => {
    const onReadReceipt = jest.fn();

    renderHook(() =>
      useChatWebSocket({
        roomId: 'room-1',
        enabled: true,
        onReadReceipt,
      })
    );

    const readHandler = (socketManager.subscribe as jest.Mock).mock.calls.find(
      (call) => call[0] === 'chat:read'
    )?.[1];

    const payload: ReadReceiptPayload = {
      roomId: 'room-2', // Different room
      userId: 'user-2',
      messageId: 'msg-1',
      timestamp: new Date(),
    };

    readHandler(payload);

    // Should not call callback
    expect(onReadReceipt).not.toHaveBeenCalled();
  });

  it('should resubscribe when roomId changes', () => {
    const { rerender } = renderHook(
      ({ roomId }) =>
        useChatWebSocket({
          roomId,
          enabled: true,
        }),
      {
        initialProps: { roomId: 'room-1' },
      }
    );

    expect(chatService.subscribeToChat).toHaveBeenCalledWith('room-1');

    // Change roomId
    rerender({ roomId: 'room-2' });

    // Should unsubscribe from old room
    expect(chatService.unsubscribeFromChat).toHaveBeenCalledWith('room-1');

    // Should subscribe to new room
    expect(chatService.subscribeToChat).toHaveBeenCalledWith('room-2');
  });

  it('should handle all callbacks being provided', () => {
    const onMessageReceived = jest.fn();
    const onTypingIndicator = jest.fn();
    const onReadReceipt = jest.fn();

    renderHook(() =>
      useChatWebSocket({
        roomId: 'room-1',
        enabled: true,
        onMessageReceived,
        onTypingIndicator,
        onReadReceipt,
      })
    );

    // Get all handlers
    const messageHandler = (socketManager.subscribe as jest.Mock).mock.calls.find(
      (call) => call[0] === 'chat:message'
    )?.[1];
    const typingHandler = (socketManager.subscribe as jest.Mock).mock.calls.find(
      (call) => call[0] === 'chat:typing'
    )?.[1];
    const readHandler = (socketManager.subscribe as jest.Mock).mock.calls.find(
      (call) => call[0] === 'chat:read'
    )?.[1];

    // Trigger all events
    messageHandler({
      message: {
        id: 'msg-1',
        roomId: 'room-1',
        userId: 'user-1',
        content: 'Hello!',
        status: 'sent',
        createdAt: new Date().toISOString(),
      },
      timestamp: new Date(),
    });

    typingHandler({
      roomId: 'room-1',
      userId: 'user-1',
      isTyping: true,
      timestamp: new Date(),
    });

    readHandler({
      roomId: 'room-1',
      userId: 'user-2',
      messageId: 'msg-1',
      timestamp: new Date(),
    });

    // All callbacks should have been called
    expect(onMessageReceived).toHaveBeenCalled();
    expect(onTypingIndicator).toHaveBeenCalled();
    expect(onReadReceipt).toHaveBeenCalled();
  });
});
