import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { ChatScreen } from './ChatScreen';
import { useChatMessages, useTypingIndicator, chatService } from '@viby/modules/chat';
import { useAuthStore } from '@viby/modules/auth';
import { useGameStore } from '@viby/modules/game';
import type { Message } from '@viby/modules/chat';

// Mock dependencies
jest.mock('@viby/modules/chat');
jest.mock('@viby/modules/auth');
jest.mock('@viby/modules/game');
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: jest.fn(),
    navigate: jest.fn(),
  }),
}));

const mockUseChatMessages = useChatMessages as jest.MockedFunction<typeof useChatMessages>;
const mockUseTypingIndicator = useTypingIndicator as jest.MockedFunction<typeof useTypingIndicator>;
const mockUseAuthStore = useAuthStore as unknown as jest.MockedFunction<any>;
const mockUseGameStore = useGameStore as unknown as jest.MockedFunction<any>;

describe('ChatScreen', () => {
  const mockRoute = {
    params: { roomId: 'room-123' },
  };

  const mockNavigation = {
    goBack: jest.fn(),
    navigate: jest.fn(),
  };

  const mockCurrentUser = {
    id: 'user-1',
    username: 'TestUser',
    email: 'test@example.com',
  };

  const mockOpponentUser = {
    id: 'user-2',
    username: 'Opponent',
    avatar: null,
  };

  const mockGameSession = {
    id: 'game-1',
    roomId: 'room-123',
    users: [mockCurrentUser, mockOpponentUser],
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
    scores: { 'user-1': 100, 'user-2': 150 },
    status: 'active' as const,
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock chat hooks
    mockUseChatMessages.mockReturnValue([]);
    mockUseTypingIndicator.mockReturnValue([]);

    // Mock auth store
    mockUseAuthStore.mockReturnValue(mockCurrentUser);
    (useAuthStore as any).getState = jest.fn(() => ({
      user: mockCurrentUser,
    }));

    // Mock game store
    mockUseGameStore.mockReturnValue(mockGameSession);

    // Mock chat service
    (chatService.loadHistory as jest.Mock) = jest.fn().mockResolvedValue({
      messages: [],
      hasMore: false,
    });
    (chatService.sendMessage as jest.Mock) = jest.fn().mockResolvedValue({
      id: 'msg-1',
      roomId: 'room-123',
      userId: 'user-1',
      content: 'Test message',
      status: 'sent',
      createdAt: new Date().toISOString(),
    });
    (chatService.sendTypingIndicator as jest.Mock) = jest.fn();
  });

  it('should render chat screen with header', () => {
    render(<ChatScreen route={mockRoute as any} navigation={mockNavigation as any} />);

    expect(screen.getByText('Opponent')).toBeTruthy();
    expect(screen.getByText('Test Song')).toBeTruthy();
    expect(screen.getByText('Test Artist')).toBeTruthy();
  });

  it('should display empty state when no messages', () => {
    mockUseChatMessages.mockReturnValue([]);

    render(<ChatScreen route={mockRoute as any} navigation={mockNavigation as any} />);

    expect(screen.getByText('No messages yet')).toBeTruthy();
    expect(screen.getByText('Start the conversation!')).toBeTruthy();
  });

  it('should display messages', () => {
    const mockMessages: Message[] = [
      {
        id: 'msg-1',
        roomId: 'room-123',
        userId: 'user-1',
        content: 'Hello!',
        status: 'sent',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'msg-2',
        roomId: 'room-123',
        userId: 'user-2',
        content: 'Hi there!',
        status: 'sent',
        createdAt: new Date().toISOString(),
      },
    ];

    mockUseChatMessages.mockReturnValue(mockMessages);

    render(<ChatScreen route={mockRoute as any} navigation={mockNavigation as any} />);

    expect(screen.getByText('Hello!')).toBeTruthy();
    expect(screen.getByText('Hi there!')).toBeTruthy();
  });

  it('should display typing indicator when opponent is typing', () => {
    mockUseTypingIndicator.mockReturnValue(['user-2']);

    render(<ChatScreen route={mockRoute as any} navigation={mockNavigation as any} />);

    expect(screen.getByText('Typing')).toBeTruthy();
  });

  it('should send message when send button is pressed', async () => {
    render(<ChatScreen route={mockRoute as any} navigation={mockNavigation as any} />);

    const input = screen.getByPlaceholderText('Type a message...');
    const sendButton = screen.getByLabelText('Send message');

    fireEvent.changeText(input, 'Test message');
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(chatService.sendMessage).toHaveBeenCalledWith('room-123', 'Test message');
    });
  });

  it('should not send empty messages', () => {
    render(<ChatScreen route={mockRoute as any} navigation={mockNavigation as any} />);

    const sendButton = screen.getByLabelText('Send message');

    fireEvent.press(sendButton);

    expect(chatService.sendMessage).not.toHaveBeenCalled();
  });

  it('should send typing indicator when user types', async () => {
    render(<ChatScreen route={mockRoute as any} navigation={mockNavigation as any} />);

    const input = screen.getByPlaceholderText('Type a message...');

    fireEvent.changeText(input, 'T');

    await waitFor(() => {
      expect(chatService.sendTypingIndicator).toHaveBeenCalledWith('room-123', true);
    });
  });

  it('should close chat when close button is pressed', () => {
    render(<ChatScreen route={mockRoute as any} navigation={mockNavigation as any} />);

    const closeButton = screen.getByLabelText('Close chat');

    fireEvent.press(closeButton);

    expect(mockNavigation.goBack).toHaveBeenCalled();
  });

  it('should load message history on mount', async () => {
    render(<ChatScreen route={mockRoute as any} navigation={mockNavigation as any} />);

    await waitFor(() => {
      expect(chatService.loadHistory).toHaveBeenCalledWith('room-123');
    });
  });

  it('should display message status for own messages', () => {
    const mockMessages: Message[] = [
      {
        id: 'msg-1',
        roomId: 'room-123',
        userId: 'user-1',
        content: 'Sending...',
        status: 'sending',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'msg-2',
        roomId: 'room-123',
        userId: 'user-1',
        content: 'Sent!',
        status: 'sent',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'msg-3',
        roomId: 'room-123',
        userId: 'user-1',
        content: 'Failed',
        status: 'failed',
        createdAt: new Date().toISOString(),
      },
    ];

    mockUseChatMessages.mockReturnValue(mockMessages);

    render(<ChatScreen route={mockRoute as any} navigation={mockNavigation as any} />);

    expect(screen.getByText('Sending...')).toBeTruthy();
    expect(screen.getByText('Sent!')).toBeTruthy();
    expect(screen.getByText('Failed')).toBeTruthy();
  });

  it('should validate message length', async () => {
    render(<ChatScreen route={mockRoute as any} navigation={mockNavigation as any} />);

    const input = screen.getByPlaceholderText('Type a message...');
    const sendButton = screen.getByLabelText('Send message');

    // Create a message longer than 500 characters
    const longMessage = 'a'.repeat(501);

    fireEvent.changeText(input, longMessage);
    fireEvent.press(sendButton);

    // Should not send message
    expect(chatService.sendMessage).not.toHaveBeenCalled();
  });

  it('should display opponent avatar initials', () => {
    render(<ChatScreen route={mockRoute as any} navigation={mockNavigation as any} />);

    expect(screen.getByText('OP')).toBeTruthy(); // First 2 letters of "Opponent"
  });

  it('should handle missing game session gracefully', () => {
    mockUseGameStore.mockReturnValue(null);

    render(<ChatScreen route={mockRoute as any} navigation={mockNavigation as any} />);

    // Should still render but without track context
    expect(screen.getByPlaceholderText('Type a message...')).toBeTruthy();
  });

  describe('Message Retry', () => {
    it('should display retry button for failed messages', () => {
      const failedMessage: Message = {
        id: 'msg-failed',
        roomId: 'room-123',
        userId: 'user-1',
        content: 'Failed message',
        status: 'failed',
        createdAt: new Date().toISOString(),
      };

      mockUseChatMessages.mockReturnValue([failedMessage]);

      render(<ChatScreen route={mockRoute as any} navigation={mockNavigation as any} />);

      expect(screen.getByText('Failed message')).toBeTruthy();
      expect(screen.getByText('Retry')).toBeTruthy();
    });

    it('should retry sending message when retry button is pressed', async () => {
      const failedMessage: Message = {
        id: 'msg-failed',
        roomId: 'room-123',
        userId: 'user-1',
        content: 'Failed message',
        status: 'failed',
        createdAt: new Date().toISOString(),
      };

      mockUseChatMessages.mockReturnValue([failedMessage]);

      render(<ChatScreen route={mockRoute as any} navigation={mockNavigation as any} />);

      const retryButton = screen.getByLabelText('Retry sending message');
      fireEvent.press(retryButton);

      await waitFor(() => {
        expect(chatService.sendMessage).toHaveBeenCalledWith('room-123', 'Failed message');
      });
    });

    it('should handle retry failure gracefully', async () => {
      const failedMessage: Message = {
        id: 'msg-failed',
        roomId: 'room-123',
        userId: 'user-1',
        content: 'Failed message',
        status: 'failed',
        createdAt: new Date().toISOString(),
      };

      mockUseChatMessages.mockReturnValue([failedMessage]);

      // Mock sendMessage to fail
      (chatService.sendMessage as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<ChatScreen route={mockRoute as any} navigation={mockNavigation as any} />);

      const retryButton = screen.getByLabelText('Retry sending message');
      fireEvent.press(retryButton);

      await waitFor(() => {
        expect(chatService.sendMessage).toHaveBeenCalledWith('room-123', 'Failed message');
      });

      // Should not crash and message should still be visible
      expect(screen.getByText('Failed message')).toBeTruthy();
    });

    it('should not show retry button for opponent failed messages', () => {
      const failedMessage: Message = {
        id: 'msg-failed',
        roomId: 'room-123',
        userId: 'user-2', // Opponent's message
        content: 'Failed message',
        status: 'failed',
        createdAt: new Date().toISOString(),
      };

      mockUseChatMessages.mockReturnValue([failedMessage]);

      render(<ChatScreen route={mockRoute as any} navigation={mockNavigation as any} />);

      expect(screen.getByText('Failed message')).toBeTruthy();
      expect(screen.queryByText('Retry')).toBeNull();
    });
  });

  describe('Typing Indicator Debouncing', () => {
    it('should send typing indicator when user starts typing', async () => {
      render(<ChatScreen route={mockRoute as any} navigation={mockNavigation as any} />);

      const input = screen.getByPlaceholderText('Type a message...');
      fireEvent.changeText(input, 'H');

      await waitFor(() => {
        expect(chatService.sendTypingIndicator).toHaveBeenCalledWith('room-123', true);
      });
    });

    it('should stop typing indicator after 2 seconds of inactivity', async () => {
      jest.useFakeTimers();

      render(<ChatScreen route={mockRoute as any} navigation={mockNavigation as any} />);

      const input = screen.getByPlaceholderText('Type a message...');
      fireEvent.changeText(input, 'Hello');

      // Fast-forward 2 seconds
      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(chatService.sendTypingIndicator).toHaveBeenCalledWith('room-123', false);
      });

      jest.useRealTimers();
    });

    it('should reset typing indicator timeout on each keystroke', async () => {
      jest.useFakeTimers();

      render(<ChatScreen route={mockRoute as any} navigation={mockNavigation as any} />);

      const input = screen.getByPlaceholderText('Type a message...');
      
      // Type first character
      fireEvent.changeText(input, 'H');
      jest.advanceTimersByTime(1000);

      // Type second character before timeout
      fireEvent.changeText(input, 'He');
      jest.advanceTimersByTime(1000);

      // Type third character before timeout
      fireEvent.changeText(input, 'Hel');
      
      // Now wait full 2 seconds
      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(chatService.sendTypingIndicator).toHaveBeenLastCalledWith('room-123', false);
      });

      jest.useRealTimers();
    });

    it('should send stop typing indicator on unmount', () => {
      const { unmount } = render(
        <ChatScreen route={mockRoute as any} navigation={mockNavigation as any} />
      );

      const input = screen.getByPlaceholderText('Type a message...');
      fireEvent.changeText(input, 'Hello');

      unmount();

      expect(chatService.sendTypingIndicator).toHaveBeenCalledWith('room-123', false);
    });
  });

  describe('Optimistic Updates', () => {
    it('should clear input immediately when sending message', async () => {
      render(<ChatScreen route={mockRoute as any} navigation={mockNavigation as any} />);

      const input = screen.getByPlaceholderText('Type a message...');
      const sendButton = screen.getByLabelText('Send message');

      fireEvent.changeText(input, 'Test message');
      expect(input.props.value).toBe('Test message');

      fireEvent.press(sendButton);

      // Input should be cleared immediately
      expect(input.props.value).toBe('');
    });

    it('should restore input text if message send fails', async () => {
      (chatService.sendMessage as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<ChatScreen route={mockRoute as any} navigation={mockNavigation as any} />);

      const input = screen.getByPlaceholderText('Type a message...');
      const sendButton = screen.getByLabelText('Send message');

      fireEvent.changeText(input, 'Test message');
      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(chatService.sendMessage).toHaveBeenCalled();
      });

      // Input should be restored on error
      await waitFor(() => {
        expect(input.props.value).toBe('Test message');
      });
    });
  });

  describe('Animations', () => {
    it('should display typing indicator with bounce animation', () => {
      mockUseTypingIndicator.mockReturnValue(['user-2']);

      render(<ChatScreen route={mockRoute as any} navigation={mockNavigation as any} />);

      // Typing indicator should be visible
      expect(screen.getByText('Typing')).toBeTruthy();
      
      // Dots should be present (animation is handled by Reanimated)
      const typingIndicator = screen.getByText('Typing').parent;
      expect(typingIndicator).toBeTruthy();
    });

    it('should hide typing indicator when no one is typing', () => {
      mockUseTypingIndicator.mockReturnValue([]);

      render(<ChatScreen route={mockRoute as any} navigation={mockNavigation as any} />);

      // Typing indicator should not be visible
      expect(screen.queryByText('Typing')).toBeNull();
    });

    it('should apply fade-in animation to messages', () => {
      const mockMessages: Message[] = [
        {
          id: 'msg-1',
          roomId: 'room-123',
          userId: 'user-1',
          content: 'Hello!',
          status: 'sent',
          createdAt: new Date().toISOString(),
        },
      ];

      mockUseChatMessages.mockReturnValue(mockMessages);

      render(<ChatScreen route={mockRoute as any} navigation={mockNavigation as any} />);

      // Message should be rendered (animation is handled by MessageBubble component)
      expect(screen.getByText('Hello!')).toBeTruthy();
    });

    it('should apply shake animation to failed messages', () => {
      const failedMessage: Message = {
        id: 'msg-failed',
        roomId: 'room-123',
        userId: 'user-1',
        content: 'Failed message',
        status: 'failed',
        createdAt: new Date().toISOString(),
      };

      mockUseChatMessages.mockReturnValue([failedMessage]);

      render(<ChatScreen route={mockRoute as any} navigation={mockNavigation as any} />);

      // Failed message should be rendered with shake animation (handled by MessageBubble)
      expect(screen.getByText('Failed message')).toBeTruthy();
      expect(screen.getByText('⚠️')).toBeTruthy();
    });
  });
});
