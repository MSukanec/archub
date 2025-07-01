import { create } from 'zustand';

export type ViewMode = 'day' | 'week' | 'month';

interface GanttStore {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

export const useGanttStore = create<GanttStore>((set) => ({
  viewMode: 'day',
  setViewMode: (mode) => set({ viewMode: mode }),
}));