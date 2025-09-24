import { create } from 'zustand';

type PanelType = 'view' | 'edit' | 'subform';
type SubformType = 'personal' | 'events' | 'files' | 'equipment' | 'tasks' | 'attachments' | null;

interface ModalPanelState {
  currentPanel: PanelType;
  currentSubform: SubformType;
  setPanel: (panel: PanelType) => void;
  setCurrentSubform: (subform: SubformType) => void;
  resetToView: () => void;
}

export const useModalPanelStore = create<ModalPanelState>((set) => ({
  currentPanel: 'view',
  currentSubform: null,
  setPanel: (panel) => set({ currentPanel: panel }),
  setCurrentSubform: (subform) => set({ currentSubform: subform }),
  resetToView: () => set({ currentPanel: 'view', currentSubform: null }),
}));