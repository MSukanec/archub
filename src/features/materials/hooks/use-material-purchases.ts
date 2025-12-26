import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface MaterialPurchase {
  id: string;
  project_id: string;
  organization_id: string;
  provider_id: string | null;
  invoice_number: string | null;
  document_type: 'invoice' | 'receipt' | 'ticket' | 'other';
  purchase_date: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  currency_id: string;
  exchange_rate: number | null;
  status: 'pending' | 'partially_paid' | 'paid' | 'cancelled';
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  provider?: {
    id: string;
    full_name: string | null;
    company_name: string | null;
    first_name: string | null;
    last_name: string | null;
  } | null;
  currency?: {
    id: string;
    code: string;
    symbol: string;
    name: string;
  } | null;
  creator?: {
    id: string;
    user: {
      id: string;
      full_name: string;
      avatar_url: string | null;
    } | null;
  } | null;
  project?: {
    id: string;
    name: string;
  } | null;
  attachments?: Array<{
    id: string;
    file_url: string;
    file_name: string;
    file_type: string;
  }>;
}

export const MATERIAL_PURCHASE_STATUS = {
  pending: { label: 'Pendiente', variant: 'pending' as const },
  partially_paid: { label: 'Pago Parcial', variant: 'warning' as const },
  paid: { label: 'Pagado', variant: 'success' as const },
  cancelled: { label: 'Cancelado', variant: 'error' as const },
};

export const DOCUMENT_TYPES = {
  invoice: { label: 'Factura', value: 'invoice' },
  receipt: { label: 'Recibo', value: 'receipt' },
  ticket: { label: 'Ticket', value: 'ticket' },
  other: { label: 'Otro', value: 'other' },
};

export function getMaterialPurchaseStatusBadgeConfig(status: MaterialPurchase['status']) {
  return MATERIAL_PURCHASE_STATUS[status] || MATERIAL_PURCHASE_STATUS.pending;
}

export function useMaterialPurchases(projectId: string | undefined, organizationId: string | undefined) {
  return useQuery<{ data: MaterialPurchase[] }, Error, MaterialPurchase[]>({
    queryKey: [`/api/projects/${projectId}/material-purchases?organization_id=${organizationId}`],
    enabled: !!projectId && !!organizationId,
    select: (response) => response?.data || [],
  });
}

export function useMaterialPurchase(
  projectId: string | undefined,
  purchaseId: string | undefined,
  organizationId: string | undefined
) {
  return useQuery<{ data: MaterialPurchase }, Error, MaterialPurchase | null>({
    queryKey: [`/api/projects/${projectId}/material-purchases/${purchaseId}?organization_id=${organizationId}`],
    enabled: !!projectId && !!purchaseId && !!organizationId,
    select: (response) => response?.data || null,
  });
}

export function useCreateMaterialPurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      purchaseData,
      projectId,
      organizationId,
    }: {
      purchaseData: {
        provider_id?: string | null;
        invoice_number?: string | null;
        document_type?: MaterialPurchase['document_type'];
        purchase_date: string;
        subtotal: number;
        tax_amount?: number;
        currency_id: string;
        exchange_rate?: number | null;
        status?: MaterialPurchase['status'];
        notes?: string | null;
      };
      projectId: string;
      organizationId: string;
    }) => {
      const response = await apiRequest(
        'POST',
        `/api/projects/${projectId}/material-purchases?organization_id=${organizationId}`,
        purchaseData
      );
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0] as string;
          return key?.includes(`/api/projects/${variables.projectId}/material-purchases`);
        }
      });
    },
  });
}

export function useUpdateMaterialPurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      purchaseId,
      updates,
      organizationId,
    }: {
      projectId: string;
      purchaseId: string;
      updates: {
        provider_id?: string | null;
        invoice_number?: string | null;
        document_type?: MaterialPurchase['document_type'];
        purchase_date?: string;
        subtotal?: number;
        tax_amount?: number;
        currency_id?: string;
        exchange_rate?: number | null;
        status?: MaterialPurchase['status'];
        notes?: string | null;
      };
      organizationId: string;
    }) => {
      const response = await apiRequest(
        'PATCH',
        `/api/projects/${projectId}/material-purchases/${purchaseId}?organization_id=${organizationId}`,
        updates
      );
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0] as string;
          return key?.includes(`/api/projects/${variables.projectId}/material-purchases`);
        }
      });
    },
  });
}

export function useDeleteMaterialPurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      purchaseId,
      organizationId,
      projectId,
    }: {
      purchaseId: string;
      organizationId: string;
      projectId: string;
    }) => {
      const response = await apiRequest(
        'DELETE',
        `/api/projects/${projectId}/material-purchases/${purchaseId}?organization_id=${organizationId}`
      );
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0] as string;
          return key?.includes(`/api/projects/${variables.projectId}/material-purchases`);
        }
      });
    },
  });
}
