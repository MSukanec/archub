import { create } from 'zustand';

type PanelType = 'view' | 'edit' | 'subform';

interface ModalPanelState {
  currentPanel: PanelType;
  setPanel: (panel: PanelType) => void;
  resetToView: () => void;
}

export const useModalPanelStore = create<ModalPanelState>((set) => ({
  currentPanel: 'view',
  setPanel: (panel) => set({ currentPanel: panel }),
  resetToView: () => set({ currentPanel: 'view' }),
}));