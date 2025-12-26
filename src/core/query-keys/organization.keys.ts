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
  // INFORMACIÓN BASE DE ORGANIZACIÓN (organizations table)
  // ═══════════════════════════════════════════════════════════════
  
  /** Base para info */
  infoBase: () => [...organizationKeys.all, 'info'] as const,
  
  /** Info de organización (de tabla organizations) */
  info: (organizationId: NullableId) => 
    [...organizationKeys.infoBase(), organizationId ?? undefined] as const,

  // ═══════════════════════════════════════════════════════════════
  // DATOS EXTENDIDOS DE ORGANIZACIÓN (organization_data table)
  // ═══════════════════════════════════════════════════════════════
  
  /** Base para data */
  dataBase: () => [...organizationKeys.all, 'data'] as const,
  
  /** Datos extendidos de organización (de tabla organization_data) */
  data: (organizationId: NullableId) => 
    [...organizationKeys.dataBase(), organizationId ?? undefined] as const,

  // ═══════════════════════════════════════════════════════════════
  // MIEMBROS
  // ═══════════════════════════════════════════════════════════════
  
  /** Base para miembros */
  membersBase: () => [...organizationKeys.all, 'members'] as const,
  
  /** Lista de miembros por organización */
  members: (organizationId: NullableId) => 
    [...organizationKeys.membersBase(), organizationId ?? undefined] as const,

  // ═══════════════════════════════════════════════════════════════
  // INVITATIONS
  // ═══════════════════════════════════════════════════════════════
  
  /** Base para invitaciones */
  invitationsBase: () => [...organizationKeys.all, 'invitations'] as const,
  
  /** Invitaciones pendientes por organización */
  invitations: (organizationId: NullableId) => 
    [...organizationKeys.invitationsBase(), organizationId ?? undefined] as const,

  // ═══════════════════════════════════════════════════════════════
  // FORMER MEMBERS
  // ═══════════════════════════════════════════════════════════════
  
  /** Base para ex miembros */
  formerMembersBase: () => [...organizationKeys.all, 'former-members'] as const,
  
  /** Ex miembros por organización */
  formerMembers: (organizationId: NullableId) => 
    [...organizationKeys.formerMembersBase(), organizationId ?? undefined] as const,

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

  // ═══════════════════════════════════════════════════════════════
  // CURRENCIES
  // ═══════════════════════════════════════════════════════════════
  
  /** Base para monedas */
  currenciesBase: () => [...organizationKeys.all, 'currencies'] as const,
  
  /** Monedas por organización */
  currencies: (organizationId: NullableId) => 
    [...organizationKeys.currenciesBase(), organizationId ?? undefined] as const,
  
  /** Moneda por defecto por organización */
  defaultCurrency: (organizationId: NullableId) => 
    [...organizationKeys.currenciesBase(), 'default', organizationId ?? undefined] as const,

  // ═══════════════════════════════════════════════════════════════
  // ROLES & PERMISSIONS
  // ═══════════════════════════════════════════════════════════════
  
  /** Base para roles y permisos */
  rolesPermissionsBase: () => [...organizationKeys.all, 'roles-permissions'] as const,
  
  /** Roles y permisos por organización */
  rolesPermissions: (organizationId: NullableId) => 
    [...organizationKeys.rolesPermissionsBase(), organizationId ?? undefined] as const,

  // ═══════════════════════════════════════════════════════════════
  // SUBSCRIPTIONS
  // ═══════════════════════════════════════════════════════════════
  
  /** Base para suscripciones */
  subscriptionBase: () => [...organizationKeys.all, 'subscription'] as const,
  
  /** Suscripción actual por organización */
  subscription: (organizationId: NullableId) => 
    [...organizationKeys.subscriptionBase(), organizationId ?? undefined] as const,

  // ═══════════════════════════════════════════════════════════════
  // PAYMENTS
  // ═══════════════════════════════════════════════════════════════
  
  /** Base para pagos */
  paymentsBase: () => [...organizationKeys.all, 'payments'] as const,
  
  /** Pagos por organización */
  payments: (organizationId: NullableId) => 
    [...organizationKeys.paymentsBase(), organizationId ?? undefined] as const,

  // ═══════════════════════════════════════════════════════════════
  // BILLING
  // ═══════════════════════════════════════════════════════════════
  
  /** Base para facturación */
  billingBase: () => [...organizationKeys.all, 'billing'] as const,
  
  /** Próxima factura por organización */
  nextInvoice: (organizationId: NullableId) => 
    [...organizationKeys.billingBase(), 'next-invoice', organizationId ?? undefined] as const,
  
  /** Ciclos de facturación por organización */
  billingCycles: (organizationId: NullableId) => 
    [...organizationKeys.billingBase(), 'cycles', organizationId ?? undefined] as const,
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
