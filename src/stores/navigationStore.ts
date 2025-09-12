import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type SidebarContext = 'organization' | 'project' | 'design' | 'construction' | 'finances' | 'commercialization' | 'postsale' | 'organizations' | 'admin' | 'recursos' | 'perfil'

// Nuevo tipo para los niveles del sidebar
type SidebarLevel = 'main' | 'organization' | 'project' | 'construction' | 'finances' | 'library' | 'provider' | 'admin'

// Nuevo tipo para los modos del sidebar
type SidebarMode = 'organization' | 'project'

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
  // Nuevo estado para el modo del sidebar (organización vs proyecto)
  sidebarMode: SidebarMode
  setSidebarMode: (mode: SidebarMode) => void
  // Persistencia de rutas por modo
  lastOrganizationRoute: string
  lastProjectRoute: string
  setLastOrganizationRoute: (route: string) => void
  setLastProjectRoute: (route: string) => void
  // Funciones de navegación entre estados
  goToOrganizationMode: () => void
  goToProjectMode: () => void
}

export const useNavigationStore = create<NavigationState>()(
  persist(
    (set, get) => ({
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
      setSidebarLevel: (level: SidebarLevel) => set({ sidebarLevel: level }),
      goToMainLevel: () => set({ sidebarLevel: 'main' }),
      // Estados del modo del sidebar
      sidebarMode: 'organization',
      setSidebarMode: (mode: SidebarMode) => set({ sidebarMode: mode }),
      // Persistencia de rutas
      lastOrganizationRoute: '/organization/dashboard',
      lastProjectRoute: '/finances/dashboard',
      setLastOrganizationRoute: (route: string) => set({ lastOrganizationRoute: route }),
      setLastProjectRoute: (route: string) => set({ lastProjectRoute: route }),
      // Funciones de navegación
      goToOrganizationMode: () => {
        const state = get()
        set({ sidebarMode: 'organization' })
        // Navegar a la última ruta de organización
        if (typeof window !== 'undefined') {
          window.history.pushState({}, '', state.lastOrganizationRoute)
        }
      },
      goToProjectMode: () => {
        const state = get()
        set({ sidebarMode: 'project' })
        // Navegar a la última ruta de proyecto
        if (typeof window !== 'undefined') {
          window.history.pushState({}, '', state.lastProjectRoute)
        }
      },
    }),
    {
      name: 'navigation-store',
      partialize: (state) => ({
        sidebarMode: state.sidebarMode,
        lastOrganizationRoute: state.lastOrganizationRoute,
        lastProjectRoute: state.lastProjectRoute,
      }),
    }
  )
)