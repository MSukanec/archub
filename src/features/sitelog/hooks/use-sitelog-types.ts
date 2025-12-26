import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSiteLogTypes } from '../services/getSiteLogTypes';
import { createSiteLogType, type CreateSiteLogTypeData } from '../services/createSiteLogType';
import { updateSiteLogType, type UpdateSiteLogTypeData } from '../services/updateSiteLogType';
import { deleteSiteLogType } from '../services/deleteSiteLogType';
import { replaceSiteLogType } from '../services/replaceSiteLogType';

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

/**
 * Hook para eliminar un tipo de bitácora.
 * 
 * ⚠️ CRÍTICO: Recibe organizationId como parámetro para invalidar correctamente el cache.
 * Sin esto, los cambios no se reflejan en la UI sin un refresh F5.
 * 
 * @param organizationId - ID de la organización para cache invalidation
 */
export function useDeleteSiteLogType(organizationId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (typeId: string) => 
      deleteSiteLogType(typeId, organizationId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sitelog-types', organizationId] });
    },
  });
}

/**
 * Hook para reemplazar un tipo de bitácora con otro.
 * 
 * ⚠️ CRÍTICO: Recibe organizationId como parámetro para invalidar correctamente el cache.
 * 
 * @param organizationId - ID de la organización para cache invalidation
 */
export function useReplaceSiteLogType(organizationId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ oldTypeId, newTypeId }: { oldTypeId: string; newTypeId: string }) =>
      replaceSiteLogType(oldTypeId, newTypeId, organizationId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sitelog-types', organizationId] });
    },
  });
}
