import { create } from 'zustand'

export type MobileMenuMode = 'dashboard' | 'marketing'

interface MobileMenuState {
  isOpen: boolean
  mode: MobileMenuMode
  openMenu: (mode?: MobileMenuMode) => void
  closeMenu: () => void
  toggleMenu: (mode?: MobileMenuMode) => void
  setMode: (mode: MobileMenuMode) => void
}

export const useMobileMenuStore = create<MobileMenuState>((set) => ({
  isOpen: false,
  mode: 'dashboard',
  openMenu: (mode?: MobileMenuMode) => set({ isOpen: true, mode: mode || 'dashboard' }),
  closeMenu: () => set({ isOpen: false, mode: 'dashboard' }),
  toggleMenu: (mode?: MobileMenuMode) => set((state) => ({
    isOpen: !state.isOpen,
    mode: state.isOpen ? 'dashboard' : (mode || 'dashboard')
  })),
  setMode: (mode: MobileMenuMode) => set({ mode }),
}))
