import { create } from 'zustand'

type SidebarContext = 'organization' | 'project' | 'design' | 'construction' | 'finances' | 'commercialization' | 'postsale' | 'organizations' | 'admin' | 'recursos' | 'perfil' | 'learning'

// Nuevo tipo para los niveles del sidebar
type SidebarLevel = 'general' | 'organization' | 'project' | 'construction' | 'finances' | 'library' | 'provider' | 'admin' | 'community' | 'learning' | 'user'

interface NavigationState {
  currentSidebarContext: SidebarContext
  setSidebarContext: (context: SidebarContext) => void
  // Nueva funcionalidad para columna lateral
  activeSidebarSection: string | null
  setActiveSidebarSection: (section: string | null) => void
  // Project management
  setCurrentProject: (project: any) => void
  // Nuevo estado para los niveles del sidebar
  sidebarLevel: SidebarLevel
  setSidebarLevel: (level: SidebarLevel) => void
  // Función para volver al nivel principal
  goToMainLevel: () => void
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
  // Estados para los niveles del sidebar
  sidebarLevel: 'general',
  setSidebarLevel: (level: SidebarLevel) => set({ sidebarLevel: level }),
  goToMainLevel: () => set({ sidebarLevel: 'general' }),
}))