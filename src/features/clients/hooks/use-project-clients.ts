import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getProjectClients,
  getProjectClientById,
  createProjectClient,
  updateProjectClient,
  deleteProjectClient,
} from '../services/projectClients';
import { CLIENT_QUERY_KEYS } from '../constants';
import type { ProjectClient, ProjectClientWithRelations } from '../types';
export function useProjectClients(
  projectId: string | undefined,
  organizationId: string | undefined
) {
  return useQuery({
    queryKey: CLIENT_QUERY_KEYS.projectClients(projectId),
    queryFn: () => getProjectClients(projectId!, organizationId!),
    enabled: !!projectId && !!organizationId,
  });
}
export function useProjectClient(
  projectId: string | undefined,
  clientId: string | undefined,
  organizationId: string | undefined
) {
  return useQuery({
    queryKey: CLIENT_QUERY_KEYS.projectClient(projectId, clientId, organizationId),
    queryFn: () => getProjectClientById(clientId!, organizationId!),
    enabled: !!projectId && !!clientId && !!organizationId,
  });
}
export function useCreateProjectClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectClient,
      projectId,
      organizationId,
      createdBy,
    }: {
      projectClient: Omit<ProjectClient, 'id'| 'created_at'| 'updated_at'| 'project_id'| 'organization_id'| 'created_by'>;
      projectId: string;
      organizationId: string;
      createdBy: string;
    }) => createProjectClient(projectClient, projectId, organizationId, createdBy),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: CLIENT_QUERY_KEYS.projectClients(data.project_id),
      });
      queryClient.invalidateQueries({
        queryKey: CLIENT_QUERY_KEYS.dashboard(data.project_id),
      });
    },
  });
}
export function useUpdateProjectClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      clientId,
      updates,
      organizationId,
    }: {
      clientId: string;
      updates: Partial<Omit<ProjectClient, 'id'| 'created_at'| 'updated_at'| 'project_id'| 'organization_id'| 'created_by'>>;
      organizationId: string;
    }) => updateProjectClient(clientId, updates, organizationId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: CLIENT_QUERY_KEYS.projectClients(data.project_id),
      });
      queryClient.invalidateQueries({
        queryKey: CLIENT_QUERY_KEYS.projectClient(data.project_id, data.id, data.organization_id),
      });
      queryClient.invalidateQueries({
        queryKey: CLIENT_QUERY_KEYS.dashboard(data.project_id),
      });
    },
  });
}
export function useDeleteProjectClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      clientId,
      organizationId,
      projectId,
    }: {
      clientId: string;
      organizationId: string;
      projectId: string;
    }) => deleteProjectClient(clientId, organizationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: CLIENT_QUERY_KEYS.projectClients(variables.projectId),
      });
      queryClient.invalidateQueries({
        queryKey: CLIENT_QUERY_KEYS.dashboard(variables.projectId),
      });
    },
  });
}
