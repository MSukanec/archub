import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPersonnelPayments,
  getPersonnelPaymentById,
  createPersonnelPayment,
  updatePersonnelPayment,
  deletePersonnelPayment,
  type CreatePersonnelPaymentData,
  type UpdatePersonnelPaymentData,
} from '../services/personnelPayments';
import { PERSONNEL_PAYMENT_QUERY_KEYS } from '../constants';
export function usePersonnelPayments(
  projectId: string | undefined,
  organizationId: string | undefined
) {
  return useQuery({
    queryKey: PERSONNEL_PAYMENT_QUERY_KEYS.payments(projectId),
    queryFn: () => getPersonnelPayments(projectId!, organizationId!),
    enabled: !!projectId && !!organizationId,
    staleTime: 30000,
    gcTime: 60000,
  });
}
export function usePersonnelPayment(
  projectId: string | undefined,
  paymentId: string | undefined,
  organizationId: string | undefined
) {
  return useQuery({
    queryKey: PERSONNEL_PAYMENT_QUERY_KEYS.payment(paymentId),
    queryFn: () => getPersonnelPaymentById(projectId!, paymentId!, organizationId!),
    enabled: !!projectId && !!paymentId && !!organizationId,
  });
}
export function useCreatePersonnelPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      payment,
      projectId,
      organizationId,
    }: {
      payment: CreatePersonnelPaymentData;
      projectId: string;
      organizationId: string;
    }) => createPersonnelPayment(projectId, organizationId, payment),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: PERSONNEL_PAYMENT_QUERY_KEYS.payments(variables.projectId),
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
export function useUpdatePersonnelPayment() {
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
      updates: UpdatePersonnelPaymentData;
      organizationId: string;
    }) => updatePersonnelPayment(projectId, paymentId, organizationId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: PERSONNEL_PAYMENT_QUERY_KEYS.payments(variables.projectId),
      });
      queryClient.invalidateQueries({
        queryKey: PERSONNEL_PAYMENT_QUERY_KEYS.payment(variables.paymentId),
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
export function useDeletePersonnelPayment() {
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
    }) => deletePersonnelPayment(projectId, paymentId, organizationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: PERSONNEL_PAYMENT_QUERY_KEYS.payments(variables.projectId),
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
