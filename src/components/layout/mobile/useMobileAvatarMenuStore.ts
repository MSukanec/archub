import { create } from 'zustand';

interface MobileAvatarMenuStore {
  isOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
}

export const useMobileAvatarMenuStore = create<MobileAvatarMenuStore>((set) => ({
  isOpen: false,
  openMenu: () => set({ isOpen: true }),
  closeMenu: () => set({ isOpen: false }),
}));