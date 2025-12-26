import { apiRequest } from '@/lib/queryClient';
import type { SubcontractBid, InsertSubcontractBid } from '../types';

export async function createSubcontractBid(data: InsertSubcontractBid): Promise<SubcontractBid> {
  const response = await apiRequest('POST', '/api/subcontract-bids', data);

  if (response.ok) {
    const bid = await response.json();
    return bid;
  }

  const errorData = await response.json();
  throw new Error(errorData.error || 'Failed to create subcontract bid');
}
