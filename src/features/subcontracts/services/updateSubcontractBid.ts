import { apiRequest } from '@/lib/queryClient';
import type { SubcontractBid, InsertSubcontractBid } from '../types';
export async function updateSubcontractBid(
  bidId: string,
  data: Partial<InsertSubcontractBid>
): Promise<SubcontractBid> {
  const response = await apiRequest('PATCH', `/api/subcontract-bids/${bidId}`, data);
  if (response.ok) {
    const bid = await response.json();
    return bid;
  }
  const errorData = await response.json();
  throw new Error(errorData.error || 'Failed to update subcontract bid');
}
