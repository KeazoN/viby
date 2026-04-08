import { renderHook, act, waitFor } from '@testing-library/react-native';
import {
  useNetworkMonitor,
  useNetworkState,
  useIsOnline,
  useNetworkStateChange,
} from './use-network-monitor';
import { networkMonitor } from '../network-monitor';
import { useNetworkStore } from '../stores/network-store';

// Mock the network monitor
jest.mock('../network-monitor', () => ({
  networkMonitor: {
    start: jest.fn(),
    stop: jest.fn(),
  },
}));

describe('Network Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useNetworkStore.getState().reset();
  });

  describe('useNetworkMonitor', () => {
    it('should start network monitor on mount', () => {
      renderHook(() => useNetworkMonitor());

      expect(networkMonitor.start).toHaveBeenCalledTimes(1);
    });

    it('should stop network monitor on unmount', () => {
      const { unmount } = renderHook(() => useNetworkMonitor());

      unmount();

      expect(networkMonitor.stop).toHaveBeenCalledTimes(1);
    });

    it('should only start monitor once', () => {
      const { rerender } = renderHook(() => useNetworkMonitor());

      rerender();
      rerender();

      expect(networkMonitor.start).toHaveBeenCalledTimes(1);
    });
  });

  describe('useNetworkState', () => {
    it('should return initial network state', () => {
      const { result } = renderHook(() => useNetworkState());

      expect(result.current).toEqual({
        isConnected: true,
        isInternetReachable: null,
        connectionType: 'unknown',
      });
    });

    it('should return updated network state', () => {
      const { result } = renderHook(() => useNetworkState());

      act(() => {
        useNetworkStore.getState().setNetworkState({
          isConnected: false,
          isInternetReachable: false,
          connectionType: 'none',
        });
      });

      expect(result.current).toEqual({
        isConnected: false,
        isInternetReachable: false,
        connectionType: 'none',
      });
    });

    it('should update when network state changes', () => {
      const { result } = renderHook(() => useNetworkState());

      // Initial state
      expect(result.current.isConnected).toBe(true);

      // Change to offline
      act(() => {
        useNetworkStore.getState().setNetworkState({
          isConnected: false,
        });
      });

      expect(result.current.isConnected).toBe(false);

      // Change back to online
      act(() => {
        useNetworkStore.getState().setNetworkState({
          isConnected: true,
        });
      });

      expect(result.current.isConnected).toBe(true);
    });
  });

  describe('useIsOnline', () => {
    it('should return true when connected and internet is reachable', () => {
      const { result } = renderHook(() => useIsOnline());

      act(() => {
        useNetworkStore.getState().setNetworkState({
          isConnected: true,
          isInternetReachable: true,
        });
      });

      expect(result.current).toBe(true);
    });

    it('should return false when not connected', () => {
      const { result } = renderHook(() => useIsOnline());

      act(() => {
        useNetworkStore.getState().setNetworkState({
          isConnected: false,
          isInternetReachable: false,
        });
      });

      expect(result.current).toBe(false);
    });

    it('should return false when connected but internet is not reachable', () => {
      const { result } = renderHook(() => useIsOnline());

      act(() => {
        useNetworkStore.getState().setNetworkState({
          isConnected: true,
          isInternetReachable: false,
        });
      });

      expect(result.current).toBe(false);
    });

    it('should return true when connected and internet reachability is unknown', () => {
      const { result } = renderHook(() => useIsOnline());

      act(() => {
        useNetworkStore.getState().setNetworkState({
          isConnected: true,
          isInternetReachable: null,
        });
      });

      expect(result.current).toBe(true);
    });

    it('should update when network state changes', () => {
      const { result } = renderHook(() => useIsOnline());

      // Start online
      act(() => {
        useNetworkStore.getState().setNetworkState({
          isConnected: true,
          isInternetReachable: true,
        });
      });

      expect(result.current).toBe(true);

      // Go offline
      act(() => {
        useNetworkStore.getState().setNetworkState({
          isConnected: false,
          isInternetReachable: false,
        });
      });

      expect(result.current).toBe(false);

      // Come back online
      act(() => {
        useNetworkStore.getState().setNetworkState({
          isConnected: true,
          isInternetReachable: true,
        });
      });

      expect(result.current).toBe(true);
    });
  });

  describe('useNetworkStateChange', () => {
    it('should call callback on mount with initial state', () => {
      const callback = jest.fn();

      renderHook(() => useNetworkStateChange(callback));

      expect(callback).toHaveBeenCalledWith({
        isConnected: true,
        isInternetReachable: null,
        connectionType: 'unknown',
      });
    });

    it('should call callback when isConnected changes', () => {
      const callback = jest.fn();

      renderHook(() => useNetworkStateChange(callback));

      callback.mockClear();

      act(() => {
        useNetworkStore.getState().setNetworkState({
          isConnected: false,
        });
      });

      expect(callback).toHaveBeenCalledWith({
        isConnected: false,
        isInternetReachable: null,
        connectionType: 'unknown',
      });
    });

    it('should call callback when isInternetReachable changes', () => {
      const callback = jest.fn();

      renderHook(() => useNetworkStateChange(callback));

      callback.mockClear();

      act(() => {
        useNetworkStore.getState().setNetworkState({
          isInternetReachable: true,
        });
      });

      expect(callback).toHaveBeenCalledWith({
        isConnected: true,
        isInternetReachable: true,
        connectionType: 'unknown',
      });
    });

    it('should call callback when connectionType changes', () => {
      const callback = jest.fn();

      renderHook(() => useNetworkStateChange(callback));

      callback.mockClear();

      act(() => {
        useNetworkStore.getState().setNetworkState({
          connectionType: 'wifi',
        });
      });

      expect(callback).toHaveBeenCalledWith({
        isConnected: true,
        isInternetReachable: null,
        connectionType: 'wifi',
      });
    });

    it('should call callback multiple times for multiple changes', () => {
      const callback = jest.fn();

      renderHook(() => useNetworkStateChange(callback));

      callback.mockClear();

      // First change
      act(() => {
        useNetworkStore.getState().setNetworkState({
          isConnected: false,
        });
      });

      expect(callback).toHaveBeenCalledTimes(1);

      // Second change
      act(() => {
        useNetworkStore.getState().setNetworkState({
          connectionType: 'none',
        });
      });

      expect(callback).toHaveBeenCalledTimes(2);

      // Third change
      act(() => {
        useNetworkStore.getState().setNetworkState({
          isConnected: true,
          connectionType: 'wifi',
        });
      });

      expect(callback).toHaveBeenCalledTimes(3);
    });

    it('should not call callback when unrelated state changes', () => {
      const callback = jest.fn();

      renderHook(() => useNetworkStateChange(callback));

      callback.mockClear();

      // This shouldn't trigger the callback since we're setting the same values
      act(() => {
        useNetworkStore.getState().setNetworkState({
          isConnected: true,
          isInternetReachable: null,
          connectionType: 'unknown',
        });
      });

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    it('should work together - monitor, state, and online check', () => {
      const { result: monitorResult } = renderHook(() => useNetworkMonitor());
      const { result: stateResult } = renderHook(() => useNetworkState());
      const { result: onlineResult } = renderHook(() => useIsOnline());

      expect(networkMonitor.start).toHaveBeenCalled();
      expect(stateResult.current.isConnected).toBe(true);
      expect(onlineResult.current).toBe(true);

      // Simulate going offline
      act(() => {
        useNetworkStore.getState().setNetworkState({
          isConnected: false,
          isInternetReachable: false,
          connectionType: 'none',
        });
      });

      expect(stateResult.current.isConnected).toBe(false);
      expect(stateResult.current.isInternetReachable).toBe(false);
      expect(stateResult.current.connectionType).toBe('none');
      expect(onlineResult.current).toBe(false);
    });
  });
});
