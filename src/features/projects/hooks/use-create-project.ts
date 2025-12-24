import { useOptimisticMutation } from '@/core/save-engine';
import { createProject } from '../services/createProject';
import type { CreateProjectData } from '../types';
import { QUERY_KEYS } from '../constants';

export function useCreateProject() {
  return useOptimisticMutation({
    mutationFn: (data: CreateProjectData) => createProject(data),
    queryKey: [QUERY_KEYS.PROJECTS],
    optimisticUpdate: (oldData: any, newProject: CreateProjectData) => {
      if (!oldData) return oldData;
      if (!Array.isArray(oldData)) return oldData;
      return [...oldData, { ...newProject, id: 'temp-' + Date.now() }];
    },
    onSuccessMessage: 'Proyecto creado',
    onErrorMessage: 'No se pudo crear el proyecto',
    additionalQueryKeys: [
      [QUERY_KEYS.PROJECTS_LITE],
      [QUERY_KEYS.PROJECTS_MAP],
      ['user-data'],
      ['user-organization-preferences'],
      ['current-user'],
    ],
  });
}
