import { apiRequest } from '@/lib/queryClient';
import type { Subcontract } from '../types';

export interface CreateSubcontractData {
  organization_id: string;
  project_id: string;
  title: string;
  description?: string;
  status?: string;
  contact_id?: string | null;
  date?: string | null;
  code?: string | null;
  currency_id?: string | null;
  amount_total?: number | null;
  exchange_rate?: number | null;
  notes?: string | null;
}

export async function createSubcontract(data: CreateSubcontractData): Promise<Subcontract> {
  const response = await apiRequest('POST', '/api/subcontracts', {
    organization_id: data.organization_id,
    project_id: data.project_id,
    title: data.title,
    description: data.description || '',
    status: data.status || 'active',
    contact_id: data.contact_id,
    date: data.date,
    code: data.code,
    currency_id: data.currency_id,
    amount_total: data.amount_total,
    exchange_rate: data.exchange_rate,
    notes: data.notes,
  });

  if (response.ok) {
    const subcontract = await response.json();
    return subcontract;
  }

  const errorData = await response.json();
  throw new Error(errorData.error || 'Failed to create subcontract');
}
