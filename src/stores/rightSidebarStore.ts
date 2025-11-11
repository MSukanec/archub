import { create } from 'zustand';

type ActivePanel = 'ai' | 'support' | null;

interface RightSidebarStore {
  activePanel: ActivePanel;
  setActivePanel: (panel: ActivePanel) => void;
  openAI: () => void;
  openSupport: () => void;
  closePanel: () => void;
  togglePanel: (panel: 'ai' | 'support') => void;
}

export const useRightSidebarStore = create<RightSidebarStore>((set, get) => ({
  activePanel: null,
  setActivePanel: (panel) => set({ activePanel: panel }),
  openAI: () => set({ activePanel: 'ai' }),
  openSupport: () => set({ activePanel: 'support' }),
  closePanel: () => set({ activePanel: null }),
  togglePanel: (panel) => set({ activePanel: get().activePanel === panel ? null : panel }),
}));
