import { create } from 'zustand'

interface MobileMenuState {
  isOpen: boolean
  openMenu: () => void
  closeMenu: () => void
  toggleMenu: () => void
}

export const useMobileMenuStore = create<MobileMenuState>((set) => ({
  isOpen: false,
  openMenu: () => {
    console.log('🟢 Store openMenu called');
    set({ isOpen: true });
  },
  closeMenu: () => {
    console.log('🔴 Store closeMenu called - setting isOpen to false');
    set({ isOpen: false });
    console.log('🔴 Store state updated');
  },
  toggleMenu: () => set((state) => ({ isOpen: !state.isOpen })),
}))