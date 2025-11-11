import { create } from 'zustand';

type ActivePanel = 'ai' | null;

interface RightSidebarStore {
  activePanel: ActivePanel;
  setActivePanel: (panel: ActivePanel) => void;
  openAI: () => void;
  closePanel: () => void;
  togglePanel: (panel: 'ai') => void;
}

export const useRightSidebarStore = create<RightSidebarStore>((set, get) => ({
  activePanel: null,
  setActivePanel: (panel) => set({ activePanel: panel }),
  openAI: () => set({ activePanel: 'ai' }),
  closePanel: () => set({ activePanel: null }),
  togglePanel: (panel) => set({ activePanel: get().activePanel === panel ? null : panel }),
}));
