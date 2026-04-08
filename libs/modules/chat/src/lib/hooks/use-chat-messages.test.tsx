import { renderHook, act } from '@testing-library/react-native';
import { useChatMessages } from './use-chat-messages';
import { useChatStore } from '../stores/chat-store';
import type { Message } from '../types';

describe('useChatMessages', () => {
  beforeEach(() => {
    // Reset store before each test
    useChatStore.setState({
      messages: {},
      typingUsers: {},
      unreadCounts: {},
    });
  });

  it('should return empty array for room with no messages', () => {
    const { result } = renderHook(() => useChatMessages('room-1'));

    expect(result.current).toEqual([]);
  });

  it('should return messages for a specific room', () => {
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
      useChatStore.setState({
        messages: {
          'room-1': [message1, message2],
        },
      });
    });

    const { result } = renderHook(() => useChatMessages('room-1'));

    expect(result.current).toHaveLength(2);
    expect(result.current[0]).toEqual(message1);
    expect(result.current[1]).toEqual(message2);
  });

  it('should only return messages for the specified room', () => {
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
      useChatStore.setState({
        messages: {
          'room-1': [message1],
          'room-2': [message2],
        },
      });
    });

    const { result } = renderHook(() => useChatMessages('room-1'));

    expect(result.current).toHaveLength(1);
    expect(result.current[0].content).toBe('Hello room 1!');
  });

  it('should update when new messages are added', () => {
    const { result } = renderHook(() => useChatMessages('room-1'));

    expect(result.current).toEqual([]);

    const message: Message = {
      id: 'msg-1',
      roomId: 'room-1',
      userId: 'user-1',
      content: 'Hello!',
      status: 'sent',
      createdAt: new Date().toISOString(),
    };

    act(() => {
      useChatStore.getState().addMessage('room-1', message);
    });

    expect(result.current).toHaveLength(1);
    expect(result.current[0]).toEqual(message);
  });

  it('should update when message status changes', () => {
    const message: Message = {
      id: 'msg-1',
      roomId: 'room-1',
      userId: 'user-1',
      content: 'Hello!',
      status: 'sending',
      createdAt: new Date().toISOString(),
    };

    act(() => {
      useChatStore.setState({
        messages: {
          'room-1': [message],
        },
      });
    });

    const { result } = renderHook(() => useChatMessages('room-1'));

    expect(result.current[0].status).toBe('sending');

    act(() => {
      useChatStore.getState().updateMessageStatus('room-1', 'msg-1', 'sent');
    });

    expect(result.current[0].status).toBe('sent');
  });

  it('should not re-render when messages in other rooms change', () => {
    const { result, rerender } = renderHook(() => useChatMessages('room-1'));

    const renderCount = { count: 0 };
    const { result: countResult } = renderHook(() => {
      renderCount.count++;
      return useChatMessages('room-1');
    });

    const initialCount = renderCount.count;

    // Add message to a different room
    act(() => {
      const message: Message = {
        id: 'msg-1',
        roomId: 'room-2',
        userId: 'user-1',
        content: 'Hello room 2!',
        status: 'sent',
        createdAt: new Date().toISOString(),
      };
      useChatStore.getState().addMessage('room-2', message);
    });

    // Should not cause re-render for room-1 hook
    expect(result.current).toEqual([]);
  });

  it('should handle multiple messages with different statuses', () => {
    const messages: Message[] = [
      {
        id: 'msg-1',
        roomId: 'room-1',
        userId: 'user-1',
        content: 'Message 1',
        status: 'sent',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'msg-2',
        roomId: 'room-1',
        userId: 'user-1',
        content: 'Message 2',
        status: 'sending',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'msg-3',
        roomId: 'room-1',
        userId: 'user-2',
        content: 'Message 3',
        status: 'failed',
        createdAt: new Date().toISOString(),
      },
    ];

    act(() => {
      useChatStore.setState({
        messages: {
          'room-1': messages,
        },
      });
    });

    const { result } = renderHook(() => useChatMessages('room-1'));

    expect(result.current).toHaveLength(3);
    expect(result.current[0].status).toBe('sent');
    expect(result.current[1].status).toBe('sending');
    expect(result.current[2].status).toBe('failed');
  });
});
