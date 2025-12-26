import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMaterialPayments,
  getMaterialPaymentById,
  createMaterialPayment,
  updateMaterialPayment,
  deleteMaterialPayment,
  type CreateMaterialPaymentData,
  type UpdateMaterialPaymentData,
} from '../services/materialPayments';
import { MATERIAL_PAYMENT_QUERY_KEYS } from '../constants';

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
  projectId: string | undefined,
  paymentId: string | undefined,
  organizationId: string | undefined
) {
  return useQuery({
    queryKey: MATERIAL_PAYMENT_QUERY_KEYS.payment(paymentId),
    queryFn: () => getMaterialPaymentById(projectId!, paymentId!, organizationId!),
    enabled: !!projectId && !!paymentId && !!organizationId,
  });
}

export function useCreateMaterialPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      payment,
      projectId,
      organizationId,
    }: {
      payment: CreateMaterialPaymentData;
      projectId: string;
      organizationId: string;
    }) => createMaterialPayment(projectId, organizationId, payment),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: MATERIAL_PAYMENT_QUERY_KEYS.payments(variables.projectId),
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

export function useUpdateMaterialPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      paymentId,
      updates,
      organizationId,
    }: {
      projectId: string;
      paymentId: string;
      updates: UpdateMaterialPaymentData;
      organizationId: string;
    }) => updateMaterialPayment(projectId, paymentId, organizationId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: MATERIAL_PAYMENT_QUERY_KEYS.payments(variables.projectId),
      });
      queryClient.invalidateQueries({
        queryKey: MATERIAL_PAYMENT_QUERY_KEYS.payment(variables.paymentId),
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

export function useDeleteMaterialPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      paymentId,
      organizationId,
    }: {
      projectId: string;
      paymentId: string;
      organizationId: string;
    }) => deleteMaterialPayment(projectId, paymentId, organizationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: MATERIAL_PAYMENT_QUERY_KEYS.payments(variables.projectId),
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
