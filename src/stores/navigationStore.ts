import { create } from 'zustand'

type SidebarContext = 'organization' | 'project' | 'design' | 'construction' | 'commercialization'

interface NavigationState {
  currentSidebarContext: SidebarContext
  setSidebarContext: (context: SidebarContext) => void
}

export const useNavigationStore = create<NavigationState>((set) => ({
  currentSidebarContext: 'organization',
  setSidebarContext: (context: SidebarContext) => set({ currentSidebarContext: context }),
}))