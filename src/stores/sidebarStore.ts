import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SidebarState {
  isDocked: boolean
  isHovered: boolean
  setDocked: (docked: boolean) => void
  setHovered: (hovered: boolean) => void
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isDocked: false,
      isHovered: false,
      setDocked: (docked: boolean) => set({ isDocked: docked }),
      setHovered: (hovered: boolean) => set({ isHovered: hovered }),
    }),
    {
      name: 'sidebar-store',
      partialize: (state) => ({ isDocked: state.isDocked }),
    }
  )
)