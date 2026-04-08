import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

export interface QueuedMessage {
  event: string;
  data: any;
  timestamp: number;
}

export interface RealtimeStore {
  connectionStatus: ConnectionStatus;
  latency: number;
  messageQueue: QueuedMessage[];
  setConnectionStatus: (status: ConnectionStatus) => void;
  setLatency: (latency: number) => void;
  queueMessage: (message: QueuedMessage) => void;
  clearQueue: () => void;
}

export const useRealtimeStore = create<RealtimeStore>()(
  devtools(
    immer((set) => ({
      connectionStatus: 'disconnected',
      latency: 0,
      messageQueue: [],

      setConnectionStatus: (status: ConnectionStatus) =>
        set((state) => {
          state.connectionStatus = status;
        }),

      setLatency: (latency: number) =>
        set((state) => {
          state.latency = latency;
        }),

      queueMessage: (message: QueuedMessage) =>
        set((state) => {
          state.messageQueue.push(message);
        }),

      clearQueue: () =>
        set((state) => {
          state.messageQueue = [];
        }),
    }))
  )
);
