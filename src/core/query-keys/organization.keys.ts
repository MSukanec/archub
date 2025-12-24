/**
 * Centralized Query Keys for Organization Feature
 * 
 * ARQUITECTURA ENTERPRISE DE CACHE
 * ================================
 * 
 * Una entidad = una familia única y centralizada de query keys
 * Las mutaciones actualizan el cache directamente, no dependen de invalidaciones sueltas
 * 
 * REGLAS ESTRICTAS:
 * 1. TODAS las queries de organization DEBEN usar estas keys
 * 2. PROHIBIDO crear query keys inline en componentes
 * 3. PROHIBIDO keys paralelas
 * 4. Las mutaciones DEBEN usar queryClient.setQueryData() para actualizar cache
 * 5. Cero invalidaciones masivas
 * 
 * @example
 * // En queries:
 * useQuery({ queryKey: organizationKeys.members(organizationId) })
 * useQuery({ queryKey: organizationKeys.stats(organizationId) })
 * 
 * @example
 * // En mutaciones:
 * onSuccess(updatedMember) {
 *   queryClient.setQueryData(organizationKeys.members(orgId), (old) => 
 *     old?.map(m => m.id === memberId ? updatedMember : m)
 *   )
 * }
 */

/** Type alias para IDs que pueden ser null o undefined */
type NullableId = string | null | undefined;

export const organizationKeys = {
  /** Base key para todos los datos de organization */
  all: ['organization'] as const,

  // ═══════════════════════════════════════════════════════════════
  // MIEMBROS
  // ═══════════════════════════════════════════════════════════════
  
  /** Base para miembros */
  membersBase: () => [...organizationKeys.all, 'members'] as const,
  
  /** Lista de miembros por organización */
  members: (organizationId: NullableId) => 
    [...organizationKeys.membersBase(), organizationId ?? undefined] as const,

  // ═══════════════════════════════════════════════════════════════
  // ESTADÍSTICAS
  // ═══════════════════════════════════════════════════════════════
  
  /** Base para estadísticas */
  statsBase: () => [...organizationKeys.all, 'stats'] as const,
  
  /** Estadísticas por organización */
  stats: (organizationId: NullableId) => 
    [...organizationKeys.statsBase(), organizationId ?? undefined] as const,

  // ═══════════════════════════════════════════════════════════════
  // ACTIVIDAD
  // ═══════════════════════════════════════════════════════════════
  
  /** Base para actividad */
  activityBase: () => [...organizationKeys.all, 'activity'] as const,
  
  /** Actividad por organización */
  activity: (organizationId: NullableId) => 
    [...organizationKeys.activityBase(), organizationId ?? undefined] as const,

  // ═══════════════════════════════════════════════════════════════
  // ACTIVITY LOGS
  // ═══════════════════════════════════════════════════════════════
  
  /** Base para logs de actividad */
  activityLogsBase: () => [...organizationKeys.all, 'activity-logs'] as const,
  
  /** Logs de actividad por organización */
  activityLogs: (organizationId: NullableId) => 
    [...organizationKeys.activityLogsBase(), organizationId ?? undefined] as const,

  // ═══════════════════════════════════════════════════════════════
  // WALLETS
  // ═══════════════════════════════════════════════════════════════
  
  /** Base para wallets */
  walletsBase: () => [...organizationKeys.all, 'wallets'] as const,
  
  /** Wallets por organización */
  wallets: (organizationId: NullableId) => 
    [...organizationKeys.walletsBase(), organizationId ?? undefined] as const,
} as const;

export const userOrgPreferencesKeys = {
  /** Base key para preferencias de usuario-organización */
  all: ['user-organization-preferences'] as const,

  // ═══════════════════════════════════════════════════════════════
  // DETALLES
  // ═══════════════════════════════════════════════════════════════
  
  /** Base para detalles */
  details: () => [...userOrgPreferencesKeys.all, 'detail'] as const,
  
  /** Preferencias de usuario por organización */
  detail: (userId: NullableId, organizationId: NullableId) => 
    [...userOrgPreferencesKeys.details(), userId ?? undefined, organizationId ?? undefined] as const,
} as const;

/** Tipo de las query keys de organization */
export type OrganizationQueryKey = readonly (string | undefined)[];
export type UserOrgPreferencesQueryKey = readonly (string | undefined)[];
