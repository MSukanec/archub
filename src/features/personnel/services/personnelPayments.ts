import { apiRequest } from '@/lib/queryClient';
import type { PersonnelPaymentWithRelations } from '../types';

const BASE_URL = '/api/projects';

export async function getPersonnelPayments(
  projectId: string,
  organizationId: string
): Promise<PersonnelPaymentWithRelations[]> {
  if (!organizationId || !projectId) {
    return [];
  }

  const response = await apiRequest(
    'GET',
    `${BASE_URL}/${projectId}/personnel-payments?organization_id=${organizationId}`
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch personnel payments');
  }

  const result = await response.json();
  return result.data || [];
}

export async function getPersonnelPaymentById(
  projectId: string,
  paymentId: string,
  organizationId: string
): Promise<PersonnelPaymentWithRelations | null> {
  if (!organizationId || !paymentId || !projectId) {
    return null;
  }

  const response = await apiRequest(
    'GET',
    `${BASE_URL}/${projectId}/personnel-payments/${paymentId}?organization_id=${organizationId}`
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch personnel payment');
  }

  const result = await response.json();
  return result.data || null;
}

export interface CreatePersonnelPaymentData {
  amount: number;
  currency_id: string;
  exchange_rate?: number;
  payment_date: string;
  wallet_id?: string | null;
  notes?: string | null;
  reference?: string | null;
  status: 'confirmed' | 'pending' | 'rejected' | 'void';
  personnel_id?: string | null;
  created_by?: string | null;
}

export async function createPersonnelPayment(
  projectId: string,
  organizationId: string,
  paymentData: CreatePersonnelPaymentData
): Promise<PersonnelPaymentWithRelations> {
  const response = await apiRequest(
    'POST',
    `${BASE_URL}/${projectId}/personnel-payments?organization_id=${organizationId}`,
    paymentData
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create personnel payment');
  }

  const result = await response.json();
  return result.data;
}

export interface UpdatePersonnelPaymentData {
  amount?: number;
  currency_id?: string;
  exchange_rate?: number;
  payment_date?: string;
  wallet_id?: string | null;
  notes?: string | null;
  reference?: string | null;
  status?: 'confirmed' | 'pending' | 'rejected' | 'void';
  personnel_id?: string | null;
}

export async function updatePersonnelPayment(
  projectId: string,
  paymentId: string,
  organizationId: string,
  updates: UpdatePersonnelPaymentData
): Promise<PersonnelPaymentWithRelations> {
  const response = await apiRequest(
    'PATCH',
    `${BASE_URL}/${projectId}/personnel-payments/${paymentId}?organization_id=${organizationId}`,
    updates
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update personnel payment');
  }

  const result = await response.json();
  return result.data;
}

export async function deletePersonnelPayment(
  projectId: string,
  paymentId: string,
  organizationId: string
): Promise<boolean> {
  const response = await apiRequest(
    'DELETE',
    `${BASE_URL}/${projectId}/personnel-payments/${paymentId}?organization_id=${organizationId}`
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to delete personnel payment');
  }

  return true;
}

export interface PaymentAttachment {
  id: string;
  description: string | null;
  category: string | null;
  created_at: string;
  media_file: {
    id: string;
    file_url: string;
    file_name: string;
    file_type: string;
    file_size: number;
  } | null;
}

export async function getPersonnelPaymentAttachments(
  projectId: string,
  paymentId: string,
  organizationId: string
): Promise<PaymentAttachment[]> {
  if (!organizationId || !paymentId || !projectId) {
    return [];
  }

  const response = await apiRequest(
    'GET',
    `${BASE_URL}/${projectId}/personnel-payments/${paymentId}/attachments?organization_id=${organizationId}`
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch payment attachments');
  }

  const result = await response.json();
  return result.data || [];
}
