import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjectTypes } from '../services/getProjectTypes';
import { createProjectType, type CreateProjectTypeData } from '../services/createProjectType';
import { updateProjectType, type UpdateProjectTypeData } from '../services/updateProjectType';
import { deleteProjectType } from '../services/deleteProjectType';
import { replaceProjectType } from '../services/replaceProjectType';

export function useProjectTypes(organizationId?: string) {
  return useQuery({
    queryKey: ['project-types', organizationId],
    queryFn: () => getProjectTypes(organizationId!),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useCreateProjectType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProjectTypeData) => createProjectType(data),
    onSuccess: (newType, variables) => {
      // ✅ ACTUALIZAR CACHE DIRECTAMENTE (NO invalidar para evitar flicker)
      queryClient.setQueryData(
        ['project-types', variables.organizationId],
        (oldData: any) => {
          if (!Array.isArray(oldData)) return [newType];
          return [...oldData, newType];
        }
      );
    },
  });
}

export function useUpdateProjectType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ typeId, organizationId, data }: { 
      typeId: string; 
      organizationId: string; 
      data: UpdateProjectTypeData 
    }) => updateProjectType(typeId, organizationId, data),
    onSuccess: (updatedType, variables) => {
      // ✅ ACTUALIZAR CACHE DIRECTAMENTE (NO invalidar para evitar flicker)
      queryClient.setQueryData(
        ['project-types', variables.organizationId],
        (oldData: any) => {
          if (!Array.isArray(oldData)) return oldData;
          return oldData.map((t: any) => t.id === variables.typeId ? updatedType : t);
        }
      );
    },
  });
}

export function useDeleteProjectType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ typeId, organizationId }: { typeId: string; organizationId: string }) => 
      deleteProjectType(typeId, organizationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-types', variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ['project-types'] });
    },
  });
}

export function useReplaceProjectType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ oldTypeId, newTypeId, organizationId }: { oldTypeId: string; newTypeId: string; organizationId: string }) => 
      replaceProjectType(oldTypeId, newTypeId, organizationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-types', variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ['project-types'] });
      queryClient.invalidateQueries({ queryKey: ['projects', variables.organizationId] });
    },
  });
}
