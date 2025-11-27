import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  description: string;
  quantity: number;
  unit_id: string | null;
  notes: string | null;
  created_at: string;
  created_by: string | null;
  unit?: {
    id: string;
    name: string;
    abbreviation: string | null;
  } | null;
}

export interface PurchaseOrder {
  id: string;
  project_id: string;
  organization_id: string;
  requested_by: string | null;
  approved_by: string | null;
  provider_id: string | null;
  order_date: string;
  status: 'draft' | 'sent' | 'quoted' | 'approved' | 'rejected' | 'converted';
  notes: string | null;
  created_at: string;
  updated_at: string;
  requester?: {
    id: string;
    user: {
      id: string;
      full_name: string;
      avatar_url: string | null;
    } | null;
  } | null;
  approver?: {
    id: string;
    user: {
      id: string;
      full_name: string;
      avatar_url: string | null;
    } | null;
  } | null;
  provider?: {
    id: string;
    full_name: string | null;
    company_name: string | null;
  } | null;
  project?: {
    id: string;
    name: string;
  } | null;
  items?: PurchaseOrderItem[];
}

export const PURCHASE_ORDER_STATUS = {
  draft: { label: 'Borrador', variant: 'secondary' as const, className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  sent: { label: 'Enviado', variant: 'default' as const, className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  quoted: { label: 'Cotizado', variant: 'default' as const, className: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
  approved: { label: 'Aprobado', variant: 'default' as const, className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  rejected: { label: 'Rechazado', variant: 'destructive' as const, className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
  converted: { label: 'Convertido', variant: 'default' as const, className: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
};

export function getPurchaseOrderStatusBadgeConfig(status: PurchaseOrder['status']) {
  return PURCHASE_ORDER_STATUS[status] || PURCHASE_ORDER_STATUS.draft;
}

export function usePurchaseOrders(projectId: string | undefined, organizationId: string | undefined) {
  return useQuery<PurchaseOrder[]>({
    queryKey: ['/api/projects', projectId, 'purchase-orders', { organization_id: organizationId }],
    enabled: !!projectId && !!organizationId,
  });
}

export function usePurchaseOrder(
  projectId: string | undefined,
  orderId: string | undefined,
  organizationId: string | undefined
) {
  return useQuery<PurchaseOrder>({
    queryKey: ['/api/projects', projectId, 'purchase-orders', orderId, { organization_id: organizationId }],
    enabled: !!projectId && !!orderId && !!organizationId,
  });
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderData,
      items,
      projectId,
      organizationId,
    }: {
      orderData: {
        provider_id?: string | null;
        order_date: string;
        status: PurchaseOrder['status'];
        notes?: string | null;
      };
      items: Array<{
        description: string;
        quantity: number;
        unit_id?: string | null;
        notes?: string | null;
      }>;
      projectId: string;
      organizationId: string;
    }) => {
      const response = await apiRequest(
        'POST',
        `/api/projects/${projectId}/purchase-orders?organization_id=${organizationId}`,
        { ...orderData, items }
      );
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/projects', variables.projectId, 'purchase-orders'] 
      });
    },
  });
}

export function useUpdatePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      orderId,
      updates,
      items,
      organizationId,
    }: {
      projectId: string;
      orderId: string;
      updates: {
        provider_id?: string | null;
        order_date?: string;
        status?: PurchaseOrder['status'];
        notes?: string | null;
        approved_by?: string | null;
      };
      items?: Array<{
        id?: string;
        description: string;
        quantity: number;
        unit_id?: string | null;
        notes?: string | null;
      }>;
      organizationId: string;
    }) => {
      const body = items ? { ...updates, items } : updates;
      const response = await apiRequest(
        'PATCH',
        `/api/projects/${projectId}/purchase-orders/${orderId}?organization_id=${organizationId}`,
        body
      );
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/projects', variables.projectId, 'purchase-orders'] 
      });
    },
  });
}

export function useDeletePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      organizationId,
      projectId,
    }: {
      orderId: string;
      organizationId: string;
      projectId: string;
    }) => {
      const response = await apiRequest(
        'DELETE',
        `/api/projects/${projectId}/purchase-orders/${orderId}?organization_id=${organizationId}`
      );
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/projects', variables.projectId, 'purchase-orders'] 
      });
    },
  });
}
