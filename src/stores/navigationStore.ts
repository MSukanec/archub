import { create } from 'zustand'

type SidebarContext = 'organization' | 'project' | 'design' | 'construction' | 'finances' | 'commercialization' | 'postsale' | 'organizations' | 'admin' | 'recursos' | 'perfil'

// Nuevo tipo para los niveles del sidebar
type SidebarLevel = 'main' | 'organization' | 'project' | 'provider' | 'admin' | 'construction' | 'finances' | 'design'

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
  // Función para volver al nivel anterior
  goToPreviousLevel: () => void
  // Historial de niveles para navegación
  levelHistory: SidebarLevel[]
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
  sidebarLevel: 'main',
  levelHistory: [],
  setSidebarLevel: (level: SidebarLevel) => set((state) => ({ 
    sidebarLevel: level,
    levelHistory: [...state.levelHistory, state.sidebarLevel]
  })),
  goToMainLevel: () => set({ sidebarLevel: 'main', levelHistory: [] }),
  goToPreviousLevel: () => set((state) => {
    const previousLevel = state.levelHistory[state.levelHistory.length - 1] || 'main';
    return {
      sidebarLevel: previousLevel,
      levelHistory: state.levelHistory.slice(0, -1)
    };
  }),
}))