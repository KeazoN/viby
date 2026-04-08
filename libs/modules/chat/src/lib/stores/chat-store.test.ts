import { renderHook, act } from '@testing-library/react';
import { useChatStore } from './chat-store';
import type { Message } from '../types';

describe('ChatStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useChatStore());
    act(() => {
      result.current.messages = {};
      result.current.typingUsers = {};
      result.current.unreadCounts = {};
    });
  });

  describe('addMessage', () => {
    it('should add a message to a room', () => {
      const { result } = renderHook(() => useChatStore());

      const mockMessage: Message = {
        id: 'msg-1',
        roomId: 'room-1',
        userId: 'user-1',
        content: 'Hello!',
        status: 'sending',
        createdAt: new Date().toISOString(),
      };

      act(() => {
        result.current.addMessage('room-1', mockMessage);
      });

      expect(result.current.messages['room-1']).toHaveLength(1);
      expect(result.current.messages['room-1'][0]).toEqual(mockMessage);
    });

    it('should initialize messages array if room does not exist', () => {
      const { result } = renderHook(() => useChatStore());

      const mockMessage: Message = {
        id: 'msg-1',
        roomId: 'room-1',
        userId: 'user-1',
        content: 'First message',
        status: 'sending',
        createdAt: new Date().toISOString(),
      };

      act(() => {
        result.current.addMessage('room-1', mockMessage);
      });

      expect(result.current.messages['room-1']).toBeDefined();
      expect(result.current.messages['room-1']).toHaveLength(1);
    });

    it('should append messages to existing room', () => {
      const { result } = renderHook(() => useChatStore());

      const message1: Message = {
        id: 'msg-1',
        roomId: 'room-1',
        userId: 'user-1',
        content: 'First',
        status: 'sent',
        createdAt: new Date().toISOString(),
      };

      const message2: Message = {
        id: 'msg-2',
        roomId: 'room-1',
        userId: 'user-2',
        content: 'Second',
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

    it('should handle multiple rooms independently', () => {
      const { result } = renderHook(() => useChatStore());

      const messageRoom1: Message = {
        id: 'msg-1',
        roomId: 'room-1',
        userId: 'user-1',
        content: 'Room 1 message',
        status: 'sent',
        createdAt: new Date().toISOString(),
      };

      const messageRoom2: Message = {
        id: 'msg-2',
        roomId: 'room-2',
        userId: 'user-2',
        content: 'Room 2 message',
        status: 'sent',
        createdAt: new Date().toISOString(),
      };

      act(() => {
        result.current.addMessage('room-1', messageRoom1);
        result.current.addMessage('room-2', messageRoom2);
      });

      expect(result.current.messages['room-1']).toHaveLength(1);
      expect(result.current.messages['room-2']).toHaveLength(1);
      expect(result.current.messages['room-1'][0]).toEqual(messageRoom1);
      expect(result.current.messages['room-2'][0]).toEqual(messageRoom2);
    });
  });

  describe('updateMessageStatus - optimistic updates', () => {
    it('should update message status from sending to sent', () => {
      const { result } = renderHook(() => useChatStore());

      const mockMessage: Message = {
        id: 'msg-1',
        roomId: 'room-1',
        userId: 'user-1',
        content: 'Hello!',
        status: 'sending',
        createdAt: new Date().toISOString(),
      };

      act(() => {
        result.current.addMessage('room-1', mockMessage);
      });

      expect(result.current.messages['room-1'][0].status).toBe('sending');

      act(() => {
        result.current.updateMessageStatus('room-1', 'msg-1', 'sent');
      });

      expect(result.current.messages['room-1'][0].status).toBe('sent');
    });

    it('should update message status to failed on error', () => {
      const { result } = renderHook(() => useChatStore());

      const mockMessage: Message = {
        id: 'msg-1',
        roomId: 'room-1',
        userId: 'user-1',
        content: 'Hello!',
        status: 'sending',
        createdAt: new Date().toISOString(),
      };

      act(() => {
        result.current.addMessage('room-1', mockMessage);
        result.current.updateMessageStatus('room-1', 'msg-1', 'failed');
      });

      expect(result.current.messages['room-1'][0].status).toBe('failed');
    });

    it('should handle non-existent room gracefully', () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        result.current.updateMessageStatus('non-existent', 'msg-1', 'sent');
      });

      // Should not throw error
      expect(result.current.messages['non-existent']).toBeUndefined();
    });

    it('should handle non-existent message gracefully', () => {
      const { result } = renderHook(() => useChatStore());

      const mockMessage: Message = {
        id: 'msg-1',
        roomId: 'room-1',
        userId: 'user-1',
        content: 'Hello!',
        status: 'sending',
        createdAt: new Date().toISOString(),
      };

      act(() => {
        result.current.addMessage('room-1', mockMessage);
        result.current.updateMessageStatus('room-1', 'non-existent', 'sent');
      });

      // Original message should remain unchanged
      expect(result.current.messages['room-1'][0].status).toBe('sending');
    });

    it('should update only the specified message', () => {
      const { result } = renderHook(() => useChatStore());

      const message1: Message = {
        id: 'msg-1',
        roomId: 'room-1',
        userId: 'user-1',
        content: 'First',
        status: 'sending',
        createdAt: new Date().toISOString(),
      };

      const message2: Message = {
        id: 'msg-2',
        roomId: 'room-1',
        userId: 'user-1',
        content: 'Second',
        status: 'sending',
        createdAt: new Date().toISOString(),
      };

      act(() => {
        result.current.addMessage('room-1', message1);
        result.current.addMessage('room-1', message2);
        result.current.updateMessageStatus('room-1', 'msg-1', 'sent');
      });

      expect(result.current.messages['room-1'][0].status).toBe('sent');
      expect(result.current.messages['room-1'][1].status).toBe('sending');
    });
  });

  describe('setTyping', () => {
    it('should add user to typing list when isTyping is true', () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        result.current.setTyping('room-1', 'user-1', true);
      });

      expect(result.current.typingUsers['room-1']).toContain('user-1');
    });

    it('should remove user from typing list when isTyping is false', () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        result.current.setTyping('room-1', 'user-1', true);
        result.current.setTyping('room-1', 'user-1', false);
      });

      expect(result.current.typingUsers['room-1']).not.toContain('user-1');
    });

    it('should initialize typing users array if room does not exist', () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        result.current.setTyping('room-1', 'user-1', true);
      });

      expect(result.current.typingUsers['room-1']).toBeDefined();
      expect(result.current.typingUsers['room-1']).toContain('user-1');
    });

    it('should not add duplicate users to typing list', () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        result.current.setTyping('room-1', 'user-1', true);
        result.current.setTyping('room-1', 'user-1', true);
      });

      expect(result.current.typingUsers['room-1']).toHaveLength(1);
    });

    it('should handle multiple users typing in same room', () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        result.current.setTyping('room-1', 'user-1', true);
        result.current.setTyping('room-1', 'user-2', true);
      });

      expect(result.current.typingUsers['room-1']).toHaveLength(2);
      expect(result.current.typingUsers['room-1']).toContain('user-1');
      expect(result.current.typingUsers['room-1']).toContain('user-2');
    });

    it('should handle typing indicators across multiple rooms', () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        result.current.setTyping('room-1', 'user-1', true);
        result.current.setTyping('room-2', 'user-2', true);
      });

      expect(result.current.typingUsers['room-1']).toContain('user-1');
      expect(result.current.typingUsers['room-2']).toContain('user-2');
    });

    it('should remove only specified user when stopping typing', () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        result.current.setTyping('room-1', 'user-1', true);
        result.current.setTyping('room-1', 'user-2', true);
        result.current.setTyping('room-1', 'user-1', false);
      });

      expect(result.current.typingUsers['room-1']).not.toContain('user-1');
      expect(result.current.typingUsers['room-1']).toContain('user-2');
    });
  });

  describe('markAsRead', () => {
    it('should reset unread count to 0', () => {
      const { result } = renderHook(() => useChatStore());

      // Manually set unread count
      act(() => {
        result.current.unreadCounts['room-1'] = 5;
      });

      act(() => {
        result.current.markAsRead('room-1');
      });

      expect(result.current.unreadCounts['room-1']).toBe(0);
    });

    it('should handle marking non-existent room as read', () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        result.current.markAsRead('non-existent');
      });

      expect(result.current.unreadCounts['non-existent']).toBe(0);
    });

    it('should not affect other rooms', () => {
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

  describe('chat flow integration', () => {
    it('should handle complete message flow with optimistic updates', () => {
      const { result } = renderHook(() => useChatStore());

      // Send message (optimistic)
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

      // Server confirms
      act(() => {
        result.current.updateMessageStatus('room-1', 'temp-123', 'sent');
      });

      expect(result.current.messages['room-1'][0].status).toBe('sent');
    });

    it('should handle typing indicators during conversation', () => {
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

    it('should handle multiple concurrent conversations', () => {
      const { result } = renderHook(() => useChatStore());

      // Room 1 conversation
      const room1Message: Message = {
        id: 'msg-1',
        roomId: 'room-1',
        userId: 'user-1',
        content: 'Room 1 message',
        status: 'sent',
        createdAt: new Date().toISOString(),
      };

      // Room 2 conversation
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
  });
});
