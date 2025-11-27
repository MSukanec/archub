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
      role: Omit<ClientRole, 'id' | 'created_at' | 'updated_at' | 'organization_id'>;
      organizationId: string;
    }) => createClientRole(role, organizationId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: CLIENT_QUERY_KEYS.roles(data.organization_id),
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
      updates: Partial<Omit<ClientRole, 'id' | 'created_at' | 'updated_at' | 'organization_id'>>;
      organizationId: string;
    }) => updateClientRole(roleId, updates, organizationId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: CLIENT_QUERY_KEYS.roles(data.organization_id),
      });
      queryClient.invalidateQueries({
        queryKey: CLIENT_QUERY_KEYS.role(data.id),
      });
    },
  });
}

export function useDeleteClientRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      roleId,
      organizationId,
    }: {
      roleId: string;
      organizationId: string;
    }) => {
      console.log('[useDeleteClientRole] Starting delete for role:', roleId);
      try {
        const response = await apiRequest('DELETE', `/api/client-roles/${roleId}`);
        console.log('[useDeleteClientRole] Response:', response);
        const result = await response.json();
        console.log('[useDeleteClientRole] Result:', result);
        return result;
      } catch (error) {
        console.error('[useDeleteClientRole] Error:', error);
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      console.log('[useDeleteClientRole] onSuccess called');
      queryClient.invalidateQueries({
        queryKey: CLIENT_QUERY_KEYS.roles(variables.organizationId),
      });
    },
    onError: (error) => {
      console.error('[useDeleteClientRole] onError called:', error);
    },
  });
}
