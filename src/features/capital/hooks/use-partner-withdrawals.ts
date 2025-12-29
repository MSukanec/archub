import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getPartnerWithdrawals, 
  getPartnerWithdrawalById 
} from '../services/getPartnerWithdrawals';
import { createPartnerWithdrawal } from '../services/createPartnerWithdrawal';
import { updatePartnerWithdrawal } from '../services/updatePartnerWithdrawal';
import { deletePartnerWithdrawal } from '../services/deletePartnerWithdrawal';
import { capitalKeys, financesKeys } from '@/core/query-keys';
import type { PartnerWithdrawal, PartnerWithdrawalCreateInput } from '../types';

export function usePartnerWithdrawals(
  organizationId: string | undefined,
  projectId?: string
) {
  return useQuery<PartnerWithdrawal[]>({
    queryKey: capitalKeys.withdrawalsList(organizationId || '', projectId),
    queryFn: () => getPartnerWithdrawals(organizationId!, projectId),
    enabled: !!organizationId,
  });
}

export function usePartnerWithdrawal(
  withdrawalId: string | undefined,
  organizationId: string | undefined
) {
  return useQuery<PartnerWithdrawal | null>({
    queryKey: capitalKeys.withdrawal(withdrawalId || ''),
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
        queryKey: capitalKeys.withdrawalsList(data.organization_id, data.project_id || undefined),
      });
      queryClient.invalidateQueries({ queryKey: capitalKeys.unifiedMovements() });
      queryClient.invalidateQueries({ queryKey: capitalKeys.partnerMovements(data.organization_id, data.project_id) });
      // Invalidate finances unified movements since withdrawals are part of unified movements
      queryClient.invalidateQueries({
        queryKey: financesKeys.unifiedMovementsList(data.organization_id, data.project_id || undefined),
      });
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
        queryKey: capitalKeys.withdrawalsList(data.organization_id, data.project_id || undefined),
      });
      queryClient.invalidateQueries({
        queryKey: capitalKeys.withdrawal(data.id),
      });
      queryClient.invalidateQueries({ queryKey: capitalKeys.unifiedMovements() });
      queryClient.invalidateQueries({ queryKey: capitalKeys.partnerMovements(data.organization_id, data.project_id) });
      // Invalidate finances unified movements since withdrawals are part of unified movements
      queryClient.invalidateQueries({
        queryKey: financesKeys.unifiedMovementsList(data.organization_id, data.project_id || undefined),
      });
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
        queryKey: capitalKeys.withdrawalsList(variables.organizationId, variables.projectId),
      });
      queryClient.invalidateQueries({ queryKey: capitalKeys.unifiedMovements() });
      queryClient.invalidateQueries({
        queryKey: capitalKeys.partnerMovements(variables.organizationId, variables.projectId),
      });
      // Invalidate finances unified movements since withdrawals are part of unified movements
      queryClient.invalidateQueries({
        queryKey: financesKeys.unifiedMovementsList(variables.organizationId, variables.projectId),
      });
    },
  });
}
