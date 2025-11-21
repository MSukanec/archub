import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjectModalities } from '../services/getProjectModalities';
import { createProjectModality, type CreateProjectModalityData } from '../services/createProjectModality';
import { updateProjectModality, type UpdateProjectModalityData } from '../services/updateProjectModality';
import { deleteProjectModality } from '../services/deleteProjectModality';

export function useProjectModalities(organizationId?: string) {
  return useQuery({
    queryKey: ['project-modalities', organizationId],
    queryFn: () => getProjectModalities(organizationId!),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useCreateProjectModality() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProjectModalityData) => createProjectModality(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-modalities', variables.organizationId] });
    },
  });
}

export function useUpdateProjectModality() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ modalityId, organizationId, data }: { 
      modalityId: string; 
      organizationId: string; 
      data: UpdateProjectModalityData 
    }) => updateProjectModality(modalityId, organizationId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-modalities', variables.organizationId] });
    },
  });
}

export function useDeleteProjectModality() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ modalityId, organizationId }: { modalityId: string; organizationId: string }) => 
      deleteProjectModality(modalityId, organizationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-modalities', variables.organizationId] });
    },
  });
}
