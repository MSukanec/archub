import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface ModalStackItem {
  type: string;
  data: Record<string, any> | null;
  id: string;
}

interface GlobalModalState {
  stack: ModalStackItem[];
  
  blockCloseForDirtyForms: boolean;
  
  openModal: (type: string, data?: Record<string, any> | null) => void;
  pushModal: (type: string, data?: Record<string, any> | null) => void;
  popModal: () => void;
  closeModal: () => void;
  closeAll: () => void;
  updateModalData: (data: Record<string, any>) => void;
  
  setBlockClose: () => void;
  clearBlockClose: () => void;
}

const generateModalId = () => 
  `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useGlobalModalStore = create<GlobalModalState>()(
  subscribeWithSelector((set, get) => ({
    stack: [],
    blockCloseForDirtyForms: false,

    openModal: (type, data = null) => {
      const newItem: ModalStackItem = { type, data, id: generateModalId() };
      set({ stack: [newItem] });
    },

    pushModal: (type, data = null) => {
      const newItem: ModalStackItem = { type, data, id: generateModalId() };
      set((state) => ({ stack: [...state.stack, newItem] }));
    },

    popModal: () => {
      const { blockCloseForDirtyForms } = get();
      if (blockCloseForDirtyForms) {
        return;
      }
      set((state) => ({ stack: state.stack.slice(0, -1) }));
    },

    closeModal: () => {
      const { blockCloseForDirtyForms } = get();
      if (blockCloseForDirtyForms) {
        return;
      }
      set((state) => ({ stack: state.stack.slice(0, -1) }));
    },

    closeAll: () => {
      const { blockCloseForDirtyForms } = get();
      if (blockCloseForDirtyForms) {
        return;
      }
      set({ stack: [], blockCloseForDirtyForms: false });
    },

    updateModalData: (data) => set((state) => {
      if (state.stack.length === 0) return state;
      const newStack = [...state.stack];
      const currentIndex = newStack.length - 1;
      newStack[currentIndex] = {
        ...newStack[currentIndex],
        data: { ...newStack[currentIndex].data, ...data },
      };
      return { stack: newStack };
    }),

    setBlockClose: () => set({ blockCloseForDirtyForms: true }),
    clearBlockClose: () => set({ blockCloseForDirtyForms: false }),
  }))
);

export const useCurrentModal = () => 
  useGlobalModalStore((state) => 
    state.stack.length > 0 ? state.stack[state.stack.length - 1] : null
  );

export const useIsModalOpen = () => 
  useGlobalModalStore((state) => state.stack.length > 0);

export const useModalStack = () => 
  useGlobalModalStore((state) => state.stack);

export const useModalStackSize = () => 
  useGlobalModalStore((state) => state.stack.length);

export const useCanCloseModal = () =>
  useGlobalModalStore((state) => !state.blockCloseForDirtyForms);
