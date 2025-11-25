import { create } from 'zustand';
import { ModalType, ModalData } from '../factory/types';

export interface ModalStackItem {
  type: ModalType;
  data: ModalData | null;
  id: string;
}

interface GlobalModalState {
  stack: ModalStackItem[];
  
  open: boolean;
  type: ModalType | null;
  data: ModalData | null;
  
  openModal: (type: ModalType, data?: ModalData | null) => void;
  pushModal: (type: ModalType, data?: ModalData | null) => void;
  popModal: () => void;
  closeModal: () => void;
  closeAll: () => void;
  updateModalData: (data: Partial<ModalData>) => void;
}

const generateModalId = () => 
  `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useGlobalModalStore = create<GlobalModalState>((set) => ({
  stack: [],
  open: false,
  type: null,
  data: null,

  openModal: (type, data = null) => {
    const newItem: ModalStackItem = { type, data, id: generateModalId() };
    set({
      stack: [newItem],
      open: true,
      type,
      data,
    });
  },

  pushModal: (type, data = null) => set((state) => {
    const newItem: ModalStackItem = { type, data, id: generateModalId() };
    const newStack = [...state.stack, newItem];
    return {
      stack: newStack,
      open: true,
      type,
      data,
    };
  }),

  popModal: () => set((state) => {
    const newStack = state.stack.slice(0, -1);
    const topModal = newStack.length > 0 ? newStack[newStack.length - 1] : null;
    return {
      stack: newStack,
      open: newStack.length > 0,
      type: topModal?.type ?? null,
      data: topModal?.data ?? null,
    };
  }),

  closeModal: () => set((state) => {
    const newStack = state.stack.slice(0, -1);
    const topModal = newStack.length > 0 ? newStack[newStack.length - 1] : null;
    return {
      stack: newStack,
      open: newStack.length > 0,
      type: topModal?.type ?? null,
      data: topModal?.data ?? null,
    };
  }),

  closeAll: () => set({
    stack: [],
    open: false,
    type: null,
    data: null,
  }),

  updateModalData: (data) => set((state) => {
    if (state.stack.length === 0) return state;
    const newStack = [...state.stack];
    const currentIndex = newStack.length - 1;
    const updatedData = { ...newStack[currentIndex].data, ...data };
    newStack[currentIndex] = {
      ...newStack[currentIndex],
      data: updatedData,
    };
    return {
      stack: newStack,
      data: updatedData,
    };
  }),
}));

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
