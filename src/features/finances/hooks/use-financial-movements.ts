import { useQuery } from '@tanstack/react-query';
import { getAllFinancialMovements } from '../services/getAllFinancialMovements';
import { FINANCIAL_QUERY_KEYS } from '../constants';

/**
 * Hook to fetch all financial movements for an organization.
 * 
 * This hook combines data from all payment types (client_payments, material_payments, etc.)
 * into a unified financial movements list.
 * 
 * @param organizationId - ID of the organization
 * @returns React Query result with financial movements
 */
export function useFinancialMovements(organizationId: string | undefined) {
  return useQuery({
    queryKey: FINANCIAL_QUERY_KEYS.list(organizationId),
    queryFn: () => getAllFinancialMovements(organizationId!),
    enabled: !!organizationId,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
}
