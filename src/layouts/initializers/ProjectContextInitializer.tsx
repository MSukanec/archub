import { useEffect, useRef } from 'react'
import { useCurrentUser, useHeartbeat } from '@/features/users/hooks'
import { useUserOrganizationPreferences } from '@/features/organization'
import { useProjectContext } from '@/stores/projectContext'
import { useAppBootStore } from '@/stores/appBootStore'
import { updateProjectLastActive } from '@/features/projects'

/**
 * Componente que inicializa automáticamente el proyecto correcto
 * cuando cambia la organización actual usando la nueva tabla
 * user_organization_preferences.
 * Espera a que signup_completed sea true antes de inicializar.
 */
export function ProjectContextInitializer() {
  const { data: userData } = useCurrentUser()
  const { currentOrganizationId, selectedProjectId, setSelectedProject } = useProjectContext()
  const { signupCompleted } = useAppBootStore()
  
  // Enviar heartbeat periódico para tracking de presencia (solo si signup completado)
  useHeartbeat(signupCompleted === true ? currentOrganizationId : undefined)
  
  // Obtener las preferencias de la organización actual
  const userId = userData?.user?.id;
  const { data: orgPreferences } = useUserOrganizationPreferences(userId, currentOrganizationId || undefined)
  
  // Track if we've already initialized for this organization to prevent auto-loading after explicit organization selection
  const initializedForOrg = useRef<string | null>(null)

  useEffect(() => {
    // Si tenemos organización y preferencias, pero no proyecto seleccionado
    if (currentOrganizationId && orgPreferences && !selectedProjectId) {
      const lastProjectId = orgPreferences.last_project_id
      
      // Solo cargar automáticamente el último proyecto si no hemos inicializado esta organización antes
      // Esto previene la recarga automática cuando el usuario explícitamente selecciona la vista de organización
      if (lastProjectId && initializedForOrg.current !== currentOrganizationId) {
        setSelectedProject(lastProjectId, currentOrganizationId)
        // Update last_active_at when auto-loading project (fire and forget)
        updateProjectLastActive(lastProjectId, currentOrganizationId).catch(err => 
          console.error('Error updating project last_active_at:', err)
        );
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