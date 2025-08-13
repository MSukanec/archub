import { useEffect } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useUserOrganizationPreferences } from '@/hooks/use-user-organization-preferences'
import { useProjectContext } from '@/stores/projectContext'

/**
 * Componente que inicializa automáticamente el proyecto correcto
 * cuando cambia la organización actual usando la nueva tabla
 * user_organization_preferences
 */
export function ProjectContextInitializer() {
  const { data: userData } = useCurrentUser()
  const { currentOrganizationId, selectedProjectId, setSelectedProject } = useProjectContext()
  
  // Obtener las preferencias de la organización actual
  const { data: orgPreferences } = useUserOrganizationPreferences(currentOrganizationId || undefined)

  useEffect(() => {
    console.log("🔧 ProjectContextInit: Initializing organization context", currentOrganizationId);
    
    // Si tenemos organización y preferencias, pero no proyecto seleccionado
    if (currentOrganizationId && orgPreferences && !selectedProjectId) {
      const lastProjectId = orgPreferences.last_project_id
      
      if (lastProjectId) {
        console.log("🔧 ProjectContextInit: Loading last project for organization", currentOrganizationId, "->", lastProjectId);
        setSelectedProject(lastProjectId, currentOrganizationId)
      }
    }
  }, [currentOrganizationId, orgPreferences, selectedProjectId, setSelectedProject])

  // Este componente no renderiza nada, solo maneja la lógica de inicialización
  return null
}