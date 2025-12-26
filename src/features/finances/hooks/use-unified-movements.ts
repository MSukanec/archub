import { useQuery } from '@tanstack/react-query';
import { useProjectContext } from '@/stores/projectContext';
  getUnifiedMovements, 
  getUnifiedMovementsStats,
  type UnifiedMovementWithRelations 
} from '../services/getUnifiedMovements';
interface UseUnifiedMovementsOptions {
  enabled?: boolean;
}
/**
 * Scope object para distinguir contextos estrictamente.
 * - org: consulta todos los movimientos de la organización
 * - project: consulta solo los movimientos de un proyecto específico
 * - pending: estado de espera (hydration pendiente), no ejecutar query
 */
type MovementScope = 
  | { type: 'org'}
  | { type: 'project'; projectId: string }
  | { type: 'pending'};
/**
 * Normaliza el projectId a un objeto de scope explícito.
 * - null explícito = scope org
 * - string no vacío = scope proyecto
 * - undefined o vacío = pending (esperando hydration)
 */
function normalizeScope(projectId: string | null | undefined): MovementScope {
  if (projectId === null) {
    return { type: 'org'};
  }
  if (typeof projectId === 'string'&& projectId.length > 0) {
    return { type: 'project', projectId };
  }
  return { type: 'pending'};
}
/**
 * Genera un query key basado en el scope normalizado.
 * Garantiza aislamiento de cache completo entre contextos.
 */
function getQueryKey(base: string, orgId: string | null | undefined, scope: MovementScope): unknown[] {
  switch (scope.type) {
    case 'org':
      return [base, orgId, 'scope:org'];
    case 'project':
      return [base, orgId, 'scope:project', scope.projectId];
    case 'pending':
      return [base, orgId, 'scope:pending'];
  }
}
/**
 * Hook para obtener todos los movimientos financieros unificados.
 * Usa la vista unified_financial_movements_view de la base de datos.
 * 
 * Comportamiento del projectId:
 * - null: obtiene todos los movimientos de la organización
 * - string: obtiene solo los movimientos del proyecto especificado
 * - undefined: usa el selectedProjectId del contexto (comportamiento legacy)
 * 
 * @param organizationId - ID de la organización (opcional, usa contexto si no se provee)
 * @param projectId - ID del proyecto. null = org, string = proyecto, undefined = usa contexto
 * @param options - Opciones adicionales (enabled para controlar si se ejecuta la query)
 */
export function useUnifiedMovements(
  organizationId?: string,
  projectId?: string | null,
  options?: UseUnifiedMovementsOptions
) {
  const { currentOrganizationId, selectedProjectId } = useProjectContext();
  
  const effectiveOrgId = organizationId || currentOrganizationId;
  
  // Determinar el projectId efectivo:
  // - Si se pasó explícitamente (null o string), usarlo
  // - Si no se pasó (undefined y arguments.length < 2), usar contexto como fallback
  const hasExplicitProjectId = arguments.length >= 2;
  const effectiveProjectId = hasExplicitProjectId ? projectId : selectedProjectId;
  
  // Normalizar a scope object
  const scope = normalizeScope(effectiveProjectId);
  
  // No ejecutar query si scope es pending (esperando hydration)
  const isPending = scope.type === 'pending';
  return useQuery<UnifiedMovementWithRelations[]>({
    queryKey: getQueryKey('unified-movements', effectiveOrgId, scope),
    queryFn: () => getUnifiedMovements(
      effectiveOrgId!, 
      scope.type === 'project'? scope.projectId : null
    ),
    enabled: !!effectiveOrgId && !isPending && (options?.enabled !== false),
  });
}
/**
 * Hook para obtener estadísticas de los movimientos unificados.
 * 
 * @param organizationId - ID de la organización (opcional, usa contexto si no se provee)
 * @param projectId - ID del proyecto. null = org, string = proyecto, undefined = usa contexto
 * @param options - Opciones adicionales (enabled para controlar si se ejecuta la query)
 */
export function useUnifiedMovementsStats(
  organizationId?: string,
  projectId?: string | null,
  options?: UseUnifiedMovementsOptions
) {
  const { currentOrganizationId, selectedProjectId } = useProjectContext();
  
  const effectiveOrgId = organizationId || currentOrganizationId;
  
  // Determinar el projectId efectivo con fallback al contexto
  const hasExplicitProjectId = arguments.length >= 2;
  const effectiveProjectId = hasExplicitProjectId ? projectId : selectedProjectId;
  
  // Normalizar a scope object
  const scope = normalizeScope(effectiveProjectId);
  
  // No ejecutar query si scope es pending
  const isPending = scope.type === 'pending';
  return useQuery({
    queryKey: getQueryKey('unified-movements-stats', effectiveOrgId, scope),
    queryFn: () => getUnifiedMovementsStats(
      effectiveOrgId!, 
      scope.type === 'project'? scope.projectId : null
    ),
    enabled: !!effectiveOrgId && !isPending && (options?.enabled !== false),
  });
}
