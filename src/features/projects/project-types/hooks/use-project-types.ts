import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjectTypes } from '../services/getProjectTypes';
import { createProjectType, type CreateProjectTypeData } from '../services/createProjectType';
import { updateProjectType, type UpdateProjectTypeData } from '../services/updateProjectType';
import { deleteProjectType } from '../services/deleteProjectType';

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
    onSuccess: (_, variables) => {
      // Invalidar query con organizationId (feature hook)
      queryClient.invalidateQueries({ queryKey: ['project-types', variables.organizationId] });
      // Invalidar query legacy (sin organizationId) usada en modales
      queryClient.invalidateQueries({ queryKey: ['project-types'] });
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
    onSuccess: (_, variables) => {
      // Invalidar query con organizationId (feature hook)
      queryClient.invalidateQueries({ queryKey: ['project-types', variables.organizationId] });
      // Invalidar query legacy (sin organizationId) usada en modales
      queryClient.invalidateQueries({ queryKey: ['project-types'] });
    },
  });
}

export function useDeleteProjectType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ typeId, organizationId }: { typeId: string; organizationId: string }) => 
      deleteProjectType(typeId, organizationId),
    onSuccess: (_, variables) => {
      // Invalidar query con organizationId (feature hook)
      queryClient.invalidateQueries({ queryKey: ['project-types', variables.organizationId] });
      // Invalidar query legacy (sin organizationId) usada en modales
      queryClient.invalidateQueries({ queryKey: ['project-types'] });
    },
  });
}
