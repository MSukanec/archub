import { create } from 'zustand';

export type ViewMode = 'days' | 'weeks' | 'months';

interface GanttStore {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

export const useGanttStore = create<GanttStore>((set) => ({
  viewMode: 'days',
  setViewMode: (mode) => set({ viewMode: mode }),
}));