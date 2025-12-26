/**
 * Centralized Query Keys for Capital Feature
 * 
 * ARQUITECTURA ENTERPRISE DE CACHE
 * ================================
 * 
 * Una entidad = una familia única y centralizada de query keys
 * Las mutaciones actualizan el cache directamente, no dependen de invalidaciones sueltas
 * 
 * REGLAS ESTRICTAS:
 * 1. TODAS las queries de capital DEBEN usar estas keys
 * 2. PROHIBIDO crear query keys inline en componentes
 * 3. PROHIBIDO keys paralelas como ['unified-movements'], etc.
 * 4. Las mutaciones DEBEN usar queryClient.setQueryData() para actualizar cache
 * 5. Cero invalidaciones masivas
 * 
 * @example
 * // En queries:
 * useQuery({ queryKey: capitalKeys.participants(organizationId) })
 * useQuery({ queryKey: capitalKeys.contributions(organizationId) })
 * 
 * @example
 * // En mutaciones:
 * onSuccess(updatedData) {
 *   queryClient.setQueryData(capitalKeys.participants(orgId), (old) => 
 *     old?.map(p => p.id === partnerId ? updatedData : p)
 *   )
 * }
 */

type NullableId = string | null | undefined;

export const capitalKeys = {
  all: ['capital'] as const,

  // Participants
  participants: () => [...capitalKeys.all, 'participants'] as const,
  participantsList: (organizationId: NullableId) =>
    [...capitalKeys.participants(), organizationId ?? undefined] as const,
  partner: (partnerId: NullableId) =>
    [...capitalKeys.participants(), partnerId ?? undefined] as const,
  contactsForPartner: (organizationId: NullableId) =>
    [...capitalKeys.all, 'contacts-for-partner', organizationId ?? undefined] as const,
  partnerContactIds: (organizationId: NullableId) =>
    [...capitalKeys.all, 'partner-contact-ids', organizationId ?? undefined] as const,

  // Contributions
  contributions: () => [...capitalKeys.all, 'contributions'] as const,
  contributionsList: (organizationId: NullableId, projectId?: NullableId) =>
    [...capitalKeys.contributions(), organizationId ?? undefined, projectId ?? undefined] as const,
  contribution: (contributionId: NullableId) =>
    [...capitalKeys.contributions(), contributionId ?? undefined] as const,

  // Withdrawals
  withdrawals: () => [...capitalKeys.all, 'withdrawals'] as const,
  withdrawalsList: (organizationId: NullableId, projectId?: NullableId) =>
    [...capitalKeys.withdrawals(), organizationId ?? undefined, projectId ?? undefined] as const,
  withdrawal: (withdrawalId: NullableId) =>
    [...capitalKeys.withdrawals(), withdrawalId ?? undefined] as const,

  // Unified movements (for dashboard)
  unifiedMovements: () => [...capitalKeys.all, 'unified-movements'] as const,
  partnerMovements: (organizationId?: NullableId, projectId?: NullableId) =>
    [...capitalKeys.all, 'partner-movements', organizationId ?? undefined, projectId ?? undefined]
      .filter(Boolean) as const,
} as const;

export type CapitalQueryKey = readonly (string | undefined)[];
