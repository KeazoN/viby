import { renderHook, act } from '@testing-library/react-native';
import { useChat } from './use-chat';
import { useChatStore } from '../stores/chat-store';
import type { Message } from '../types';

describe('useChat', () => {
  beforeEach(() => {
    // Reset store before each test
    useChatStore.setState({
      messages: {},
      typingUsers: {},
      unreadCounts: {},
    });
  });

  it('should return chat store state and actions', () => {
    const { result } = renderHook(() => useChat());

    expect(result.current).toHaveProperty('messages');
    expect(result.current).toHaveProperty('typingUsers');
    expect(result.current).toHaveProperty('unreadCounts');
    expect(result.current).toHaveProperty('addMessage');
    expect(result.current).toHaveProperty('updateMessageStatus');
    expect(result.current).toHaveProperty('setTyping');
    expect(result.current).toHaveProperty('markAsRead');
  });

  it('should add a message to a room', () => {
    const { result } = renderHook(() => useChat());

    const message: Message = {
      id: 'msg-1',
      roomId: 'room-1',
      userId: 'user-1',
      content: 'Hello!',
      status: 'sent',
      createdAt: new Date().toISOString(),
    };

    act(() => {
      result.current.addMessage('room-1', message);
    });

    expect(result.current.messages['room-1']).toHaveLength(1);
    expect(result.current.messages['room-1'][0]).toEqual(message);
  });

  it('should add multiple messages to the same room', () => {
    const { result } = renderHook(() => useChat());

    const message1: Message = {
      id: 'msg-1',
      roomId: 'room-1',
      userId: 'user-1',
      content: 'Hello!',
      status: 'sent',
      createdAt: new Date().toISOString(),
    };

    const message2: Message = {
      id: 'msg-2',
      roomId: 'room-1',
      userId: 'user-2',
      content: 'Hi there!',
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

  it('should update message status', () => {
    const { result } = renderHook(() => useChat());

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

  it('should set typing indicator for a user', () => {
    const { result } = renderHook(() => useChat());

    act(() => {
      result.current.setTyping('room-1', 'user-1', true);
    });

    expect(result.current.typingUsers['room-1']).toContain('user-1');
  });

  it('should remove typing indicator when user stops typing', () => {
    const { result } = renderHook(() => useChat());

    act(() => {
      result.current.setTyping('room-1', 'user-1', true);
    });

    expect(result.current.typingUsers['room-1']).toContain('user-1');

    act(() => {
      result.current.setTyping('room-1', 'user-1', false);
    });

    expect(result.current.typingUsers['room-1']).not.toContain('user-1');
  });

  it('should handle multiple users typing', () => {
    const { result } = renderHook(() => useChat());

    act(() => {
      result.current.setTyping('room-1', 'user-1', true);
      result.current.setTyping('room-1', 'user-2', true);
    });

    expect(result.current.typingUsers['room-1']).toHaveLength(2);
    expect(result.current.typingUsers['room-1']).toContain('user-1');
    expect(result.current.typingUsers['room-1']).toContain('user-2');
  });

  it('should mark messages as read', () => {
    const { result } = renderHook(() => useChat());

    // Set initial unread count
    act(() => {
      useChatStore.setState({
        unreadCounts: { 'room-1': 5 },
      });
    });

    expect(result.current.unreadCounts['room-1']).toBe(5);

    act(() => {
      result.current.markAsRead('room-1');
    });

    expect(result.current.unreadCounts['room-1']).toBe(0);
  });

  it('should handle messages in different rooms independently', () => {
    const { result } = renderHook(() => useChat());

    const message1: Message = {
      id: 'msg-1',
      roomId: 'room-1',
      userId: 'user-1',
      content: 'Hello room 1!',
      status: 'sent',
      createdAt: new Date().toISOString(),
    };

    const message2: Message = {
      id: 'msg-2',
      roomId: 'room-2',
      userId: 'user-1',
      content: 'Hello room 2!',
      status: 'sent',
      createdAt: new Date().toISOString(),
    };

    act(() => {
      result.current.addMessage('room-1', message1);
      result.current.addMessage('room-2', message2);
    });

    expect(result.current.messages['room-1']).toHaveLength(1);
    expect(result.current.messages['room-2']).toHaveLength(1);
    expect(result.current.messages['room-1'][0].content).toBe('Hello room 1!');
    expect(result.current.messages['room-2'][0].content).toBe('Hello room 2!');
  });

  it('should not update status for non-existent message', () => {
    const { result } = renderHook(() => useChat());

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

    // Try to update a non-existent message
    act(() => {
      result.current.updateMessageStatus('room-1', 'non-existent', 'sent');
    });

    // Original message should remain unchanged
    expect(result.current.messages['room-1'][0].status).toBe('sending');
  });
});
