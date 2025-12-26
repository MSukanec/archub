import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getPartnerContributions, 
  getPartnerContributionById 
} from '../services/getPartnerContributions';
import { createPartnerContribution } from '../services/createPartnerContribution';
import { updatePartnerContribution } from '../services/updatePartnerContribution';
import { deletePartnerContribution } from '../services/deletePartnerContribution';
import { capitalKeys } from '@/core/query-keys';
import type { PartnerContribution, PartnerContributionCreateInput } from '../types';

export function usePartnerContributions(
  organizationId: string | undefined,
  projectId?: string
) {
  return useQuery<PartnerContribution[]>({
    queryKey: capitalKeys.contributionsList(organizationId || '', projectId),
    queryFn: () => getPartnerContributions(organizationId!, projectId),
    enabled: !!organizationId,
  });
}

export function usePartnerContribution(
  contributionId: string | undefined,
  organizationId: string | undefined
) {
  return useQuery<PartnerContribution | null>({
    queryKey: capitalKeys.contribution(contributionId || ''),
    queryFn: () => getPartnerContributionById(contributionId!, organizationId!),
    enabled: !!contributionId && !!organizationId,
  });
}

export function useCreatePartnerContribution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: PartnerContributionCreateInput) => createPartnerContribution(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: capitalKeys.contributionsList(data.organization_id, data.project_id || undefined),
      });
      queryClient.invalidateQueries({ queryKey: capitalKeys.unifiedMovements() });
      queryClient.invalidateQueries({ queryKey: capitalKeys.partnerMovements(data.organization_id, data.project_id) });
    },
  });
}

export function useUpdatePartnerContribution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      contributionId,
      updates,
      organizationId,
    }: {
      contributionId: string;
      updates: Partial<Omit<PartnerContribution, 'id' | 'created_at' | 'organization_id' | 'created_by'>>;
      organizationId: string;
    }) => updatePartnerContribution(contributionId, updates, organizationId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: capitalKeys.contributionsList(data.organization_id, data.project_id || undefined),
      });
      queryClient.invalidateQueries({
        queryKey: capitalKeys.contribution(data.id),
      });
      queryClient.invalidateQueries({ queryKey: capitalKeys.unifiedMovements() });
      queryClient.invalidateQueries({ queryKey: capitalKeys.partnerMovements(data.organization_id, data.project_id) });
    },
  });
}

export function useDeletePartnerContribution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      contributionId,
      organizationId,
    }: {
      contributionId: string;
      organizationId: string;
      projectId?: string;
    }) => deletePartnerContribution(contributionId, organizationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: capitalKeys.contributionsList(variables.organizationId, variables.projectId),
      });
      queryClient.invalidateQueries({ queryKey: capitalKeys.unifiedMovements() });
      queryClient.invalidateQueries({
        queryKey: capitalKeys.partnerMovements(variables.organizationId, variables.projectId),
      });
    },
  });
}
