import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getClientPayments,
  getClientPaymentById,
  createClientPayment,
  updateClientPayment,
  deleteClientPayment,
} from '../services/clientPayments';
import { CLIENT_QUERY_KEYS } from '../constants';
import type { ClientPayment } from '../types';
export function useClientPayments(
  projectId: string | undefined,
  organizationId: string | undefined
) {
  return useQuery({
    queryKey: CLIENT_QUERY_KEYS.payments(projectId),
    queryFn: () => getClientPayments(projectId!, organizationId!),
    enabled: !!projectId && !!organizationId,
  });
}
export function useClientPayment(
  paymentId: string | undefined,
  organizationId: string | undefined
) {
  return useQuery({
    queryKey: CLIENT_QUERY_KEYS.payment(paymentId),
    queryFn: () => getClientPaymentById(paymentId!, organizationId!),
    enabled: !!paymentId && !!organizationId,
  });
}
export function useCreateClientPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      payment,
      projectId,
      organizationId,
      createdBy,
    }: {
      payment: Omit<ClientPayment, 'id'| 'created_at'| 'updated_at'| 'project_id'| 'organization_id'| 'created_by'>;
      projectId: string;
      organizationId: string;
      createdBy: string;
    }) => createClientPayment(payment, projectId, organizationId, createdBy),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: CLIENT_QUERY_KEYS.payments(data.project_id),
      });
      queryClient.invalidateQueries({
        queryKey: CLIENT_QUERY_KEYS.schedule(data.project_id),
      });
      queryClient.invalidateQueries({
        queryKey: CLIENT_QUERY_KEYS.dashboard(data.project_id),
      });
      queryClient.invalidateQueries({
        queryKey: ['unified-movements'],
      });
      queryClient.invalidateQueries({
        queryKey: ['unified-movements-stats'],
      });
    },
  });
}
export function useUpdateClientPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      paymentId,
      updates,
      organizationId,
    }: {
      paymentId: string;
      updates: Partial<Omit<ClientPayment, 'id'| 'created_at'| 'updated_at'| 'project_id'| 'organization_id'| 'created_by'>>;
      organizationId: string;
    }) => updateClientPayment(paymentId, updates, organizationId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: CLIENT_QUERY_KEYS.payments(data.project_id),
      });
      queryClient.invalidateQueries({
        queryKey: CLIENT_QUERY_KEYS.payment(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: CLIENT_QUERY_KEYS.schedule(data.project_id),
      });
      queryClient.invalidateQueries({
        queryKey: CLIENT_QUERY_KEYS.dashboard(data.project_id),
      });
      queryClient.invalidateQueries({
        queryKey: ['unified-movements'],
      });
      queryClient.invalidateQueries({
        queryKey: ['unified-movements-stats'],
      });
    },
  });
}
export function useDeleteClientPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      paymentId,
      organizationId,
      projectId,
    }: {
      paymentId: string;
      organizationId: string;
      projectId: string;
    }) => deleteClientPayment(paymentId, organizationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: CLIENT_QUERY_KEYS.payments(variables.projectId),
      });
      queryClient.invalidateQueries({
        queryKey: CLIENT_QUERY_KEYS.schedule(variables.projectId),
      });
      queryClient.invalidateQueries({
        queryKey: CLIENT_QUERY_KEYS.dashboard(variables.projectId),
      });
      queryClient.invalidateQueries({
        queryKey: ['unified-movements'],
      });
      queryClient.invalidateQueries({
        queryKey: ['unified-movements-stats'],
      });
    },
  });
}
