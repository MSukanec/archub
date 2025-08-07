import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useAuthStore } from './authStore'

interface ProjectContextState {
  selectedProjectId: string | null
  isGlobalView: boolean
  currentOrganizationId: string | null
  setSelectedProject: (projectId: string | null, organizationId?: string | null) => void
  setCurrentOrganization: (organizationId: string | null) => void
}

export const useProjectContext = create<ProjectContextState>()(
  persist(
    (set, get) => ({
      selectedProjectId: null,
      isGlobalView: true,
      currentOrganizationId: null,
      setSelectedProject: (projectId: string | null, organizationId?: string | null) => {
        console.log("🔧 ProjectContext: Setting project to", projectId, "for organization", organizationId);
        
        const currentOrgId = organizationId || get().currentOrganizationId;
        
        // Si cambiamos de proyecto, persistir en user_preferences.last_project_id
        if (projectId) {
          const user = useAuthStore.getState().user;
          if (user) {
            // Usar el endpoint simple que actualiza user_preferences
            fetch('/api/user/select-project', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-user-id': user.id
              },
              body: JSON.stringify({
                project_id: projectId
              })
            }).catch(error => {
              console.error("🔧 Error updating project selection:", error);
            });
          }
        }
        
        set({ 
          selectedProjectId: projectId,
          isGlobalView: projectId === null,
          currentOrganizationId: currentOrgId
        });
      },
      setCurrentOrganization: (organizationId: string | null) => {
        console.log("🔧 ProjectContext: Setting organization to", organizationId);
        
        // Al cambiar organización, setear inmediatamente la organización
        // El proyecto se cargará automáticamente via React Query en los componentes
        set({ 
          currentOrganizationId: organizationId,
          selectedProjectId: null,  // Reseteamos el proyecto temporalmente
          isGlobalView: true
        });
      },
    }),
    {
      name: 'project-context-storage',
      partialize: (state) => ({ 
        selectedProjectId: state.selectedProjectId,
        isGlobalView: state.isGlobalView,
        currentOrganizationId: state.currentOrganizationId
      }),
    }
  )
)