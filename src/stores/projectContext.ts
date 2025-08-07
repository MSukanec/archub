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
          // Obtener user_id de current-user endpoint con token de autorización
          import('@/lib/supabase').then(({ supabase }) => {
            return supabase.auth.getSession();
          }).then(({ data: sessionData }) => {
            const token = sessionData?.session?.access_token;
            if (token) {
              console.log("Attempting to fetch current user data...");
              return fetch('/api/current-user', {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
              });
            } else {
              throw new Error('No authentication token available');
            }
          }).then(response => response.json())
          .then(userData => {
            if (userData?.user?.id) {
              // Usar la API para persistir en user_organization_preferences
              fetch('/api/user/update-organization-preferences', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-user-id': userData.user.id  // Usar el ID de la aplicación, no el de Supabase Auth
                },
                body: JSON.stringify({
                  organization_id: currentOrgId,
                  last_project_id: projectId
                })
              }).catch(error => {
                console.error("🔧 Error updating organization preferences:", error);
              });
            }
          }).catch(error => {
            console.error("🔧 Error fetching current user:", error);
          });
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