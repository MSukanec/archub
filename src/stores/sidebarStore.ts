import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type SidebarContext = 'master' | 'organization' | 'project' | 'design' | 'construction' | 'finance' | 'marketing' | 'admin' | 'organization-dashboard' | 'project-dashboard'

interface SidebarState {
  isDocked: boolean
  isHovered: boolean
  isExpanded: boolean
  currentContext: SidebarContext
  setDocked: (docked: boolean) => void
  setHovered: (hovered: boolean) => void
  toggleSidebar: () => void
  setSidebarContext: (context: SidebarContext) => void
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set, get) => ({
      isDocked: false,
      isHovered: false,
      isExpanded: false,
      currentContext: 'master',
      setDocked: (docked: boolean) => set({ isDocked: docked }),
      setHovered: (hovered: boolean) => set({ isHovered: hovered }),
      toggleSidebar: () => set((state) => ({ isExpanded: !state.isExpanded })),
      setSidebarContext: (context: SidebarContext) => set({ currentContext: context }),
    }),
    {
      name: 'sidebar-store',
      partialize: (state) => ({ isDocked: state.isDocked, isExpanded: state.isExpanded, currentContext: state.currentContext }),
    }
  )
)