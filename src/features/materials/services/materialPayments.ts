import { apiRequest } from '@/lib/queryClient';
import type { MaterialPaymentWithRelations } from '../types';
const BASE_URL = '/api/projects';
export async function getMaterialPayments(
  projectId: string,
  organizationId: string
): Promise<MaterialPaymentWithRelations[]> {
  if (!organizationId || !projectId) {
    return [];
  }
  const response = await apiRequest(
    'GET',
    `${BASE_URL}/${projectId}/material-payments?organization_id=${organizationId}`
  );
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch material payments');
  }
  const result = await response.json();
  return result.data || [];
}
export async function getMaterialPaymentById(
  projectId: string,
  paymentId: string,
  organizationId: string
): Promise<MaterialPaymentWithRelations | null> {
  if (!organizationId || !paymentId || !projectId) {
    return null;
  }
  const response = await apiRequest(
    'GET',
    `${BASE_URL}/${projectId}/material-payments/${paymentId}?organization_id=${organizationId}`
  );
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch material payment');
  }
  const result = await response.json();
  return result.data || null;
}
export interface CreateMaterialPaymentData {
  amount: number;
  currency_id: string;
  exchange_rate?: number;
  payment_date: string;
  wallet_id?: string | null;
  notes?: string | null;
  reference?: string | null;
  status: 'confirmed'| 'pending'| 'rejected'| 'void';
  purchase_id?: string | null;
  created_by?: string | null;
}
export async function createMaterialPayment(
  projectId: string,
  organizationId: string,
  paymentData: CreateMaterialPaymentData
): Promise<MaterialPaymentWithRelations> {
  const response = await apiRequest(
    'POST',
    `${BASE_URL}/${projectId}/material-payments?organization_id=${organizationId}`,
    paymentData
  );
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create material payment');
  }
  const result = await response.json();
  return result.data;
}
export interface UpdateMaterialPaymentData {
  amount?: number;
  currency_id?: string;
  exchange_rate?: number;
  payment_date?: string;
  wallet_id?: string | null;
  notes?: string | null;
  reference?: string | null;
  status?: 'confirmed'| 'pending'| 'rejected'| 'void';
  purchase_id?: string | null;
}
export async function updateMaterialPayment(
  projectId: string,
  paymentId: string,
  organizationId: string,
  updates: UpdateMaterialPaymentData
): Promise<MaterialPaymentWithRelations> {
  const response = await apiRequest(
    'PATCH',
    `${BASE_URL}/${projectId}/material-payments/${paymentId}?organization_id=${organizationId}`,
    updates
  );
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update material payment');
  }
  const result = await response.json();
  return result.data;
}
export async function deleteMaterialPayment(
  projectId: string,
  paymentId: string,
  organizationId: string
): Promise<boolean> {
  const response = await apiRequest(
    'DELETE',
    `${BASE_URL}/${projectId}/material-payments/${paymentId}?organization_id=${organizationId}`
  );
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to delete material payment');
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
export async function getMaterialPaymentAttachments(
  projectId: string,
  paymentId: string,
  organizationId: string
): Promise<PaymentAttachment[]> {
  if (!organizationId || !paymentId || !projectId) {
    return [];
  }
  const response = await apiRequest(
    'GET',
    `${BASE_URL}/${projectId}/material-payments/${paymentId}/attachments?organization_id=${organizationId}`
  );
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch payment attachments');
  }
  const result = await response.json();
  return result.data || [];
}
