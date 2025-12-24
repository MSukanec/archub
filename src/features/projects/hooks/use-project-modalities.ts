import { useQuery } from '@tanstack/react-query';
import { useOptimisticMutation } from '@/core/save-engine';
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
  return useOptimisticMutation({
    mutationFn: (data: CreateProjectModalityData) => createProjectModality(data),
    queryKey: ['project-modalities'],
    optimisticUpdate: (oldData: any, newModality: CreateProjectModalityData) => {
      if (!oldData) return oldData;
      if (!Array.isArray(oldData)) return [{ ...newModality, id: 'temp-' + Date.now() }];
      return [...oldData, { ...newModality, id: 'temp-' + Date.now() }];
    },
    onSuccessMessage: 'Modalidad de proyecto creada',
    onErrorMessage: 'No se pudo crear la modalidad de proyecto',
  });
}

export function useUpdateProjectModality() {
  return useOptimisticMutation({
    mutationFn: ({ modalityId, organizationId, data }: { 
      modalityId: string; 
      organizationId: string; 
      data: UpdateProjectModalityData 
    }) => updateProjectModality(modalityId, organizationId, data),
    queryKey: ['project-modalities'],
    optimisticUpdate: (oldData: any, variables: { modalityId: string; data: UpdateProjectModalityData }) => {
      if (!oldData) return oldData;
      if (!Array.isArray(oldData)) return oldData;
      return oldData.map((m: any) => m.id === variables.modalityId ? { ...m, ...variables.data } : m);
    },
    onSuccessMessage: 'Modalidad de proyecto actualizada',
    onErrorMessage: 'No se pudo actualizar la modalidad de proyecto',
  });
}

export function useDeleteProjectModality() {
  return useOptimisticMutation({
    mutationFn: ({ modalityId, organizationId }: { modalityId: string; organizationId: string }) => 
      deleteProjectModality(modalityId, organizationId),
    queryKey: ['project-modalities'],
    optimisticUpdate: (oldData: any, variables: { modalityId: string }) => {
      if (!oldData) return oldData;
      if (!Array.isArray(oldData)) return oldData;
      return oldData.filter((m: any) => m.id !== variables.modalityId);
    },
    onSuccessMessage: 'Modalidad de proyecto eliminada',
    onErrorMessage: 'No se pudo eliminar la modalidad de proyecto',
  });
}

export function useReplaceProjectModality() {
  return useOptimisticMutation({
    mutationFn: ({ oldModalityId, newModalityId, organizationId }: { oldModalityId: string; newModalityId: string; organizationId: string }) => 
      replaceProjectModality(oldModalityId, newModalityId, organizationId),
    queryKey: ['project-modalities'],
    optimisticUpdate: (oldData: any, variables: { oldModalityId: string }) => {
      if (!oldData) return oldData;
      if (!Array.isArray(oldData)) return oldData;
      return oldData.filter((m: any) => m.id !== variables.oldModalityId);
    },
    onSuccessMessage: 'Modalidad de proyecto reemplazada',
    onErrorMessage: 'No se pudo reemplazar la modalidad de proyecto',
    additionalQueryKeys: [['projects']],
  });
}
