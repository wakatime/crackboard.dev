import { APP_NAME } from '@acme/core/constants';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { storage } from '~/lib/storage';

export interface AppState {
  selectedTimelineTabId?: string | null;
  timestamp?: Date;
}

export interface AppActions {
  setSelectedTimelineTabId: (tabId: string | null) => void;
  setTimestamp: (date: Date) => void;
}

export type AppStore = AppState & AppActions;

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      timestamp: new Date(),
      setTimestamp: (timestamp) => set({ timestamp }),
      setSelectedTimelineTabId: (tabId) => set({ selectedTimelineTabId: tabId }),
    }),
    {
      storage,
      name: `${APP_NAME}-state`,
      version: 0,
      partialize(state) {
        delete state.timestamp;
        return state;
      },
    },
  ),
);
