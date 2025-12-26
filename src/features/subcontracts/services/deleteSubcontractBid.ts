import { apiRequest } from '@/lib/queryClient';

export async function deleteSubcontractBid(bidId: string): Promise<void> {
  const response = await apiRequest('DELETE', `/api/subcontract-bids/${bidId}`, {});

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to delete subcontract bid');
  }
}
