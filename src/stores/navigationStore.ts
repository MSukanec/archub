import { create } from 'zustand'

type SidebarContext = 'organization' | 'project' | 'design' | 'construction' | 'finances' | 'commercialization' | 'postsale' | 'organizations' | 'admin'

interface NavigationState {
  currentSidebarContext: SidebarContext
  setSidebarContext: (context: SidebarContext) => void
  // Nueva funcionalidad para columna lateral
  activeSidebarSection: string | null
  setActiveSidebarSection: (section: string | null) => void
  // Project management
  setCurrentProject: (project: any) => void
}

export const useNavigationStore = create<NavigationState>((set) => ({
  currentSidebarContext: 'organization',
  setSidebarContext: (context: SidebarContext) => set({ currentSidebarContext: context }),
  // Estado para la columna lateral derecha - default to organization summary
  activeSidebarSection: 'organizacion',
  setActiveSidebarSection: (section: string | null) => set({ activeSidebarSection: section }),
  // Project management
  setCurrentProject: (project: any) => {
    // Implementation for setting current project
    console.log('Setting current project:', project)
  },
}))