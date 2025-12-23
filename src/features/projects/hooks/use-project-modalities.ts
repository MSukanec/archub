import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjectModalities } from '../services/getProjectModalities';
import { createProjectModality, type CreateProjectModalityData } from '../services/createProjectModality';
import { updateProjectModality, type UpdateProjectModalityData } from '../services/updateProjectModality';
import { deleteProjectModality } from '../services/deleteProjectModality';
import { replaceProjectModality } from '../services/replaceProjectModality';

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
    onSuccess: (newModality, variables) => {
      // ✅ ACTUALIZAR CACHE DIRECTAMENTE (NO invalidar para evitar flicker)
      queryClient.setQueryData(
        ['project-modalities', variables.organizationId],
        (oldData: any) => {
          if (!Array.isArray(oldData)) return [newModality];
          return [...oldData, newModality];
        }
      );
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
    onSuccess: (updatedModality, variables) => {
      // ✅ ACTUALIZAR CACHE DIRECTAMENTE (NO invalidar para evitar flicker)
      queryClient.setQueryData(
        ['project-modalities', variables.organizationId],
        (oldData: any) => {
          if (!Array.isArray(oldData)) return oldData;
          return oldData.map((m: any) => m.id === variables.modalityId ? updatedModality : m);
        }
      );
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
      queryClient.invalidateQueries({ queryKey: ['project-modalities'] });
    },
  });
}

export function useReplaceProjectModality() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ oldModalityId, newModalityId, organizationId }: { oldModalityId: string; newModalityId: string; organizationId: string }) => 
      replaceProjectModality(oldModalityId, newModalityId, organizationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-modalities', variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ['project-modalities'] });
      queryClient.invalidateQueries({ queryKey: ['projects', variables.organizationId] });
    },
  });
}
