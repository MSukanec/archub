/**
 * Centralized Query Keys for Finances Feature
 * 
 * ARQUITECTURA ENTERPRISE DE CACHE
 * ================================
 * 
 * Una entidad = una familia única y centralizada de query keys
 * Las mutaciones actualizan el cache directamente, no dependen de invalidaciones sueltas
 * 
 * REGLAS ESTRICTAS:
 * 1. TODAS las queries de finanzas DEBEN usar estas keys
 * 2. PROHIBIDO crear query keys inline en componentes
 * 3. PROHIBIDO keys paralelas como ['unified-movements'], etc.
 * 4. Las mutaciones DEBEN usar queryClient.setQueryData() para actualizar cache
 * 5. Cero invalidaciones masivas
 * 
 * @example
 * // En queries:
 * useQuery({ queryKey: financesKeys.movements(organizationId) })
 * useQuery({ queryKey: financesKeys.unifiedMovements(organizationId) })
 * 
 * @example
 * // En mutaciones:
 * onSuccess(updatedData) {
 *   queryClient.setQueryData(financesKeys.movements(orgId), (old) => 
 *     old ? [...old, updatedData] : [updatedData]
 *   )
 * }
 */

type NullableId = string | null | undefined;

export const financesKeys = {
  all: ['finances'] as const,

  // Financial Operations (Movements)
  movements: () => ['movements'] as const,
  movementsList: (organizationId: NullableId, projectId?: NullableId) =>
    [...financesKeys.movements(), organizationId ?? undefined, projectId ?? undefined] as const,
  movement: (movementId: NullableId) =>
    [...financesKeys.movements(), movementId ?? undefined] as const,

  // Unified Movements (across all types) - CRITICAL: MUST match use-unified-movements.ts key generation
  // Key format: ['unified-movements', orgId, 'scope:org'] or ['unified-movements', orgId, 'scope:project', projectId]
  unifiedMovements: () => ['unified-movements'] as const,
  unifiedMovementsList: (organizationId: NullableId, projectId?: NullableId) => {
    if (!organizationId) return [...financesKeys.unifiedMovements(), undefined] as const;
    if (projectId) {
      return [...financesKeys.unifiedMovements(), organizationId, 'scope:project', projectId] as const;
    }
    return [...financesKeys.unifiedMovements(), organizationId, 'scope:org'] as const;
  },
  
  unifiedMovementsStats: () => ['unified-movements-stats'] as const,
  unifiedMovementsStatsList: (organizationId: NullableId, projectId?: NullableId) => {
    if (!organizationId) return [...financesKeys.unifiedMovementsStats(), undefined] as const;
    if (projectId) {
      return [...financesKeys.unifiedMovementsStats(), organizationId, 'scope:project', projectId] as const;
    }
    return [...financesKeys.unifiedMovementsStats(), organizationId, 'scope:org'] as const;
  },

  // Partner Contributions
  partnerContributions: () => [...financesKeys.all, 'partner-contributions'] as const,
  partnerContributionsList: (organizationId: NullableId, projectId?: NullableId) =>
    [...financesKeys.partnerContributions(), organizationId ?? undefined, projectId ?? undefined] as const,
  partnerContribution: (contributionId: NullableId) =>
    [...financesKeys.partnerContributions(), contributionId ?? undefined] as const,

  // Partner Withdrawals
  partnerWithdrawals: () => [...financesKeys.all, 'partner-withdrawals'] as const,
  partnerWithdrawalsList: (organizationId: NullableId, projectId?: NullableId) =>
    [...financesKeys.partnerWithdrawals(), organizationId ?? undefined, projectId ?? undefined] as const,
  partnerWithdrawal: (withdrawalId: NullableId) =>
    [...financesKeys.partnerWithdrawals(), withdrawalId ?? undefined] as const,

  // Organization Wallets
  wallets: () => [...financesKeys.all, 'wallets'] as const,
  walletsList: (organizationId: NullableId) =>
    [...financesKeys.wallets(), organizationId ?? undefined] as const,
  wallet: (walletId: NullableId) =>
    [...financesKeys.wallets(), walletId ?? undefined] as const,

  // Financial Operations (General)
  operations: () => [...financesKeys.all, 'operations'] as const,
  operationsList: (organizationId: NullableId) =>
    [...financesKeys.operations(), organizationId ?? undefined] as const,
} as const;

export type FinancesQueryKey = readonly (string | undefined)[];
