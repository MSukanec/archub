import type { SubcontractBidWithContact } from '../types';

export async function getSubcontractBids(subcontractId: string): Promise<SubcontractBidWithContact[]> {
  if (!subcontractId) {
    return [];
  }

  const response = await fetch(`/api/subcontract-bids/${subcontractId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch subcontract bids');
  }

  const data = await response.json();
  return data || [];
}
