import { create } from 'zustand'

type SidebarContext = 'organization' | 'project' | 'design' | 'construction' | 'finances' | 'commercialization' | 'postsale' | 'organizations' | 'admin'

interface NavigationState {
  currentSidebarContext: SidebarContext
  setSidebarContext: (context: SidebarContext) => void
  // Nueva funcionalidad para columna lateral
  activeSidebarSection: string | null
  setActiveSidebarSection: (section: string | null) => void
}

export const useNavigationStore = create<NavigationState>((set) => ({
  currentSidebarContext: 'organization',
  setSidebarContext: (context: SidebarContext) => set({ currentSidebarContext: context }),
  // Estado para la columna lateral derecha - default to organization summary
  activeSidebarSection: '/organization/dashboard',
  setActiveSidebarSection: (section: string | null) => set({ activeSidebarSection: section }),
}))