import { create } from 'zustand';
import { ModalType, ModalData } from './types';

interface GlobalModalState {
  open: boolean;
  type: ModalType | null;
  data: ModalData | undefined;
  openModal: (type: ModalType, data?: ModalData) => void;
  closeModal: () => void;
}

export const useGlobalModalStore = create<GlobalModalState>((set) => ({
  open: false,
  type: null,
  data: undefined,
  openModal: (type, data = undefined) => set({ open: true, type, data }),
  closeModal: () => set({ open: false, type: null, data: undefined }),
}));