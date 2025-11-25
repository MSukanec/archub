import { create } from 'zustand';

type PanelType = 'view' | 'edit' | 'subform';
type SubformType = 'personal' | 'events' | 'files' | 'attachments' | null;

interface ModalPanelState {
  currentPanel: PanelType;
  currentSubform: SubformType;
  setPanel: (panel: PanelType) => void;
  setCurrentSubform: (subform: SubformType) => void;
  resetToView: () => void;
}

/**
 * @deprecated This store is deprecated and will be removed in a future version.
 * Modals should manage their own panel state using useState internally.
 * 
 * Migration path:
 * 1. Move panel state to local useState in your modal component
 * 2. Pass panel state down to child components as props
 * 3. Remove useModalPanelStore import
 * 
 * Example:
 * ```tsx
 * const [currentPanel, setPanel] = useState<'view' | 'edit' | 'subform'>('view');
 * ```
 */
export const useModalPanelStore = create<ModalPanelState>((set) => ({
  currentPanel: 'view',
  currentSubform: null,
  setPanel: (panel) => set({ currentPanel: panel }),
  setCurrentSubform: (subform) => set({ currentSubform: subform }),
  resetToView: () => set({ currentPanel: 'view', currentSubform: null }),
}));
