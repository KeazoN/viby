import NetInfo, {
  NetInfoState,
  NetInfoSubscription,
} from '@react-native-community/netinfo';
import { useNetworkStore, ConnectionType } from './stores/network-store';

/**
 * NetworkMonitor manages network state detection and updates
 * Integrates with @react-native-community/netinfo to track:
 * - Connection status (connected/disconnected)
 * - Internet reachability
 * - Connection type (wifi, cellular, etc.)
 */
export class NetworkMonitor {
  private unsubscribe: NetInfoSubscription | null = null;
  private listeners: Set<(state: NetInfoState) => void> = new Set();

  /**
   * Start monitoring network state changes
   * Updates the network store on every state change
   */
  start(): void {
    if (this.unsubscribe) {
      console.warn('NetworkMonitor is already running');
      return;
    }

    this.unsubscribe = NetInfo.addEventListener((state) => {
      this.handleNetworkStateChange(state);
    });

    // Fetch initial state
    NetInfo.fetch().then((state) => {
      this.handleNetworkStateChange(state);
    });
  }

  /**
   * Stop monitoring network state changes
   */
  stop(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  /**
   * Get current network state
   */
  async getCurrentState(): Promise<NetInfoState> {
    return NetInfo.fetch();
  }

  /**
   * Add a listener for network state changes
   * @param listener - Callback function to be called on state changes
   * @returns Unsubscribe function
   */
  addListener(listener: (state: NetInfoState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Handle network state changes
   * Updates the Zustand store and notifies listeners
   */
  private handleNetworkStateChange(state: NetInfoState): void {
    const connectionType = this.mapConnectionType(state.type);

    useNetworkStore.getState().setNetworkState({
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable,
      connectionType,
    });

    // Notify all listeners
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (error) {
        console.error('Error in network state listener:', error);
      }
    });
  }

  /**
   * Map NetInfo connection type to our ConnectionType
   */
  private mapConnectionType(
    type: NetInfoState['type']
  ): ConnectionType {
    switch (type) {
      case 'wifi':
        return 'wifi';
      case 'cellular':
        return 'cellular';
      case 'bluetooth':
        return 'bluetooth';
      case 'ethernet':
        return 'ethernet';
      case 'wimax':
        return 'wimax';
      case 'vpn':
        return 'vpn';
      case 'other':
        return 'other';
      case 'none':
        return 'none';
      default:
        return 'unknown';
    }
  }
}

// Singleton instance
export const networkMonitor = new NetworkMonitor();
