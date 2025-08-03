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
        
        // Si cambiamos de organización, persistir el proyecto en las preferencias
        if (currentOrgId && projectId) {
          // Obtener user_id del authStore
          const user = useAuthStore.getState().user;
          if (user) {
            // Usar la API para persistir en user_organization_preferences
            fetch('/api/user/update-organization-preferences', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-user-id': user.id
              },
              body: JSON.stringify({
                organization_id: currentOrgId,
                last_project_id: projectId
              })
            }).catch(error => {
              console.error("🔧 Error updating organization preferences:", error);
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
        
        // Al cambiar organización, cargar el último proyecto de esa organización
        if (organizationId) {
          // Obtener user_id del authStore
          const user = useAuthStore.getState().user;
          if (user) {
            fetch(`/api/user/organization-preferences/${organizationId}`, {
              headers: {
                'x-user-id': user.id
              }
            })
              .then(response => response.json())
              .then(data => {
                const lastProjectId = data?.last_project_id || null;
                console.log("🔧 ProjectContext: Loading last project for organization", organizationId, "->", lastProjectId);
                set({ 
                  selectedProjectId: lastProjectId,
                  isGlobalView: lastProjectId === null,
                  currentOrganizationId: organizationId
                });
              })
              .catch(error => {
                console.error("🔧 Error loading organization preferences:", error);
                set({ 
                  selectedProjectId: null,
                  isGlobalView: true,
                  currentOrganizationId: organizationId
                });
              });
          } else {
            console.error("🔧 No user found in authStore for organization preferences");
            set({ 
              selectedProjectId: null,
              isGlobalView: true,
              currentOrganizationId: organizationId
            });
          }
        } else {
          set({ 
            selectedProjectId: null,
            isGlobalView: true,
            currentOrganizationId: null
          });
        }
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