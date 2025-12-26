import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getClientRoles,
  getClientRoleById,
  createClientRole,
  updateClientRole,
} from '../services/clientRoles';
import { CLIENT_QUERY_KEYS } from '../constants';
import { apiRequest } from '@/lib/queryClient';
import type { ClientRole } from '../types';
export function useClientRoles(organizationId: string | undefined) {
  return useQuery({
    queryKey: CLIENT_QUERY_KEYS.roles(organizationId),
    queryFn: () => getClientRoles(organizationId!),
    enabled: !!organizationId,
  });
}
export function useClientRole(
  roleId: string | undefined,
  organizationId: string | undefined
) {
  return useQuery({
    queryKey: CLIENT_QUERY_KEYS.role(roleId),
    queryFn: () => getClientRoleById(roleId!, organizationId!),
    enabled: !!roleId && !!organizationId,
  });
}
export function useCreateClientRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      role,
      organizationId,
    }: {
      role: Omit<ClientRole, 'id'| 'created_at'| 'updated_at'| 'organization_id'>;
      organizationId: string;
    }) => createClientRole(role, organizationId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: CLIENT_QUERY_KEYS.roles(data.organization_id),
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/client-roles'],
      });
    },
  });
}
export function useUpdateClientRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      roleId,
      updates,
      organizationId,
    }: {
      roleId: string;
      updates: Partial<Omit<ClientRole, 'id'| 'created_at'| 'updated_at'| 'organization_id'>>;
      organizationId: string;
    }) => updateClientRole(roleId, updates, organizationId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: CLIENT_QUERY_KEYS.roles(data.organization_id),
      });
      queryClient.invalidateQueries({
        queryKey: CLIENT_QUERY_KEYS.role(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/client-roles'],
      });
    },
  });
}
export function useDeleteClientRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      roleId,
    }: {
      roleId: string;
      organizationId: string;
    }) => {
      const response = await apiRequest('DELETE', `/api/client-roles/${roleId}`);
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: CLIENT_QUERY_KEYS.roles(variables.organizationId),
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/client-roles'],
      });
    },
  });
}
