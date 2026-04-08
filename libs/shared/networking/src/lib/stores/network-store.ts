import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export type ConnectionType =
  | 'wifi'
  | 'cellular'
  | 'bluetooth'
  | 'ethernet'
  | 'wimax'
  | 'vpn'
  | 'other'
  | 'unknown'
  | 'none';

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  connectionType: ConnectionType;
}

export interface NetworkStore extends NetworkState {
  setNetworkState: (state: Partial<NetworkState>) => void;
  reset: () => void;
}

const initialState: NetworkState = {
  isConnected: true,
  isInternetReachable: null,
  connectionType: 'unknown',
};

export const useNetworkStore = create<NetworkStore>()(
  devtools(
    immer((set) => ({
      ...initialState,

      setNetworkState: (state: Partial<NetworkState>) =>
        set((draft) => {
          if (state.isConnected !== undefined) {
            draft.isConnected = state.isConnected;
          }
          if (state.isInternetReachable !== undefined) {
            draft.isInternetReachable = state.isInternetReachable;
          }
          if (state.connectionType !== undefined) {
            draft.connectionType = state.connectionType;
          }
        }),

      reset: () =>
        set((draft) => {
          draft.isConnected = initialState.isConnected;
          draft.isInternetReachable = initialState.isInternetReachable;
          draft.connectionType = initialState.connectionType;
        }),
    })),
    { name: 'NetworkStore' }
  )
);
