import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useAuthStore } from './authStore'

interface ProjectContextState {
  selectedProjectId: string | null
  isGlobalView: boolean
  currentOrganizationId: string | null
  isViewingOrganization: boolean
  setSelectedProject: (projectId: string | null, organizationId?: string | null) => void
  setCurrentOrganization: (organizationId: string | null) => void
  setViewingOrganization: (viewing: boolean) => void
}

export const useProjectContext = create<ProjectContextState>()(
  persist(
    (set, get) => ({
      selectedProjectId: null,
      isGlobalView: true,
      currentOrganizationId: null,
      isViewingOrganization: false,
      setSelectedProject: (projectId: string | null, organizationId?: string | null) => {
        const currentOrgId = organizationId || get().currentOrganizationId;
        
        // La persistencia de preferencias se maneja en los componentes que usan useUpdateUserOrganizationPreferences
        
        set({ 
          selectedProjectId: projectId,
          isGlobalView: projectId === null,
          currentOrganizationId: currentOrgId,
          isViewingOrganization: false // Al seleccionar proyecto, salimos del modo organización
        });
      },
      setViewingOrganization: (viewing: boolean) => {
        set({ isViewingOrganization: viewing });
      },
      setCurrentOrganization: (organizationId: string | null) => {
        console.log("🔧 ProjectContext: Setting organization to", organizationId);
        
        // Al cambiar organización, setear inmediatamente la organización
        // El proyecto se cargará automáticamente via React Query en los componentes
        set({ 
          currentOrganizationId: organizationId,
          selectedProjectId: null,  // Reseteamos el proyecto temporalmente
          isGlobalView: true,
          isViewingOrganization: false
        });
      },
    }),
    {
      name: 'project-context-storage',
      partialize: (state) => ({ 
        selectedProjectId: state.selectedProjectId,
        isGlobalView: state.isGlobalView,
        currentOrganizationId: state.currentOrganizationId,
        isViewingOrganization: state.isViewingOrganization
      }),
    }
  )
)