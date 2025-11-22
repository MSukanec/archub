import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getClientCommitments,
  getClientCommitmentById,
  createClientCommitment,
  updateClientCommitment,
  deleteClientCommitment,
} from '../services/clientCommitments';
import { CLIENT_QUERY_KEYS } from '../constants';
import type { ClientCommitment } from '../types';

export function useClientCommitments(
  projectId: string | undefined,
  organizationId: string | undefined
) {
  return useQuery({
    queryKey: CLIENT_QUERY_KEYS.commitments(projectId),
    queryFn: () => getClientCommitments(projectId!, organizationId!),
    enabled: !!projectId && !!organizationId,
  });
}

export function useClientCommitment(
  commitmentId: string | undefined,
  organizationId: string | undefined
) {
  return useQuery({
    queryKey: CLIENT_QUERY_KEYS.commitment(commitmentId),
    queryFn: () => getClientCommitmentById(commitmentId!, organizationId!),
    enabled: !!commitmentId && !!organizationId,
  });
}

export function useCreateClientCommitment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      commitment,
      projectId,
      organizationId,
      createdBy,
    }: {
      commitment: Omit<ClientCommitment, 'id' | 'created_at' | 'updated_at' | 'project_id' | 'organization_id' | 'created_by' | 'is_deleted' | 'deleted_at'>;
      projectId: string;
      organizationId: string;
      createdBy: string;
    }) => createClientCommitment(commitment, projectId, organizationId, createdBy),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: CLIENT_QUERY_KEYS.commitments(data.project_id),
      });
      queryClient.invalidateQueries({
        queryKey: CLIENT_QUERY_KEYS.dashboard(data.project_id),
      });
    },
  });
}

export function useUpdateClientCommitment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      commitmentId,
      updates,
      organizationId,
    }: {
      commitmentId: string;
      updates: Partial<Omit<ClientCommitment, 'id' | 'created_at' | 'updated_at' | 'project_id' | 'organization_id' | 'created_by' | 'is_deleted' | 'deleted_at'>>;
      organizationId: string;
    }) => updateClientCommitment(commitmentId, updates, organizationId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: CLIENT_QUERY_KEYS.commitments(data.project_id),
      });
      queryClient.invalidateQueries({
        queryKey: CLIENT_QUERY_KEYS.commitment(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: CLIENT_QUERY_KEYS.dashboard(data.project_id),
      });
    },
  });
}

export function useDeleteClientCommitment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      commitmentId,
      organizationId,
      projectId,
    }: {
      commitmentId: string;
      organizationId: string;
      projectId: string;
    }) => deleteClientCommitment(commitmentId, organizationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: CLIENT_QUERY_KEYS.commitments(variables.projectId),
      });
      queryClient.invalidateQueries({
        queryKey: CLIENT_QUERY_KEYS.schedule(variables.projectId),
      });
      queryClient.invalidateQueries({
        queryKey: CLIENT_QUERY_KEYS.dashboard(variables.projectId),
      });
    },
  });
}
