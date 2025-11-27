import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMaterialPayments,
  getMaterialPaymentById,
  createMaterialPayment,
  updateMaterialPayment,
  deleteMaterialPayment,
} from '../services/materialPayments';
import { MATERIAL_PAYMENT_QUERY_KEYS } from '../constants';
import type { MaterialPayment } from '../types';

export function useMaterialPayments(
  projectId: string | undefined,
  organizationId: string | undefined
) {
  return useQuery({
    queryKey: MATERIAL_PAYMENT_QUERY_KEYS.payments(projectId),
    queryFn: () => getMaterialPayments(projectId!, organizationId!),
    enabled: !!projectId && !!organizationId,
  });
}

export function useMaterialPayment(
  paymentId: string | undefined,
  organizationId: string | undefined
) {
  return useQuery({
    queryKey: MATERIAL_PAYMENT_QUERY_KEYS.payment(paymentId),
    queryFn: () => getMaterialPaymentById(paymentId!, organizationId!),
    enabled: !!paymentId && !!organizationId,
  });
}

export function useCreateMaterialPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      payment,
      projectId,
      organizationId,
      createdBy,
    }: {
      payment: Omit<MaterialPayment, 'id' | 'created_at' | 'updated_at' | 'project_id' | 'organization_id' | 'created_by'>;
      projectId: string;
      organizationId: string;
      createdBy: string;
    }) => createMaterialPayment(payment, projectId, organizationId, createdBy),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: MATERIAL_PAYMENT_QUERY_KEYS.payments(data.project_id),
      });
    },
  });
}

export function useUpdateMaterialPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      paymentId,
      updates,
      organizationId,
    }: {
      paymentId: string;
      updates: Partial<Omit<MaterialPayment, 'id' | 'created_at' | 'updated_at' | 'project_id' | 'organization_id' | 'created_by'>>;
      organizationId: string;
    }) => updateMaterialPayment(paymentId, updates, organizationId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: MATERIAL_PAYMENT_QUERY_KEYS.payments(data.project_id),
      });
      queryClient.invalidateQueries({
        queryKey: MATERIAL_PAYMENT_QUERY_KEYS.payment(data.id),
      });
    },
  });
}

export function useDeleteMaterialPayment() {
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
    }) => deleteMaterialPayment(paymentId, organizationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: MATERIAL_PAYMENT_QUERY_KEYS.payments(variables.projectId),
      });
    },
  });
}
