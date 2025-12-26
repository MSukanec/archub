import { useQuery } from '@tanstack/react-query';
import { getPartnerContributions } from '../services/getPartnerContributions';
import { getPartnerWithdrawals } from '../services/getPartnerWithdrawals';
import { parseLocalDate } from '@/lib/date-utils';
  mapPartnerContributionsToFinancialMovements,
  mapPartnerWithdrawalsToFinancialMovements 
} from '../mappers';
import type { FinancialMovementWithRelations } from '../types';
/**
 * Hook to fetch and combine partner contributions and withdrawals into unified financial movements.
 * 
 * @param organizationId - Organization ID (required)
 * @param projectId - Optional project ID for filtering
 * @returns React Query result with combined partner movements
 */
export function usePartnerMovements(
  organizationId?: string,
  projectId?: string
) {
  return useQuery({
    queryKey: ['partner-movements', organizationId, projectId],
    queryFn: async (): Promise<FinancialMovementWithRelations[]> => {
      if (!organizationId) {
        return [];
      }
      // Fetch both contributions and withdrawals in parallel
      const [contributions, withdrawals] = await Promise.all([
        getPartnerContributions(organizationId, projectId),
        getPartnerWithdrawals(organizationId, projectId),
      ]);
      // Map to unified financial movements
      const contributionMovements = mapPartnerContributionsToFinancialMovements(contributions);
      const withdrawalMovements = mapPartnerWithdrawalsToFinancialMovements(withdrawals);
      // Combine and sort by payment_date descending
      const allMovements = [...contributionMovements, ...withdrawalMovements];
      allMovements.sort((a, b) => {
        return parseLocalDate(b.payment_date)!.getTime() - parseLocalDate(a.payment_date)!.getTime();
      });
      return allMovements;
    },
    enabled: !!organizationId,
  });
}
