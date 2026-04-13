import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { useAppStateListener, useAppStateTransitions } from './use-app-state-listener';
import { appStateManager } from '../app-state-manager';

// Mock the app state manager
jest.mock('../app-state-manager', () => ({
  appStateManager: {
    initialize: jest.fn(),
    cleanup: jest.fn(),
    getCurrentState: jest.fn(() => 'active'),
    subscribe: jest.fn(() => jest.fn()),
  },
}));

describe('useAppStateListener', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize app state manager on mount', () => {
    renderHook(() => useAppStateListener());

    expect(appStateManager.initialize).toHaveBeenCalled();
  });

  it('should return current app state', () => {
    (appStateManager.getCurrentState as jest.Mock).mockReturnValue('background');

    const { result } = renderHook(() => useAppStateListener());

    expect(result.current).toBe('background');
  });

  it('should subscribe to app state changes', () => {
    const mockUnsubscribe = jest.fn();
    (appStateManager.subscribe as jest.Mock).mockReturnValue(mockUnsubscribe);

    const { unmount } = renderHook(() => useAppStateListener());

    expect(appStateManager.subscribe).toHaveBeenCalledWith(expect.any(Function));

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('should update state when app state changes', () => {
    let stateChangeCallback: ((state: string) => void) | null = null;

    (appStateManager.subscribe as jest.Mock).mockImplementation((callback) => {
      stateChangeCallback = callback;
      return jest.fn();
    });

    const { result } = renderHook(() => useAppStateListener());

    expect(result.current).toBe('active');

    // Simulate state change
    act(() => {
      stateChangeCallback?.('background');
    });

    expect(result.current).toBe('background');

    // Simulate another state change
    act(() => {
      stateChangeCallback?.('active');
    });

    expect(result.current).toBe('active');
  });
});

describe('useAppStateTransitions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (appStateManager.getCurrentState as jest.Mock).mockReturnValue('active');
  });

  it('should initialize app state manager on mount', () => {
    renderHook(() => useAppStateTransitions({}));

    expect(appStateManager.initialize).toHaveBeenCalled();
  });

  it('should call onForeground when transitioning to active', () => {
    let stateChangeCallback: ((state: string) => void) | null = null;

    (appStateManager.subscribe as jest.Mock).mockImplementation((callback) => {
      stateChangeCallback = callback;
      return jest.fn();
    });

    const onForeground = jest.fn();
    const onBackground = jest.fn();

    renderHook(() =>
      useAppStateTransitions({
        onForeground,
        onBackground,
      })
    );

    // Simulate transition to background first
    act(() => {
      stateChangeCallback?.('background');
    });

    expect(onBackground).toHaveBeenCalledTimes(1);
    expect(onForeground).not.toHaveBeenCalled();

    // Simulate transition to foreground
    act(() => {
      stateChangeCallback?.('active');
    });

    expect(onForeground).toHaveBeenCalledTimes(1);
  });

  it('should call onBackground when transitioning to background', () => {
    let stateChangeCallback: ((state: string) => void) | null = null;

    (appStateManager.subscribe as jest.Mock).mockImplementation((callback) => {
      stateChangeCallback = callback;
      return jest.fn();
    });

    const onBackground = jest.fn();

    renderHook(() =>
      useAppStateTransitions({
        onBackground,
      })
    );

    // Simulate transition to background
    act(() => {
      stateChangeCallback?.('background');
    });

    expect(onBackground).toHaveBeenCalledTimes(1);
  });

  it('should call onInactive when transitioning to inactive', () => {
    let stateChangeCallback: ((state: string) => void) | null = null;

    (appStateManager.subscribe as jest.Mock).mockImplementation((callback) => {
      stateChangeCallback = callback;
      return jest.fn();
    });

    const onInactive = jest.fn();

    renderHook(() =>
      useAppStateTransitions({
        onInactive,
      })
    );

    // Simulate transition to inactive
    act(() => {
      stateChangeCallback?.('inactive');
    });

    expect(onInactive).toHaveBeenCalledTimes(1);
  });

  it('should not call callbacks for non-transition states', () => {
    let stateChangeCallback: ((state: string) => void) | null = null;

    (appStateManager.subscribe as jest.Mock).mockImplementation((callback) => {
      stateChangeCallback = callback;
      return jest.fn();
    });

    const onForeground = jest.fn();
    const onBackground = jest.fn();

    renderHook(() =>
      useAppStateTransitions({
        onForeground,
        onBackground,
      })
    );

    // Simulate staying in active state
    act(() => {
      stateChangeCallback?.('active');
    });

    expect(onForeground).not.toHaveBeenCalled();
    expect(onBackground).not.toHaveBeenCalled();
  });

  it('should handle transition from inactive to active', () => {
    let stateChangeCallback: ((state: string) => void) | null = null;

    (appStateManager.getCurrentState as jest.Mock).mockReturnValue('inactive');
    (appStateManager.subscribe as jest.Mock).mockImplementation((callback) => {
      stateChangeCallback = callback;
      return jest.fn();
    });

    const onForeground = jest.fn();

    renderHook(() =>
      useAppStateTransitions({
        onForeground,
      })
    );

    // Simulate transition from inactive to active
    act(() => {
      stateChangeCallback?.('active');
    });

    expect(onForeground).toHaveBeenCalledTimes(1);
  });

  it('should unsubscribe on unmount', () => {
    const mockUnsubscribe = jest.fn();
    (appStateManager.subscribe as jest.Mock).mockReturnValue(mockUnsubscribe);

    const { unmount } = renderHook(() => useAppStateTransitions({}));

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('should handle missing callbacks gracefully', () => {
    let stateChangeCallback: ((state: string) => void) | null = null;

    (appStateManager.subscribe as jest.Mock).mockImplementation((callback) => {
      stateChangeCallback = callback;
      return jest.fn();
    });

    // Render without any callbacks
    renderHook(() => useAppStateTransitions({}));

    // Should not throw when state changes
    expect(() => {
      act(() => {
        stateChangeCallback?.('background');
        stateChangeCallback?.('active');
        stateChangeCallback?.('inactive');
      });
    }).not.toThrow();
  });
});
