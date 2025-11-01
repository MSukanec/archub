import { useEffect, useRef } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useUserOrganizationPreferences } from '@/hooks/use-user-organization-preferences'
import { useProjectContext } from '@/stores/projectContext'
import { useHeartbeat } from '@/hooks/use-heartbeat'

/**
 * Componente que inicializa automáticamente el proyecto correcto
 * cuando cambia la organización actual usando la nueva tabla
 * user_organization_preferences
 */
export function ProjectContextInitializer() {
  const { data: userData } = useCurrentUser()
  const { currentOrganizationId, selectedProjectId, setSelectedProject } = useProjectContext()
  
  // Enviar heartbeat periódico para tracking de presencia
  useHeartbeat(currentOrganizationId)
  
  // Obtener las preferencias de la organización actual
  const { data: orgPreferences } = useUserOrganizationPreferences(currentOrganizationId || undefined)
  
  // Track if we've already initialized for this organization to prevent auto-loading after explicit organization selection
  const initializedForOrg = useRef<string | null>(null)

  useEffect(() => {
    console.log("🔧 ProjectContextInit: Initializing organization context", currentOrganizationId);
    
    // Si tenemos organización y preferencias, pero no proyecto seleccionado
    if (currentOrganizationId && orgPreferences && !selectedProjectId) {
      const lastProjectId = orgPreferences.last_project_id
      
      // Solo cargar automáticamente el último proyecto si no hemos inicializado esta organización antes
      // Esto previene la recarga automática cuando el usuario explícitamente selecciona la vista de organización
      if (lastProjectId && initializedForOrg.current !== currentOrganizationId) {
        console.log("🔧 ProjectContextInit: Loading last project for organization", currentOrganizationId, "->", lastProjectId);
        setSelectedProject(lastProjectId, currentOrganizationId)
        initializedForOrg.current = currentOrganizationId
      } else if (!lastProjectId) {
        // Si no hay último proyecto, marcar como inicializado para esta organización
        initializedForOrg.current = currentOrganizationId
      }
    }
  }, [currentOrganizationId, orgPreferences, selectedProjectId, setSelectedProject])

  // Reset cuando cambia la organización
  useEffect(() => {
    if (currentOrganizationId !== initializedForOrg.current) {
      initializedForOrg.current = null
    }
  }, [currentOrganizationId])

  // Este componente no renderiza nada, solo maneja la lógica de inicialización
  return null
}