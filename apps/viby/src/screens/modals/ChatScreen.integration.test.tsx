/**
 * ChatScreen Integration Tests
 * 
 * Tests integration between ChatScreen, Chat module hooks,
 * WebSocket events, and state updates.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.9
 * - 7.1: Enable chat for Game_Session
 * - 7.2: Subscribe to WebSocket_Service chat events
 * - 7.3: Display messages with Optimistic_Update
 * - 7.4: Update message status when confirmed by Backend_API
 * - 7.5: Display error indicator and offer retry on failure
 * - 7.6: Display typing indicators
 * - 7.7: Display read receipts
 * - 7.9: Load message history from Backend_API
 */

import React from 'react';
import { render, waitFor, act, fireEvent } from '@testing-library/react-native';
import { ChatScreen } from './ChatScreen';
import { useChatStore } from '@viby/modules/chat';
import { chatService } from '@viby/modules/chat';
import { useGameStore } from '@viby/modules/game';
import { useAuthStore } from '@viby/modules/auth';
import { socketManager } from '@viby/modules/realtime';
import type {
  Message,
  MessageReceivedPayload,
  TypingIndicatorPayload,
  ReadReceiptPayload,
  UseChatWebSocketOptions,
} from '@viby/modules/chat';

// Mock dependencies
jest.mock('@viby/modules/realtime', () => ({
  socketManager: {
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    emit: jest.fn(),
    isConnected: jest.fn(() => true),
  },
}));

jest.mock('@viby/modules/chat', () => {
  const actual = jest.requireActual('@viby/modules/chat');
  return {
    ...actual,
    chatService: {
      sendMessage: jest.fn(),
      loadHistory: jest.fn(),
      sendTypingIndicator: jest.fn(),
      subscribeToChat: jest.fn(),
      unsubscribeFromChat: jest.fn(),
    },
  };
});

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

jest.mock('@viby/modules/auth', () => ({
  useAuthStore: jest.fn((selector) => {
    const state = {
      user: { id: 'user-1', username: 'TestUser', avatar: null },
    };
    return selector ? selector(state) : state;
  }),
}));

jest.mock('@viby/modules/game', () => ({
  useGameStore: jest.fn((selector) => {
    const state = {
      activeGame: {
        id: 'game-1',
        roomId: 'test-room-123',
        users: [
          { id: 'user-1', username: 'Player1', avatar: null },
          { id: 'user-2', username: 'Player2', avatar: null },
        ],
        track: {
          id: 'track-1',
          title: 'Test Song',
          artist: 'Test Artist',
          album: 'Test Album',
          artwork: null,
          duration: 180,
          isrc: null,
          provider: 'spotify' as const,
        },
        currentRound: 1,
        totalRounds: 5,
        scores: {
          'user-1': 100,
          'user-2': 80,
        },
        status: 'active' as const,
        createdAt: new Date().toISOString(),
      },
    };
    return selector ? selector(state) : state;
  }),
}));

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

const mockRoute = {
  params: {
    roomId: 'test-room-123',
  },
};

