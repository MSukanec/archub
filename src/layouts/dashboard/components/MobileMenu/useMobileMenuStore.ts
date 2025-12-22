import { create } from 'zustand'

export type MobileMenuMode = 'dashboard' | 'marketing'

interface MobileMenuState {
  isOpen: boolean
  mode: MobileMenuMode
  openMenu: (mode?: MobileMenuMode) => void
  closeMenu: () => void
  toggleMenu: () => void
  setMode: (mode: MobileMenuMode) => void
}

export const useMobileMenuStore = create<MobileMenuState>((set) => ({
  isOpen: false,
  mode: 'dashboard',
  openMenu: (mode?: MobileMenuMode) => set({ isOpen: true, mode: mode || 'dashboard' }),
  closeMenu: () => set({ isOpen: false }),
  toggleMenu: () => set((state) => ({ isOpen: !state.isOpen })),
  setMode: (mode: MobileMenuMode) => set({ mode }),
}))
