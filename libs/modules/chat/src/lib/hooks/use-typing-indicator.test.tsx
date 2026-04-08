import { renderHook, act } from '@testing-library/react-native';
import { useTypingIndicator } from './use-typing-indicator';
import { useChatStore } from '../stores/chat-store';

describe('useTypingIndicator', () => {
  beforeEach(() => {
    // Reset store before each test
    useChatStore.setState({
      messages: {},
      typingUsers: {},
      unreadCounts: {},
    });
  });

  it('should return empty array for room with no typing users', () => {
    const { result } = renderHook(() => useTypingIndicator('room-1'));

    expect(result.current).toEqual([]);
  });

  it('should return typing users for a specific room', () => {
    act(() => {
      useChatStore.setState({
        typingUsers: {
          'room-1': ['user-1', 'user-2'],
        },
      });
    });

    const { result } = renderHook(() => useTypingIndicator('room-1'));

    expect(result.current).toHaveLength(2);
    expect(result.current).toContain('user-1');
    expect(result.current).toContain('user-2');
  });

  it('should only return typing users for the specified room', () => {
    act(() => {
      useChatStore.setState({
        typingUsers: {
          'room-1': ['user-1'],
          'room-2': ['user-2'],
        },
      });
    });

    const { result } = renderHook(() => useTypingIndicator('room-1'));

    expect(result.current).toHaveLength(1);
    expect(result.current).toContain('user-1');
    expect(result.current).not.toContain('user-2');
  });

  it('should update when a user starts typing', () => {
    const { result } = renderHook(() => useTypingIndicator('room-1'));

    expect(result.current).toEqual([]);

    act(() => {
      useChatStore.getState().setTyping('room-1', 'user-1', true);
    });

    expect(result.current).toHaveLength(1);
    expect(result.current).toContain('user-1');
  });

  it('should update when a user stops typing', () => {
    act(() => {
      useChatStore.setState({
        typingUsers: {
          'room-1': ['user-1'],
        },
      });
    });

    const { result } = renderHook(() => useTypingIndicator('room-1'));

    expect(result.current).toContain('user-1');

    act(() => {
      useChatStore.getState().setTyping('room-1', 'user-1', false);
    });

    expect(result.current).toEqual([]);
  });

  it('should handle multiple users typing and stopping', () => {
    const { result } = renderHook(() => useTypingIndicator('room-1'));

    // User 1 starts typing
    act(() => {
      useChatStore.getState().setTyping('room-1', 'user-1', true);
    });

    expect(result.current).toHaveLength(1);
    expect(result.current).toContain('user-1');

    // User 2 starts typing
    act(() => {
      useChatStore.getState().setTyping('room-1', 'user-2', true);
    });

    expect(result.current).toHaveLength(2);
    expect(result.current).toContain('user-1');
    expect(result.current).toContain('user-2');

    // User 1 stops typing
    act(() => {
      useChatStore.getState().setTyping('room-1', 'user-1', false);
    });

    expect(result.current).toHaveLength(1);
    expect(result.current).toContain('user-2');
    expect(result.current).not.toContain('user-1');

    // User 2 stops typing
    act(() => {
      useChatStore.getState().setTyping('room-1', 'user-2', false);
    });

    expect(result.current).toEqual([]);
  });

  it('should not add duplicate typing users', () => {
    const { result } = renderHook(() => useTypingIndicator('room-1'));

    // User 1 starts typing
    act(() => {
      useChatStore.getState().setTyping('room-1', 'user-1', true);
    });

    expect(result.current).toHaveLength(1);

    // User 1 starts typing again (should not duplicate)
    act(() => {
      useChatStore.getState().setTyping('room-1', 'user-1', true);
    });

    expect(result.current).toHaveLength(1);
    expect(result.current).toContain('user-1');
  });

  it('should not re-render when typing users in other rooms change', () => {
    const { result } = renderHook(() => useTypingIndicator('room-1'));

    expect(result.current).toEqual([]);

    // Add typing user to a different room
    act(() => {
      useChatStore.getState().setTyping('room-2', 'user-1', true);
    });

    // Should not affect room-1
    expect(result.current).toEqual([]);
  });

  it('should handle rapid typing indicator changes', () => {
    const { result } = renderHook(() => useTypingIndicator('room-1'));

    // Simulate rapid typing start/stop
    act(() => {
      useChatStore.getState().setTyping('room-1', 'user-1', true);
      useChatStore.getState().setTyping('room-1', 'user-1', false);
      useChatStore.getState().setTyping('room-1', 'user-1', true);
    });

    expect(result.current).toHaveLength(1);
    expect(result.current).toContain('user-1');

    act(() => {
      useChatStore.getState().setTyping('room-1', 'user-1', false);
    });

    expect(result.current).toEqual([]);
  });
});
