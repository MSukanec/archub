import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSiteLogTypes } from '../services/getSiteLogTypes';
import { createSiteLogType, type CreateSiteLogTypeData } from '../services/createSiteLogType';
import { updateSiteLogType, type UpdateSiteLogTypeData } from '../services/updateSiteLogType';
import { deleteSiteLogType } from '../services/deleteSiteLogType';

export function useSiteLogTypes(organizationId?: string) {
  return useQuery({
    queryKey: ['sitelog-types', organizationId],
    queryFn: () => getSiteLogTypes(organizationId!),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useCreateSiteLogType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSiteLogTypeData) => createSiteLogType(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sitelog-types', variables.organizationId] });
    },
  });
}

export function useUpdateSiteLogType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ typeId, organizationId, data }: { 
      typeId: string; 
      organizationId: string; 
      data: UpdateSiteLogTypeData 
    }) => updateSiteLogType(typeId, organizationId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sitelog-types', variables.organizationId] });
    },
  });
}

export function useDeleteSiteLogType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ typeId, organizationId }: { typeId: string; organizationId: string }) => 
      deleteSiteLogType(typeId, organizationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sitelog-types', variables.organizationId] });
    },
  });
}
