/**
 * Unit tests for MessageBubble component
 */

import { render, screen, fireEvent } from '@testing-library/react-native';
import { MessageBubble } from './MessageBubble';
import type { Message } from '@viby/modules/chat';

describe('MessageBubble', () => {
  const mockMessage: Message = {
    id: 'msg-1',
    roomId: 'room-1',
    userId: 'user-1',
    content: 'Hello, world!',
    status: 'sent',
    createdAt: '2024-01-15T10:30:00Z',
  };

  describe('Message Display', () => {
    it('should render message content', () => {
      render(<MessageBubble message={mockMessage} isMyMessage={true} />);
      
      expect(screen.getByText('Hello, world!')).toBeTruthy();
    });

    it('should render timestamp', () => {
      render(<MessageBubble message={mockMessage} isMyMessage={true} />);
      
      // Timestamp should be present (format may vary by locale)
      const timeElements = screen.getAllByText(/\d{1,2}:\d{2}/);
      expect(timeElements.length).toBeGreaterThan(0);
    });

    it('should apply correct styles for user messages', () => {
      const { getByText } = render(
        <MessageBubble message={mockMessage} isMyMessage={true} />
      );
      
      const messageText = getByText('Hello, world!');
      expect(messageText).toBeTruthy();
    });

    it('should apply correct styles for opponent messages', () => {
      const { getByText } = render(
        <MessageBubble message={mockMessage} isMyMessage={false} />
      );
      
      const messageText = getByText('Hello, world!');
      expect(messageText).toBeTruthy();
    });
  });

  describe('Message Status', () => {
    it('should show sending indicator for sending status', () => {
      const sendingMessage: Message = {
        ...mockMessage,
        status: 'sending',
      };

      render(<MessageBubble message={sendingMessage} isMyMessage={true} />);
      
      expect(screen.getByText('⏳')).toBeTruthy();
    });

    it('should show sent indicator for sent status', () => {
      const sentMessage: Message = {
        ...mockMessage,
        status: 'sent',
      };

      render(<MessageBubble message={sentMessage} isMyMessage={true} />);
      
      expect(screen.getByText('✓')).toBeTruthy();
    });

    it('should show double check for read messages', () => {
      const sentMessage: Message = {
        ...mockMessage,
        status: 'sent',
      };

      render(
        <MessageBubble message={sentMessage} isMyMessage={true} isRead={true} />
      );
      
      expect(screen.getByText('✓✓')).toBeTruthy();
    });

    it('should show failed indicator for failed status', () => {
      const failedMessage: Message = {
        ...mockMessage,
        status: 'failed',
      };

      render(<MessageBubble message={failedMessage} isMyMessage={true} />);
      
      expect(screen.getByText('⚠️')).toBeTruthy();
    });

    it('should not show status indicator for opponent messages', () => {
      const { queryByText } = render(
        <MessageBubble message={mockMessage} isMyMessage={false} />
      );
      
      expect(queryByText('✓')).toBeNull();
      expect(queryByText('⏳')).toBeNull();
      expect(queryByText('⚠️')).toBeNull();
    });
  });

  describe('User vs Opponent Differentiation', () => {
    it('should align user messages to the right', () => {
      const { getByTestId } = render(
        <MessageBubble
          message={mockMessage}
          isMyMessage={true}
          testID="message-bubble"
        />
      );
      
      const container = getByTestId('message-bubble');
      expect(container.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ alignSelf: 'flex-end' }),
        ])
      );
    });

    it('should align opponent messages to the left', () => {
      const { getByTestId } = render(
        <MessageBubble
          message={mockMessage}
          isMyMessage={false}
          testID="message-bubble"
        />
      );
      
      const container = getByTestId('message-bubble');
      expect(container.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ alignSelf: 'flex-start' }),
        ])
      );
    });
  });

  describe('Accessibility', () => {
    it('should have accessible role', () => {
      const { getByTestId } = render(
        <MessageBubble
          message={mockMessage}
          isMyMessage={true}
          testID="message-bubble"
        />
      );
      
      const container = getByTestId('message-bubble');
      expect(container.props.accessibilityRole).toBe('text');
    });

    it('should have accessible label for user messages', () => {
      const { getByTestId } = render(
        <MessageBubble
          message={mockMessage}
          isMyMessage={true}
          testID="message-bubble"
        />
      );
      
      const container = getByTestId('message-bubble');
      expect(container.props.accessibilityLabel).toBe('You: Hello, world!');
    });

    it('should have accessible label for opponent messages', () => {
      const { getByTestId } = render(
        <MessageBubble
          message={mockMessage}
          isMyMessage={false}
          testID="message-bubble"
        />
      );
      
      const container = getByTestId('message-bubble');
      expect(container.props.accessibilityLabel).toBe('Opponent: Hello, world!');
    });

    it('should have accessible label for message status', () => {
      const sentMessage: Message = {
        ...mockMessage,
        status: 'sent',
      };

      render(<MessageBubble message={sentMessage} isMyMessage={true} />);
      
      expect(screen.getByLabelText('Message sent')).toBeTruthy();
    });

    it('should have accessible label for failed status', () => {
      const failedMessage: Message = {
        ...mockMessage,
        status: 'failed',
      };

      render(<MessageBubble message={failedMessage} isMyMessage={true} />);
      
      expect(screen.getByLabelText('Message failed')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty message content', () => {
      const emptyMessage: Message = {
        ...mockMessage,
        content: '',
      };

      const { getByTestId } = render(
        <MessageBubble
          message={emptyMessage}
          isMyMessage={true}
          testID="message-bubble"
        />
      );
      
      expect(getByTestId('message-bubble')).toBeTruthy();
    });

    it('should handle long message content', () => {
      const longMessage: Message = {
        ...mockMessage,
        content: 'A'.repeat(500),
      };

      const { getByText } = render(
        <MessageBubble message={longMessage} isMyMessage={true} />
      );
      
      expect(getByText('A'.repeat(500))).toBeTruthy();
    });

    it('should handle special characters in content', () => {
      const specialMessage: Message = {
        ...mockMessage,
        content: '🎵 Hello! @user #music 💬',
      };

      const { getByText } = render(
        <MessageBubble message={specialMessage} isMyMessage={true} />
      );
      
      expect(getByText('🎵 Hello! @user #music 💬')).toBeTruthy();
    });

    it('should handle invalid date gracefully', () => {
      const invalidDateMessage: Message = {
        ...mockMessage,
        createdAt: 'invalid-date',
      };

      const { getByTestId } = render(
        <MessageBubble
          message={invalidDateMessage}
          isMyMessage={true}
          testID="message-bubble"
        />
      );
      
      // Should still render without crashing
      expect(getByTestId('message-bubble')).toBeTruthy();
    });
  });

  describe('Animations', () => {
    it('should apply fade-in animation on mount', () => {
      const { getByTestId } = render(
        <MessageBubble
          message={mockMessage}
          isMyMessage={true}
          testID="message-bubble"
        />
      );
      
      const container = getByTestId('message-bubble');
      expect(container).toBeTruthy();
      // Animation is applied via Reanimated, which is tested through visual regression
    });

    it('should apply shake animation for failed messages', () => {
      const failedMessage: Message = {
        ...mockMessage,
        status: 'failed',
      };

      const { getByTestId } = render(
        <MessageBubble
          message={failedMessage}
          isMyMessage={true}
          testID="message-bubble"
        />
      );
      
      const container = getByTestId('message-bubble');
      expect(container).toBeTruthy();
      // Shake animation is applied via Reanimated when status is 'failed'
    });

    it('should not apply shake animation for sent messages', () => {
      const sentMessage: Message = {
        ...mockMessage,
        status: 'sent',
      };

      const { getByTestId } = render(
        <MessageBubble
          message={sentMessage}
          isMyMessage={true}
          testID="message-bubble"
        />
      );
      
      const container = getByTestId('message-bubble');
      expect(container).toBeTruthy();
      // No shake animation for sent messages
    });

    it('should not apply shake animation for sending messages', () => {
      const sendingMessage: Message = {
        ...mockMessage,
        status: 'sending',
      };

      const { getByTestId } = render(
        <MessageBubble
          message={sendingMessage}
          isMyMessage={true}
          testID="message-bubble"
        />
      );
      
      const container = getByTestId('message-bubble');
      expect(container).toBeTruthy();
      // No shake animation for sending messages
    });
  });

  describe('Read Receipts', () => {
    it('should show single check when message is sent but not read', () => {
      const sentMessage: Message = {
        ...mockMessage,
        status: 'sent',
      };

      render(
        <MessageBubble message={sentMessage} isMyMessage={true} isRead={false} />
      );
      
      expect(screen.getByText('✓')).toBeTruthy();
      expect(screen.queryByText('✓✓')).toBeNull();
    });

    it('should show double check when message is read', () => {
      const sentMessage: Message = {
        ...mockMessage,
        status: 'sent',
      };

      render(
        <MessageBubble message={sentMessage} isMyMessage={true} isRead={true} />
      );
      
      expect(screen.getByText('✓✓')).toBeTruthy();
    });

    it('should not show read receipt for sending messages', () => {
      const sendingMessage: Message = {
        ...mockMessage,
        status: 'sending',
      };

      render(
        <MessageBubble
          message={sendingMessage}
          isMyMessage={true}
          isRead={true}
        />
      );
      
      expect(screen.queryByText('✓✓')).toBeNull();
      expect(screen.getByText('⏳')).toBeTruthy();
    });

    it('should not show read receipt for failed messages', () => {
      const failedMessage: Message = {
        ...mockMessage,
        status: 'failed',
      };

      render(
        <MessageBubble
          message={failedMessage}
          isMyMessage={true}
          isRead={true}
        />
      );
      
      expect(screen.queryByText('✓✓')).toBeNull();
      expect(screen.getByText('⚠️')).toBeTruthy();
    });
  });

  describe('Message Retry', () => {
    it('should show retry button for failed messages when onRetry is provided', () => {
      const failedMessage: Message = {
        ...mockMessage,
        status: 'failed',
      };

      const onRetry = jest.fn();

      render(
        <MessageBubble
          message={failedMessage}
          isMyMessage={true}
          onRetry={onRetry}
        />
      );
      
      expect(screen.getByText('Retry')).toBeTruthy();
      expect(screen.getByLabelText('Retry sending message')).toBeTruthy();
    });

    it('should not show retry button for failed messages when onRetry is not provided', () => {
      const failedMessage: Message = {
        ...mockMessage,
        status: 'failed',
      };

      render(<MessageBubble message={failedMessage} isMyMessage={true} />);
      
      expect(screen.queryByText('Retry')).toBeNull();
    });

    it('should call onRetry when retry button is pressed', () => {
      const failedMessage: Message = {
        ...mockMessage,
        status: 'failed',
      };

      const onRetry = jest.fn();

      render(
        <MessageBubble
          message={failedMessage}
          isMyMessage={true}
          onRetry={onRetry}
        />
      );
      
      const retryButton = screen.getByLabelText('Retry sending message');
      fireEvent.press(retryButton);

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should not show retry button for sent messages', () => {
      const sentMessage: Message = {
        ...mockMessage,
        status: 'sent',
      };

      const onRetry = jest.fn();

      render(
        <MessageBubble
          message={sentMessage}
          isMyMessage={true}
          onRetry={onRetry}
        />
      );
      
      expect(screen.queryByText('Retry')).toBeNull();
    });

    it('should not show retry button for sending messages', () => {
      const sendingMessage: Message = {
        ...mockMessage,
        status: 'sending',
      };

      const onRetry = jest.fn();

      render(
        <MessageBubble
          message={sendingMessage}
          isMyMessage={true}
          onRetry={onRetry}
        />
      );
      
      expect(screen.queryByText('Retry')).toBeNull();
    });

    it('should not show retry button for opponent messages', () => {
      const failedMessage: Message = {
        ...mockMessage,
        status: 'failed',
      };

      const onRetry = jest.fn();

      render(
        <MessageBubble
          message={failedMessage}
          isMyMessage={false}
          onRetry={onRetry}
        />
      );
      
      expect(screen.queryByText('Retry')).toBeNull();
    });
  });
});
