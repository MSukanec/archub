import { create } from 'zustand';
import { ModalType } from './types';

interface GlobalModalState {
  open: boolean;
  type: ModalType | null;
  data: any;
  openModal: (type: ModalType, data?: any) => void;
  closeModal: () => void;
}

export const useGlobalModalStore = create<GlobalModalState>((set) => ({
  open: false,
  type: null,
  data: null,
  openModal: (type, data = null) => {
    console.log('GlobalModalStore: Opening modal', { type, data });
    set({ open: true, type, data });
  },
  closeModal: () => {
    console.log('GlobalModalStore: Closing modal');
    set({ open: false, type: null, data: null });
  },
}));