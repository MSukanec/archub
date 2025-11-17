import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getClientPaymentSchedule,
  getClientPaymentScheduleById,
  createClientPaymentSchedule,
  updateClientPaymentSchedule,
  deleteClientPaymentSchedule,
} from '../services/clientPaymentSchedule';
import { CLIENT_QUERY_KEYS } from '../constants';
import type { ClientPaymentSchedule } from '../types';

export function useClientPaymentSchedule(
  projectId: string | undefined,
  organizationId: string | undefined
) {
  return useQuery({
    queryKey: CLIENT_QUERY_KEYS.schedule(projectId),
    queryFn: () => getClientPaymentSchedule(projectId!, organizationId!),
    enabled: !!projectId && !!organizationId,
  });
}

export function useClientPaymentScheduleItem(
  scheduleId: string | undefined,
  organizationId: string | undefined
) {
  return useQuery({
    queryKey: CLIENT_QUERY_KEYS.scheduleItem(scheduleId),
    queryFn: () => getClientPaymentScheduleById(scheduleId!, organizationId!),
    enabled: !!scheduleId && !!organizationId,
  });
}

export function useCreateClientPaymentSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      schedule,
      projectId,
      organizationId,
      createdBy,
    }: {
      schedule: Omit<ClientPaymentSchedule, 'id' | 'created_at' | 'updated_at' | 'project_id' | 'organization_id' | 'created_by'>;
      projectId: string;
      organizationId: string;
      createdBy: string;
    }) => createClientPaymentSchedule(schedule, projectId, organizationId, createdBy),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: CLIENT_QUERY_KEYS.schedule(data.project_id),
      });
      queryClient.invalidateQueries({
        queryKey: CLIENT_QUERY_KEYS.dashboard(data.project_id),
      });
    },
  });
}

export function useUpdateClientPaymentSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      scheduleId,
      updates,
      organizationId,
    }: {
      scheduleId: string;
      updates: Partial<Omit<ClientPaymentSchedule, 'id' | 'created_at' | 'updated_at' | 'project_id' | 'organization_id' | 'created_by'>>;
      organizationId: string;
    }) => updateClientPaymentSchedule(scheduleId, updates, organizationId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: CLIENT_QUERY_KEYS.schedule(data.project_id),
      });
      queryClient.invalidateQueries({
        queryKey: CLIENT_QUERY_KEYS.scheduleItem(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: CLIENT_QUERY_KEYS.dashboard(data.project_id),
      });
    },
  });
}

export function useDeleteClientPaymentSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      scheduleId,
      organizationId,
      projectId,
    }: {
      scheduleId: string;
      organizationId: string;
      projectId: string;
    }) => deleteClientPaymentSchedule(scheduleId, organizationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: CLIENT_QUERY_KEYS.schedule(variables.projectId),
      });
      queryClient.invalidateQueries({
        queryKey: CLIENT_QUERY_KEYS.dashboard(variables.projectId),
      });
    },
  });
}
