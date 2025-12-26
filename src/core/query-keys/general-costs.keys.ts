/**
 * Centralized Query Keys for General Costs Feature
 * 
 * ARQUITECTURA ENTERPRISE DE CACHE
 * ================================
 * 
 * Una entidad = una familia única y centralizada de query keys
 * Las mutaciones actualizan el cache directamente, no dependen de invalidaciones sueltas
 * 
 * REGLAS ESTRICTAS:
 * 1. TODAS las queries de general-costs DEBEN usar estas keys
 * 2. PROHIBIDO crear query keys inline en componentes
 * 3. PROHIBIDO keys paralelas como ['general-costs-lite'], etc.
 * 4. Las mutaciones DEBEN usar queryClient.setQueryData() para actualizar cache
 * 5. Cero invalidaciones masivas
 * 
 * @example
 * // En queries:
 * useQuery({ queryKey: generalCostsKeys.list(organizationId) })
 * useQuery({ queryKey: generalCostsKeys.detail(costId) })
 * 
 * @example
 * // En mutaciones:
 * onSuccess(updatedCost) {
 *   queryClient.setQueryData(generalCostsKeys.detail(costId), updatedCost)
 *   queryClient.setQueryData(generalCostsKeys.list(orgId), (old) => 
 *     old?.map(c => c.id === costId ? updatedCost : c)
 *   )
 * }
 */
type NullableId = string | null | undefined;
export const generalCostsKeys = {
  all: ['general-costs'] as const,
  lists: () => [...generalCostsKeys.all, 'list'] as const,
  list: (organizationId: NullableId) => 
    [...generalCostsKeys.lists(), organizationId ?? undefined] as const,
  details: () => [...generalCostsKeys.all, 'detail'] as const,
  detail: (id: NullableId) => 
    [...generalCostsKeys.details(), id ?? undefined] as const,
  payments: () => [...generalCostsKeys.all, 'payment'] as const,
  paymentList: (organizationId: NullableId) => 
    [...generalCostsKeys.payments(), 'list', organizationId ?? undefined] as const,
  payment: (id: NullableId) => 
    [...generalCostsKeys.payments(), id ?? undefined] as const,
  paymentMedia: (paymentId: NullableId, organizationId: NullableId) =>
    [...generalCostsKeys.payments(), paymentId ?? undefined, 'media', organizationId ?? undefined] as const,
  monthlySummary: () => [...generalCostsKeys.all, 'monthly-summary'] as const,
  monthlySummaryList: (organizationId: NullableId) => 
    [...generalCostsKeys.monthlySummary(), organizationId ?? undefined] as const,
  byCategory: () => [...generalCostsKeys.all, 'by-category'] as const,
  byCategoryList: (organizationId: NullableId) => 
    [...generalCostsKeys.byCategory(), organizationId ?? undefined] as const,
  categories: () => [...generalCostsKeys.all, 'categories'] as const,
  categoryList: (organizationId: NullableId) => 
    [...generalCostsKeys.categories(), organizationId ?? undefined] as const,
  category: (id: NullableId) => 
    [...generalCostsKeys.categories(), id ?? undefined] as const,
  metrics: (organizationId: NullableId) =>
    [...generalCostsKeys.all, 'metrics', organizationId ?? undefined] as const,
} as const;
export type GeneralCostsQueryKey = readonly (string | undefined)[];
