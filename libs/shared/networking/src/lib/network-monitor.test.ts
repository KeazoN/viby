import NetInfo from '@react-native-community/netinfo';
import { NetworkMonitor } from './network-monitor';
import { useNetworkStore } from './stores/network-store';

// Mock NetInfo
jest.mock('@react-native-community/netinfo');

describe('NetworkMonitor', () => {
  let monitor: NetworkMonitor;
  let mockUnsubscribe: jest.Mock;

  beforeEach(() => {
    monitor = new NetworkMonitor();
    mockUnsubscribe = jest.fn();

    // Reset store
    useNetworkStore.getState().reset();

    // Mock NetInfo.addEventListener
    (NetInfo.addEventListener as jest.Mock).mockReturnValue(mockUnsubscribe);

    // Mock NetInfo.fetch
    (NetInfo.fetch as jest.Mock).mockResolvedValue({
      type: 'wifi',
      isConnected: true,
      isInternetReachable: true,
    });
  });

  afterEach(() => {
    monitor.stop();
    jest.clearAllMocks();
  });

  describe('start', () => {
    it('should start monitoring network state', () => {
      monitor.start();

      expect(NetInfo.addEventListener).toHaveBeenCalledTimes(1);
      expect(NetInfo.fetch).toHaveBeenCalledTimes(1);
    });

    it('should not start monitoring if already running', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      monitor.start();
      monitor.start();

      expect(NetInfo.addEventListener).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'NetworkMonitor is already running'
      );

      consoleWarnSpy.mockRestore();
    });

    it('should update store with initial network state', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        type: 'wifi',
        isConnected: true,
        isInternetReachable: true,
      });

      monitor.start();

      // Wait for fetch to complete
      await new Promise((resolve) => setTimeout(resolve, 0));

      const state = useNetworkStore.getState();
      expect(state.isConnected).toBe(true);
      expect(state.isInternetReachable).toBe(true);
      expect(state.connectionType).toBe('wifi');
    });
  });

  describe('stop', () => {
    it('should stop monitoring network state', () => {
      monitor.start();
      monitor.stop();

      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });

    it('should handle stop when not running', () => {
      expect(() => monitor.stop()).not.toThrow();
    });
  });

  describe('getCurrentState', () => {
    it('should return current network state', async () => {
      const mockState = {
        type: 'cellular',
        isConnected: true,
        isInternetReachable: true,
      };

      (NetInfo.fetch as jest.Mock).mockResolvedValue(mockState);

      const state = await monitor.getCurrentState();

      expect(state).toEqual(mockState);
      expect(NetInfo.fetch).toHaveBeenCalled();
    });
  });

  describe('addListener', () => {
    it('should add listener and return unsubscribe function', () => {
      const listener = jest.fn();

      const unsubscribe = monitor.addListener(listener);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should call listener on network state change', () => {
      const listener = jest.fn();
      let stateChangeCallback: any;

      (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
        stateChangeCallback = callback;
        return mockUnsubscribe;
      });

      monitor.start();
      monitor.addListener(listener);

      const newState = {
        type: 'cellular',
        isConnected: true,
        isInternetReachable: true,
      };

      stateChangeCallback(newState);

      expect(listener).toHaveBeenCalledWith(newState);
    });

    it('should remove listener when unsubscribe is called', () => {
      const listener = jest.fn();
      let stateChangeCallback: any;

      (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
        stateChangeCallback = callback;
        return mockUnsubscribe;
      });

      monitor.start();
      const unsubscribe = monitor.addListener(listener);

      unsubscribe();

      const newState = {
        type: 'cellular',
        isConnected: true,
        isInternetReachable: true,
      };

      stateChangeCallback(newState);

      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle listener errors gracefully', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const errorListener = jest.fn(() => {
        throw new Error('Listener error');
      });
      let stateChangeCallback: any;

      (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
        stateChangeCallback = callback;
        return mockUnsubscribe;
      });

      monitor.start();
      monitor.addListener(errorListener);

      const newState = {
        type: 'wifi',
        isConnected: true,
        isInternetReachable: true,
      };

      expect(() => stateChangeCallback(newState)).not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Network State Changes', () => {
    let stateChangeCallback: any;

    beforeEach(() => {
      (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
        stateChangeCallback = callback;
        return mockUnsubscribe;
      });

      monitor.start();
    });

    it('should update store when network connects', () => {
      const newState = {
        type: 'wifi',
        isConnected: true,
        isInternetReachable: true,
      };

      stateChangeCallback(newState);

      const state = useNetworkStore.getState();
      expect(state.isConnected).toBe(true);
      expect(state.isInternetReachable).toBe(true);
      expect(state.connectionType).toBe('wifi');
    });

    it('should update store when network disconnects', () => {
      const newState = {
        type: 'none',
        isConnected: false,
        isInternetReachable: false,
      };

      stateChangeCallback(newState);

      const state = useNetworkStore.getState();
      expect(state.isConnected).toBe(false);
      expect(state.isInternetReachable).toBe(false);
      expect(state.connectionType).toBe('none');
    });

    it('should handle null isConnected', () => {
      const newState = {
        type: 'unknown',
        isConnected: null,
        isInternetReachable: null,
      };

      stateChangeCallback(newState);

      const state = useNetworkStore.getState();
      expect(state.isConnected).toBe(false);
    });

    it('should map all connection types correctly', () => {
      const connectionTypes = [
        { netInfo: 'wifi', expected: 'wifi' },
        { netInfo: 'cellular', expected: 'cellular' },
        { netInfo: 'bluetooth', expected: 'bluetooth' },
        { netInfo: 'ethernet', expected: 'ethernet' },
        { netInfo: 'wimax', expected: 'wimax' },
        { netInfo: 'vpn', expected: 'vpn' },
        { netInfo: 'other', expected: 'other' },
        { netInfo: 'none', expected: 'none' },
        { netInfo: 'unknown', expected: 'unknown' },
      ];

      connectionTypes.forEach(({ netInfo, expected }) => {
        const newState = {
          type: netInfo,
          isConnected: netInfo !== 'none',
          isInternetReachable: netInfo !== 'none',
        };

        stateChangeCallback(newState);

        const state = useNetworkStore.getState();
        expect(state.connectionType).toBe(expected);
      });
    });
  });

  describe('Multiple Listeners', () => {
    it('should notify all listeners on state change', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      const listener3 = jest.fn();
      let stateChangeCallback: any;

      (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
        stateChangeCallback = callback;
        return mockUnsubscribe;
      });

      monitor.start();
      monitor.addListener(listener1);
      monitor.addListener(listener2);
      monitor.addListener(listener3);

      const newState = {
        type: 'wifi',
        isConnected: true,
        isInternetReachable: true,
      };

      stateChangeCallback(newState);

      expect(listener1).toHaveBeenCalledWith(newState);
      expect(listener2).toHaveBeenCalledWith(newState);
      expect(listener3).toHaveBeenCalledWith(newState);
    });
  });
});
