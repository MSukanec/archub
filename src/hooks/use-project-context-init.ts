import { useEffect, useRef } from 'react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useProjectContext } from '@/stores/projectContext';

/**
 * Hook que inicializa el contexto de proyecto cuando cambia la organización del usuario
 * Diseñado para ser idempotente y evitar múltiples ejecuciones
 */
export function useProjectContextInit() {
  const { data: userData } = useCurrentUser();
  const { setCurrentOrganization } = useProjectContext();
  const lastInitializedOrgRef = useRef<string | null>(null);

  useEffect(() => {
    const userOrganizationId = userData?.organization?.id;
    
    // Solo proceder si hay una organización del usuario
    if (!userOrganizationId) return;
    
    // Evitar inicialización repetida de la misma organización
    if (lastInitializedOrgRef.current === userOrganizationId) return;
    
    // Leer el valor actual del store para comparar
    const currentStoreOrgId = useProjectContext.getState().currentOrganizationId;
    
    // Solo establecer si es diferente al valor actual del store
    if (userOrganizationId !== currentStoreOrgId) {
      try {
        setCurrentOrganization(userOrganizationId);
        lastInitializedOrgRef.current = userOrganizationId;
      } catch (error) {
      }
    } else {
      // Actualizar ref aún si no se establece, para evitar checks repetidos
      lastInitializedOrgRef.current = userOrganizationId;
    }
  }, [userData?.organization?.id, setCurrentOrganization]);
}