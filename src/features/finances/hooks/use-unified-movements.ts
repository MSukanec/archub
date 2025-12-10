import { useQuery } from '@tanstack/react-query';
import { useProjectContext } from '@/stores/projectContext';
import { 
  getUnifiedMovements, 
  getUnifiedMovementsStats,
  type UnifiedMovementWithRelations 
} from '../services/getUnifiedMovements';

/**
 * Hook para obtener todos los movimientos financieros unificados.
 * Usa la vista unified_financial_movements_view de la base de datos.
 * 
 * @param organizationId - ID de la organización (opcional, usa contexto si no se provee)
 * @param projectId - ID del proyecto (opcional). null = toda la org, undefined = usa contexto
 */
export function useUnifiedMovements(
  organizationId?: string,
  projectId?: string | null
) {
  const { currentOrganizationId, selectedProjectId } = useProjectContext();
  
  const effectiveOrgId = organizationId || currentOrganizationId;
  const effectiveProjectId = projectId === null ? null : 
                             (arguments.length >= 2 ? projectId : selectedProjectId);

  return useQuery<UnifiedMovementWithRelations[]>({
    queryKey: ['unified-movements', effectiveOrgId, effectiveProjectId],
    queryFn: () => getUnifiedMovements(effectiveOrgId!, effectiveProjectId),
    enabled: !!effectiveOrgId,
  });
}

/**
 * Hook para obtener estadísticas de los movimientos unificados.
 */
export function useUnifiedMovementsStats(
  organizationId?: string,
  projectId?: string | null
) {
  const { currentOrganizationId, selectedProjectId } = useProjectContext();
  
  const effectiveOrgId = organizationId || currentOrganizationId;
  const effectiveProjectId = projectId === null ? null : 
                             (arguments.length >= 2 ? projectId : selectedProjectId);

  return useQuery({
    queryKey: ['unified-movements-stats', effectiveOrgId, effectiveProjectId],
    queryFn: () => getUnifiedMovementsStats(effectiveOrgId!, effectiveProjectId),
    enabled: !!effectiveOrgId,
  });
}
