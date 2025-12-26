import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getPartnerWithdrawals, 
  getPartnerWithdrawalById 
} from '../services/getPartnerWithdrawals';
import { createPartnerWithdrawal } from '../services/createPartnerWithdrawal';
import { updatePartnerWithdrawal } from '../services/updatePartnerWithdrawal';
import { deletePartnerWithdrawal } from '../services/deletePartnerWithdrawal';
import { PARTNER_QUERY_KEYS } from '../constants';
import type { PartnerWithdrawal, PartnerWithdrawalCreateInput } from '../types';

export function usePartnerWithdrawals(
  organizationId: string | undefined,
  projectId?: string
) {
  return useQuery<PartnerWithdrawal[]>({
    queryKey: PARTNER_QUERY_KEYS.withdrawals(organizationId || '', projectId),
    queryFn: () => getPartnerWithdrawals(organizationId!, projectId),
    enabled: !!organizationId,
  });
}

export function usePartnerWithdrawal(
  withdrawalId: string | undefined,
  organizationId: string | undefined
) {
  return useQuery<PartnerWithdrawal | null>({
    queryKey: PARTNER_QUERY_KEYS.withdrawal(withdrawalId || ''),
    queryFn: () => getPartnerWithdrawalById(withdrawalId!, organizationId!),
    enabled: !!withdrawalId && !!organizationId,
  });
}

export function useCreatePartnerWithdrawal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: PartnerWithdrawalCreateInput) => createPartnerWithdrawal(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: PARTNER_QUERY_KEYS.withdrawals(data.organization_id, data.project_id || undefined),
      });
      queryClient.invalidateQueries({ queryKey: PARTNER_QUERY_KEYS.unifiedMovements() });
      queryClient.invalidateQueries({ queryKey: PARTNER_QUERY_KEYS.partnerMovements(data.organization_id, data.project_id) });
    },
  });
}

export function useUpdatePartnerWithdrawal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      withdrawalId,
      updates,
      organizationId,
    }: {
      withdrawalId: string;
      updates: Partial<Omit<PartnerWithdrawal, 'id' | 'created_at' | 'organization_id' | 'created_by'>>;
      organizationId: string;
    }) => updatePartnerWithdrawal(withdrawalId, updates, organizationId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: PARTNER_QUERY_KEYS.withdrawals(data.organization_id, data.project_id || undefined),
      });
      queryClient.invalidateQueries({
        queryKey: PARTNER_QUERY_KEYS.withdrawal(data.id),
      });
      queryClient.invalidateQueries({ queryKey: PARTNER_QUERY_KEYS.unifiedMovements() });
      queryClient.invalidateQueries({ queryKey: PARTNER_QUERY_KEYS.partnerMovements(data.organization_id, data.project_id) });
    },
  });
}

export function useDeletePartnerWithdrawal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      withdrawalId,
      organizationId,
    }: {
      withdrawalId: string;
      organizationId: string;
      projectId?: string;
    }) => deletePartnerWithdrawal(withdrawalId, organizationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: PARTNER_QUERY_KEYS.withdrawals(variables.organizationId, variables.projectId),
      });
      queryClient.invalidateQueries({ queryKey: PARTNER_QUERY_KEYS.unifiedMovements() });
      queryClient.invalidateQueries({
        queryKey: PARTNER_QUERY_KEYS.partnerMovements(variables.organizationId, variables.projectId),
      });
    },
  });
}
