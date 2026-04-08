import { renderHook, act } from '@testing-library/react-native';
import { useNetworkStore } from './network-store';

describe('NetworkStore', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useNetworkStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useNetworkStore());

      expect(result.current.isConnected).toBe(true);
      expect(result.current.isInternetReachable).toBe(null);
      expect(result.current.connectionType).toBe('unknown');
    });
  });

  describe('setNetworkState', () => {
    it('should update isConnected', () => {
      const { result } = renderHook(() => useNetworkStore());

      act(() => {
        result.current.setNetworkState({ isConnected: false });
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.isInternetReachable).toBe(null);
      expect(result.current.connectionType).toBe('unknown');
    });

    it('should update isInternetReachable', () => {
      const { result } = renderHook(() => useNetworkStore());

      act(() => {
        result.current.setNetworkState({ isInternetReachable: true });
      });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.isInternetReachable).toBe(true);
      expect(result.current.connectionType).toBe('unknown');
    });

    it('should update connectionType', () => {
      const { result } = renderHook(() => useNetworkStore());

      act(() => {
        result.current.setNetworkState({ connectionType: 'wifi' });
      });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.isInternetReachable).toBe(null);
      expect(result.current.connectionType).toBe('wifi');
    });

    it('should update multiple properties at once', () => {
      const { result } = renderHook(() => useNetworkStore());

      act(() => {
        result.current.setNetworkState({
          isConnected: false,
          isInternetReachable: false,
          connectionType: 'none',
        });
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.isInternetReachable).toBe(false);
      expect(result.current.connectionType).toBe('none');
    });

    it('should handle partial updates', () => {
      const { result } = renderHook(() => useNetworkStore());

      // First update
      act(() => {
        result.current.setNetworkState({
          isConnected: false,
          connectionType: 'cellular',
        });
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.isInternetReachable).toBe(null);
      expect(result.current.connectionType).toBe('cellular');

      // Second update - only change isInternetReachable
      act(() => {
        result.current.setNetworkState({
          isInternetReachable: true,
        });
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.isInternetReachable).toBe(true);
      expect(result.current.connectionType).toBe('cellular');
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      const { result } = renderHook(() => useNetworkStore());

      // Change state
      act(() => {
        result.current.setNetworkState({
          isConnected: false,
          isInternetReachable: false,
          connectionType: 'cellular',
        });
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.isInternetReachable).toBe(false);
      expect(result.current.connectionType).toBe('cellular');

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.isInternetReachable).toBe(null);
      expect(result.current.connectionType).toBe('unknown');
    });
  });

  describe('Connection Type Values', () => {
    const connectionTypes = [
      'wifi',
      'cellular',
      'bluetooth',
      'ethernet',
      'wimax',
      'vpn',
      'other',
      'unknown',
      'none',
    ] as const;

    connectionTypes.forEach((type) => {
      it(`should handle connectionType: ${type}`, () => {
        const { result } = renderHook(() => useNetworkStore());

        act(() => {
          result.current.setNetworkState({ connectionType: type });
        });

        expect(result.current.connectionType).toBe(type);
      });
    });
  });

  describe('State Transitions', () => {
    it('should handle online to offline transition', () => {
      const { result } = renderHook(() => useNetworkStore());

      // Start online
      act(() => {
        result.current.setNetworkState({
          isConnected: true,
          isInternetReachable: true,
          connectionType: 'wifi',
        });
      });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.isInternetReachable).toBe(true);

      // Go offline
      act(() => {
        result.current.setNetworkState({
          isConnected: false,
          isInternetReachable: false,
          connectionType: 'none',
        });
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.isInternetReachable).toBe(false);
      expect(result.current.connectionType).toBe('none');
    });

    it('should handle connection type changes while staying online', () => {
      const { result } = renderHook(() => useNetworkStore());

      // Start with WiFi
      act(() => {
        result.current.setNetworkState({
          isConnected: true,
          isInternetReachable: true,
          connectionType: 'wifi',
        });
      });

      expect(result.current.connectionType).toBe('wifi');

      // Switch to cellular
      act(() => {
        result.current.setNetworkState({
          connectionType: 'cellular',
        });
      });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.isInternetReachable).toBe(true);
      expect(result.current.connectionType).toBe('cellular');
    });
  });
});
