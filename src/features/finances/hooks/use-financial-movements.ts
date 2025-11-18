import { useQuery } from '@tanstack/react-query';
import { getAllFinancialMovements } from '../services/getAllFinancialMovements';
import { FINANCIAL_QUERY_KEYS } from '../constants';

/**
 * Hook to fetch all financial movements for an organization or project.
 * 
 * This hook combines data from all payment types (client_payments, material_payments, etc.)
 * into a unified financial movements list.
 * 
 * If projectId is provided, filters by that project. Otherwise, shows all movements from the organization.
 * 
 * @param organizationId - ID of the organization
 * @param projectId - ID of the project (optional). If provided, filters by project.
 * @returns React Query result with financial movements
 */
export function useFinancialMovements(
  organizationId: string | undefined,
  projectId?: string | null
) {
  return useQuery({
    queryKey: [...FINANCIAL_QUERY_KEYS.list(organizationId), projectId],
    queryFn: () => getAllFinancialMovements(organizationId!, projectId),
    enabled: !!organizationId,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
}
