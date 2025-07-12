import { create } from 'zustand';

export type ViewMode = 'weeks' | 'months' | 'quarters';

interface GanttStore {
  viewMode: ViewMode;
  timelineStart: string | null;
  timelineEnd: string | null;
  setViewMode: (mode: ViewMode) => void;
  setTimelineRange: (start: string, end: string) => void;
  centerOnToday: () => void;
}

export const useGanttStore = create<GanttStore>((set) => ({
  viewMode: 'weeks',
  timelineStart: null,
  timelineEnd: null,
  setViewMode: (mode) => set({ viewMode: mode }),
  setTimelineRange: (start, end) => set({ timelineStart: start, timelineEnd: end }),
  centerOnToday: () => {
    // Esta función será implementada en el componente Gantt
    // Ya que necesita acceso al ref del timeline
  },
}));