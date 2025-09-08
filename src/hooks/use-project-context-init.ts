import { useEffect } from 'react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useProjectContext } from '@/stores/projectContext';

/**
 * Hook que inicializa el contexto de proyecto cuando cambia la organización del usuario
 */
export function useProjectContextInit() {
  const { data: userData } = useCurrentUser();
  const { setCurrentOrganization, currentOrganizationId } = useProjectContext();

  useEffect(() => {
    const userOrganizationId = userData?.organization?.id;
    
    // Si cambia la organización del usuario y es diferente a la actual en el contexto
    if (userOrganizationId && userOrganizationId !== currentOrganizationId) {
      console.log("🔧 ProjectContextInit: Initializing organization context", userOrganizationId);
      try {
        setCurrentOrganization(userOrganizationId);
        console.log("🔧 ProjectContextInit: Successfully set organization");
      } catch (error) {
        console.error("🔧 ProjectContextInit: Error setting organization:", error);
      }
    }
  }, [userData?.organization?.id, currentOrganizationId, setCurrentOrganization]);
}