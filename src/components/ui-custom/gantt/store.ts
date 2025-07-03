import { create } from 'zustand';

export type ViewMode = 'days' | 'weeks' | 'months' | 'quarters';

interface GanttStore {
  viewMode: ViewMode;
  timelineStart: string | null;
  timelineEnd: string | null;
  setViewMode: (mode: ViewMode) => void;
  setTimelineRange: (start: string, end: string) => void;
}

export const useGanttStore = create<GanttStore>((set) => ({
  viewMode: 'days',
  timelineStart: null,
  timelineEnd: null,
  setViewMode: (mode) => set({ viewMode: mode }),
  setTimelineRange: (start, end) => set({ timelineStart: start, timelineEnd: end }),
}));