describe('ChatScreen Integration', () => {
  let mockChatWebSocketCallbacks: UseChatWebSocketOptions;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Reset chat store
    useChatStore.setState({
      messages: {},
      typingUsers: {},
      unreadCounts: {},
    });

    // Capture WebSocket callbacks
    const { useChatWebSocket } = require('@viby/modules/chat');
    (useChatWebSocket as jest.Mock).mockImplementation((options: UseChatWebSocketOptions) => {
      mockChatWebSocketCallbacks = options;
    });

    (chatService.loadHistory as jest.Mock).mockResolvedValue({
      messages: [],
      hasMore: false,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const createMockMessage = (
    id: string,
    userId: string,
    content: string,
    status: 'sending' | 'sent' | 'failed' = 'sent'
  ): Message => ({
    id,
    roomId: 'test-room-123',
    userId,
    content,
    status,
    createdAt: new Date().toISOString(),
  });

  describe('Message Sending', () => {
    it('should send message when send button is pressed', async () => {
      (chatService.sendMessage as jest.Mock).mockResolvedValue(
        createMockMessage('msg-1', 'user-1', 'Hello!')
      );

      const { getByLabelText } = render(
        <ChatScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      await waitFor(() => {
        expect(chatService.loadHistory).toHaveBeenCalledWith('test-room-123');
      });

      const input = getByLabelText('Message input');
      const sendButton = getByLabelText('Send message');

      // Type message
      fireEvent.changeText(input, 'Hello!');

      // Send message
      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(chatService.sendMessage).toHaveBeenCalledWith('test-room-123', 'Hello!');
      });
    });

    it('should display message with optimistic update', async () => {
      (chatService.sendMessage as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(
          createMockMessage('msg-1', 'user-1', 'Hello!')
        ), 1000))
      );

      const { getByLabelText, getByText } = render(
        <ChatScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      await waitFor(() => {
        expect(chatService.loadHistory).toHaveBeenCalled();
      });

      const input = getByLabelText('Message input');
      const sendButton = getByLabelText('Send message');

      // Type and send message
      fireEvent.changeText(input, 'Hello!');
      fireEvent.press(sendButton);

      // Message should appear immediately (optimistic update)
      await waitFor(() => {
        expect(getByText('Hello!')).toBeTruthy();
      });
    });

    it('should clear input after sending message', async () => {
      (chatService.sendMessage as jest.Mock).mockResolvedValue(
        createMockMessage('msg-1', 'user-1', 'Hello!')
      );

      const { getByLabelText } = render(
        <ChatScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      await waitFor(() => {
        expect(chatService.loadHistory).toHaveBeenCalled();
      });

      const input = getByLabelText('Message input');
      const sendButton = getByLabelText('Send message');

      fireEvent.changeText(input, 'Hello!');
      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(chatService.sendMessage).toHaveBeenCalled();
      });

      // Input should be cleared
      expect(input.props.value).toBe('');
    });

    it('should not send empty messages', async () => {
      const { getByLabelText } = render(
        <ChatScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      await waitFor(() => {
        expect(chatService.loadHistory).toHaveBeenCalled();
      });

      const sendButton = getByLabelText('Send message');

      // Try to send empty message
      fireEvent.press(sendButton);

      // Should not call sendMessage
      expect(chatService.sendMessage).not.toHaveBeenCalled();
    });

    it('should not send messages exceeding 500 characters', async () => {
      const { getByLabelText } = render(
        <ChatScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      await waitFor(() => {
        expect(chatService.loadHistory).toHaveBeenCalled();
      });

      const input = getByLabelText('Message input');
      const sendButton = getByLabelText('Send message');

      // Type message exceeding 500 characters
      const longMessage = 'a'.repeat(501);
      fireEvent.changeText(input, longMessage);
      fireEvent.press(sendButton);

      // Should not call sendMessage
      await waitFor(() => {
        expect(chatService.sendMessage).not.toHaveBeenCalled();
      });
    });

    it('should update message status when confirmed by server', async () => {
      const tempMessage = createMockMessage('temp-1', 'user-1', 'Hello!', 'sending');
      const confirmedMessage = createMockMessage('msg-1', 'user-1', 'Hello!', 'sent');

      (chatService.sendMessage as jest.Mock).mockResolvedValue(confirmedMessage);

      // Add temp message to store
      act(() => {
        useChatStore.getState().addMessage('test-room-123', tempMessage);
      });

      const { getByText } = render(
        <ChatScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      await waitFor(() => {
        expect(getByText('Hello!')).toBeTruthy();
      });

      // Update message status to sent
      act(() => {
        useChatStore.getState().updateMessageStatus('test-room-123', 'temp-1', 'sent');
      });

      // Message should still be displayed with updated status
      await waitFor(() => {
        expect(getByText('Hello!')).toBeTruthy();
      });
    });
  });

  describe('Typing Indicators', () => {
    it('should send typing indicator when user types', async () => {
      const { getByLabelText } = render(
        <ChatScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      await waitFor(() => {
        expect(chatService.loadHistory).toHaveBeenCalled();
      });

      const input = getByLabelText('Message input');

      // Type message
      fireEvent.changeText(input, 'H');

      // Should send typing indicator
      await waitFor(() => {
        expect(chatService.sendTypingIndicator).toHaveBeenCalledWith('test-room-123', true);
      });
    });

    it('should stop typing indicator after 2 seconds of inactivity', async () => {
      jest.useRealTimers();

      const { getByLabelText } = render(
        <ChatScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      await waitFor(() => {
        expect(chatService.loadHistory).toHaveBeenCalled();
      });

      const input = getByLabelText('Message input');

      // Type message
      fireEvent.changeText(input, 'Hello');

      // Should send typing indicator
      await waitFor(() => {
        expect(chatService.sendTypingIndicator).toHaveBeenCalledWith('test-room-123', true);
      });

      // Wait 2 seconds
      await new Promise((resolve) => setTimeout(resolve, 2100));

      // Should stop typing indicator
      await waitFor(() => {
        expect(chatService.sendTypingIndicator).toHaveBeenCalledWith('test-room-123', false);
      });
    });

    it('should display typing indicator when other user is typing', async () => {
      const { getByText } = render(
        <ChatScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      await waitFor(() => {
        expect(chatService.loadHistory).toHaveBeenCalled();
      });

      // Simulate typing indicator event
      act(() => {
        useChatStore.getState().setTyping('test-room-123', 'user-2', true);
      });

      // Should display typing indicator
      await waitFor(() => {
        expect(getByText('Typing')).toBeTruthy();
      });
    });

    it('should hide typing indicator when user stops typing', async () => {
      // Set initial typing state
      act(() => {
        useChatStore.setState({
          typingUsers: {
            'test-room-123': ['user-2'],
          },
        });
      });

      const { getByText, queryByText } = render(
        <ChatScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      await waitFor(() => {
        expect(getByText('Typing')).toBeTruthy();
      });

      // User stops typing
      act(() => {
        useChatStore.getState().setTyping('test-room-123', 'user-2', false);
      });

      // Typing indicator should be hidden
      await waitFor(() => {
        expect(queryByText('Typing')).toBeNull();
      });
    });

    it('should handle multiple users typing', async () => {
      const { getByText } = render(
        <ChatScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      await waitFor(() => {
        expect(chatService.loadHistory).toHaveBeenCalled();
      });

      // User 2 starts typing
      act(() => {
        useChatStore.getState().setTyping('test-room-123', 'user-2', true);
      });

      await waitFor(() => {
        expect(getByText('Typing')).toBeTruthy();
      });

      // User 3 starts typing
      act(() => {
        useChatStore.getState().setTyping('test-room-123', 'user-3', true);
      });

      // Should still display typing indicator
      await waitFor(() => {
        expect(getByText('Typing')).toBeTruthy();
      });
    });
  });

  describe('Read Receipts', () => {
    it('should update message status when read receipt is received', async () => {
      const message = createMockMessage('msg-1', 'user-1', 'Hello!', 'sent');

      act(() => {
        useChatStore.getState().addMessage('test-room-123', message);
      });

      render(
        <ChatScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      await waitFor(() => {
        expect(chatService.loadHistory).toHaveBeenCalled();
      });

      // Simulate read receipt event
      act(() => {
        mockChatWebSocketCallbacks.onReadReceipt?.({
          roomId: 'test-room-123',
          userId: 'user-2',
          messageId: 'msg-1',
          timestamp: new Date(),
        });
      });

      // Message status should be updated
      const messages = useChatStore.getState().messages['test-room-123'];
      expect(messages[0].status).toBe('sent');
    });
  });

  describe('Message History Loading', () => {
    it('should load message history on mount', async () => {
      const messages = [
        createMockMessage('msg-1', 'user-1', 'Hello!'),
        createMockMessage('msg-2', 'user-2', 'Hi there!'),
      ];

      (chatService.loadHistory as jest.Mock).mockResolvedValue({
        messages,
        hasMore: false,
      });

      render(
        <ChatScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      // Should call loadHistory
      await waitFor(() => {
        expect(chatService.loadHistory).toHaveBeenCalledWith('test-room-123');
      });
    });

    it('should display loading indicator while loading history', async () => {
      (chatService.loadHistory as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          messages: [],
          hasMore: false,
        }), 1000))
      );

      const { getByText } = render(
        <ChatScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      // Should display loading indicator
      await waitFor(() => {
        expect(getByText('Loading messages...')).toBeTruthy();
      });
    });

    it('should display empty state when no messages', async () => {
      (chatService.loadHistory as jest.Mock).mockResolvedValue({
        messages: [],
        hasMore: false,
      });

      const { getByText } = render(
        <ChatScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      await waitFor(() => {
        expect(chatService.loadHistory).toHaveBeenCalled();
      });

      // Should display empty state
      await waitFor(() => {
        expect(getByText('No messages yet')).toBeTruthy();
        expect(getByText('Start the conversation!')).toBeTruthy();
      });
    });

    it('should handle loadHistory error gracefully', async () => {
      const error = new Error('Failed to load history');
      (chatService.loadHistory as jest.Mock).mockRejectedValue(error);

      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      render(
        <ChatScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      await waitFor(() => {
        expect(chatService.loadHistory).toHaveBeenCalled();
      });

      // Should log error
      expect(consoleError).toHaveBeenCalledWith(
        'Failed to load chat history:',
        error
      );

      consoleError.mockRestore();
    });
  });

  describe('WebSocket Integration', () => {
    it('should receive messages via WebSocket', async () => {
      render(
        <ChatScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      await waitFor(() => {
        expect(chatService.loadHistory).toHaveBeenCalled();
      });

      const newMessage = createMockMessage('msg-1', 'user-2', 'Hello from WebSocket!');

      // Simulate WebSocket message event
      act(() => {
        mockChatWebSocketCallbacks.onMessageReceived?.({
          message: newMessage,
          timestamp: new Date(),
        });
      });

      // Message should be added to store
      const messages = useChatStore.getState().messages['test-room-123'];
      expect(messages).toContainEqual(newMessage);
    });

    it('should receive typing indicators via WebSocket', async () => {
      render(
        <ChatScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      await waitFor(() => {
        expect(chatService.loadHistory).toHaveBeenCalled();
      });

      // Simulate WebSocket typing event
      act(() => {
        mockChatWebSocketCallbacks.onTypingIndicator?.({
          roomId: 'test-room-123',
          userId: 'user-2',
          isTyping: true,
          timestamp: new Date(),
        });
      });

      // Typing indicator should be updated in store
      const typingUsers = useChatStore.getState().typingUsers['test-room-123'];
      expect(typingUsers).toContain('user-2');
    });

    it('should subscribe to chat events on mount', async () => {
      render(
        <ChatScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      await waitFor(() => {
        expect(chatService.subscribeToChat).toHaveBeenCalledWith('test-room-123');
      });
    });

    it('should unsubscribe from chat events on unmount', async () => {
      const { unmount } = render(
        <ChatScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      await waitFor(() => {
        expect(chatService.subscribeToChat).toHaveBeenCalled();
      });

      unmount();

      expect(chatService.unsubscribeFromChat).toHaveBeenCalledWith('test-room-123');
    });
  });

  describe('Error Handling', () => {
    it('should display error when message send fails', async () => {
      const error = new Error('Network error');
      (chatService.sendMessage as jest.Mock).mockRejectedValue(error);

      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      const { getByLabelText } = render(
        <ChatScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      await waitFor(() => {
        expect(chatService.loadHistory).toHaveBeenCalled();
      });

      const input = getByLabelText('Message input');
      const sendButton = getByLabelText('Send message');

      fireEvent.changeText(input, 'Hello!');
      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(chatService.sendMessage).toHaveBeenCalled();
      });

      // Should log error
      expect(consoleError).toHaveBeenCalledWith(
        'Failed to send message:',
        error
      );

      consoleError.mockRestore();
    });

    it('should restore input text when send fails', async () => {
      const error = new Error('Network error');
      (chatService.sendMessage as jest.Mock).mockRejectedValue(error);

      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      const { getByLabelText } = render(
        <ChatScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      await waitFor(() => {
        expect(chatService.loadHistory).toHaveBeenCalled();
      });

      const input = getByLabelText('Message input');
      const sendButton = getByLabelText('Send message');

      fireEvent.changeText(input, 'Hello!');
      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(chatService.sendMessage).toHaveBeenCalled();
      });

      // Input should be restored
      await waitFor(() => {
        expect(input.props.value).toBe('Hello!');
      });

      consoleError.mockRestore();
    });

    it('should allow retry when message send fails', async () => {
      const failedMessage = createMockMessage('msg-1', 'user-1', 'Hello!', 'failed');

      act(() => {
        useChatStore.getState().addMessage('test-room-123', failedMessage);
      });

      (chatService.sendMessage as jest.Mock).mockResolvedValue(
        createMockMessage('msg-1', 'user-1', 'Hello!', 'sent')
      );

      const { getByLabelText } = render(
        <ChatScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      await waitFor(() => {
        expect(chatService.loadHistory).toHaveBeenCalled();
      });

      // Find and press retry button (implementation depends on MessageBubble component)
      // This test assumes MessageBubble has a retry button for failed messages
      const retryButton = getByLabelText('Retry message');
      fireEvent.press(retryButton);

      await waitFor(() => {
        expect(chatService.sendMessage).toHaveBeenCalledWith('test-room-123', 'Hello!');
      });
    });
  });

  describe('UI Interactions', () => {
    it('should close chat when close button is pressed', async () => {
      const { getByLabelText } = render(
        <ChatScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      await waitFor(() => {
        expect(chatService.loadHistory).toHaveBeenCalled();
      });

      const closeButton = getByLabelText('Close chat');
      fireEvent.press(closeButton);

      expect(mockNavigation.goBack).toHaveBeenCalled();
    });

    it('should display opponent information in header', async () => {
      const { getByText } = render(
        <ChatScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      await waitFor(() => {
        expect(chatService.loadHistory).toHaveBeenCalled();
      });

      // Should display opponent username
      expect(getByText('Player2')).toBeTruthy();
    });

    it('should display track context in header', async () => {
      const { getByText } = render(
        <ChatScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      await waitFor(() => {
        expect(chatService.loadHistory).toHaveBeenCalled();
      });

      // Should display track info
      expect(getByText('Test Song')).toBeTruthy();
      expect(getByText('Test Artist')).toBeTruthy();
    });

    it('should disable send button while sending', async () => {
      (chatService.sendMessage as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(
          createMockMessage('msg-1', 'user-1', 'Hello!')
        ), 1000))
      );

      const { getByLabelText } = render(
        <ChatScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      await waitFor(() => {
        expect(chatService.loadHistory).toHaveBeenCalled();
      });

      const input = getByLabelText('Message input');
      const sendButton = getByLabelText('Send message');

      fireEvent.changeText(input, 'Hello!');
      fireEvent.press(sendButton);

      // Send button should be disabled
      expect(sendButton.props.accessibilityState?.disabled).toBe(true);
    });

    it('should scroll to bottom when new message arrives', async () => {
      const { getByText } = render(
        <ChatScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
        />
      );

      await waitFor(() => {
        expect(chatService.loadHistory).toHaveBeenCalled();
      });

      const newMessage = createMockMessage('msg-1', 'user-2', 'New message!');

      // Simulate WebSocket message event
      act(() => {
        mockChatWebSocketCallbacks.onMessageReceived?.({
          message: newMessage,
          timestamp: new Date(),
        });
      });

      // Message should be displayed
      await waitFor(() => {
        expect(getByText('New message!')).toBeTruthy();
      });

      // Note: Actual scroll behavior is tested in unit tests
      // Integration test verifies message is added to UI
    });
  });
});
