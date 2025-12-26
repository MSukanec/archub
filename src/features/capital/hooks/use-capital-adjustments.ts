import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCapitalAdjustments,
  getCapitalAdjustmentById,
} from '../services/getCapitalAdjustments';
import { createCapitalAdjustment } from '../services/createCapitalAdjustment';
import { updateCapitalAdjustment } from '../services/updateCapitalAdjustment';
import { deleteCapitalAdjustment } from '../services/deleteCapitalAdjustment';
import { capitalKeys } from '@/core/query-keys';
import type { CapitalAdjustment, CapitalAdjustmentCreateInput, CapitalAdjustmentUpdateInput } from '../types';
export function useCapitalAdjustments(
  organizationId: string | undefined,
  projectId?: string
) {
  return useQuery<CapitalAdjustment[]>({
    queryKey: capitalKeys.adjustmentsList(organizationId || '', projectId),
    queryFn: () => getCapitalAdjustments(organizationId!, projectId),
    enabled: !!organizationId,
  });
}
export function useCapitalAdjustment(
  adjustmentId: string | undefined,
  organizationId: string | undefined
) {
  return useQuery<CapitalAdjustment | null>({
    queryKey: capitalKeys.adjustment(adjustmentId || ''),
    queryFn: () => getCapitalAdjustmentById(adjustmentId!, organizationId!),
    enabled: !!adjustmentId && !!organizationId,
  });
}
export function useCreateCapitalAdjustment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CapitalAdjustmentCreateInput) => createCapitalAdjustment(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: capitalKeys.adjustmentsList(data.organization_id, data.project_id || undefined),
      });
      queryClient.invalidateQueries({ queryKey: capitalKeys.unifiedMovements() });
      queryClient.invalidateQueries({ queryKey: capitalKeys.partnerMovements(data.organization_id, data.project_id) });
    },
  });
}
export function useUpdateCapitalAdjustment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      adjustmentId,
      updates,
      organizationId,
    }: {
      adjustmentId: string;
      updates: CapitalAdjustmentUpdateInput;
      organizationId: string;
    }) => updateCapitalAdjustment(adjustmentId, updates, organizationId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: capitalKeys.adjustmentsList(data.organization_id, data.project_id || undefined),
      });
      queryClient.invalidateQueries({
        queryKey: capitalKeys.adjustment(data.id),
      });
      queryClient.invalidateQueries({ queryKey: capitalKeys.unifiedMovements() });
      queryClient.invalidateQueries({ queryKey: capitalKeys.partnerMovements(data.organization_id, data.project_id) });
    },
  });
}
export function useDeleteCapitalAdjustment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      adjustmentId,
      organizationId,
      projectId,
    }: {
      adjustmentId: string;
      organizationId: string;
      projectId?: string;
    }) => deleteCapitalAdjustment(adjustmentId, organizationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: capitalKeys.adjustmentsList(variables.organizationId, variables.projectId),
      });
      queryClient.invalidateQueries({ queryKey: capitalKeys.unifiedMovements() });
      queryClient.invalidateQueries({
        queryKey: capitalKeys.partnerMovements(variables.organizationId, variables.projectId),
      });
    },
  });
}
