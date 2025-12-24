import { useQuery } from '@tanstack/react-query';
import { useOptimisticMutation } from '@/core/save-engine';
import { projectsKeys } from '@/core/query-keys';
import { getProjectTypes } from '../services/getProjectTypes';
import { createProjectType, type CreateProjectTypeData } from '../services/createProjectType';
import { updateProjectType, type UpdateProjectTypeData } from '../services/updateProjectType';
import { deleteProjectType } from '../services/deleteProjectType';
import { replaceProjectType } from '../services/replaceProjectType';

export function useProjectTypes(organizationId?: string) {
  return useQuery({
    queryKey: projectsKeys.typeList(organizationId),
    queryFn: () => getProjectTypes(organizationId!),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useCreateProjectType(organizationId?: string) {
  return useOptimisticMutation({
    mutationFn: (data: CreateProjectTypeData) => createProjectType(data),
    queryKey: projectsKeys.typeList(organizationId),
    optimisticUpdate: (oldData: any, newType: CreateProjectTypeData) => {
      if (!oldData) return oldData;
      if (!Array.isArray(oldData)) return [{ ...newType, id: 'temp-' + Date.now() }];
      return [...oldData, { ...newType, id: 'temp-' + Date.now() }];
    },
    onSuccessMessage: 'Tipo de proyecto creado',
    onErrorMessage: 'No se pudo crear el tipo de proyecto',
  });
}

export function useUpdateProjectType(organizationId?: string) {
  return useOptimisticMutation({
    mutationFn: ({ typeId, organizationId: orgId, data }: { 
      typeId: string; 
      organizationId: string; 
      data: UpdateProjectTypeData 
    }) => updateProjectType(typeId, orgId, data),
    queryKey: projectsKeys.typeList(organizationId),
    optimisticUpdate: (oldData: any, variables: { typeId: string; data: UpdateProjectTypeData }) => {
      if (!oldData) return oldData;
      if (!Array.isArray(oldData)) return oldData;
      return oldData.map((t: any) => t.id === variables.typeId ? { ...t, ...variables.data } : t);
    },
    onSuccessMessage: 'Tipo de proyecto actualizado',
    onErrorMessage: 'No se pudo actualizar el tipo de proyecto',
  });
}

export function useDeleteProjectType(organizationId?: string) {
  return useOptimisticMutation({
    mutationFn: ({ typeId, organizationId: orgId }: { typeId: string; organizationId: string }) => 
      deleteProjectType(typeId, orgId),
    queryKey: projectsKeys.typeList(organizationId),
    optimisticUpdate: (oldData: any, variables: { typeId: string }) => {
      if (!oldData) return oldData;
      if (!Array.isArray(oldData)) return oldData;
      return oldData.filter((t: any) => t.id !== variables.typeId);
    },
    onSuccessMessage: 'Tipo de proyecto eliminado',
    onErrorMessage: 'No se pudo eliminar el tipo de proyecto',
  });
}

export function useReplaceProjectType(organizationId?: string) {
  return useOptimisticMutation({
    mutationFn: ({ oldTypeId, newTypeId, organizationId: orgId }: { oldTypeId: string; newTypeId: string; organizationId: string }) => 
      replaceProjectType(oldTypeId, newTypeId, orgId),
    queryKey: projectsKeys.typeList(organizationId),
    optimisticUpdate: (oldData: any, variables: { oldTypeId: string }) => {
      if (!oldData) return oldData;
      if (!Array.isArray(oldData)) return oldData;
      return oldData.filter((t: any) => t.id !== variables.oldTypeId);
    },
    onSuccessMessage: 'Tipo de proyecto reemplazado',
    onErrorMessage: 'No se pudo reemplazar el tipo de proyecto',
    additionalQueryKeys: [projectsKeys.lists()],
  });
}
