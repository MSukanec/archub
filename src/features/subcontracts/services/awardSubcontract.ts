import { apiRequest } from '@/lib/queryClient';
import type { Subcontract } from '../types';

export interface AwardSubcontractData {
  winner_bid_id: string;
  amount_total: number;
  currency_id: string;
}

export async function awardSubcontract(
  subcontractId: string,
  data: AwardSubcontractData
): Promise<Subcontract> {
  const response = await apiRequest('PUT', `/api/subcontracts/${subcontractId}/award`, data);

  if (response.ok) {
    const result = await response.json();
    return result.data;
  }

  const errorData = await response.json();
  throw new Error(errorData.error || 'Failed to award subcontract');
}
