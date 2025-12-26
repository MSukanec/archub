import { useQuery } from '@tanstack/react-query';
import { getProjects } from '../services/getProjects';
import { projectsKeys } from '@/core/query-keys';
import type { Project } from '../types';
type ProjectsMap = Record<string, { id: string; name: string; color: string | null }>;
/**
 * Hook para obtener un mapa de proyectos con colores.
 * Usado en la tabla de movimientos en modo GENERAL.
 * 
 * IMPORTANTE: Deriva del mismo cache base que useProjects usando `select`.
 * Esto garantiza sincronización automática cuando cualquier mutación actualiza el cache.
 * 
 * @param organizationId - ID de la organización
 * @returns Query con mapa de proyectos (id -> {id, name, color})
 */
export function useProjectsMap(organizationId: string | undefined) {
  return useQuery({
    queryKey: projectsKeys.list(organizationId),
    queryFn: () => getProjects(organizationId!),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
    select: (projects: Project[] | undefined): ProjectsMap => {
      const projectsMap: ProjectsMap = {};
      
      (projects ?? [])
        .filter((p: Project) => p.is_active && !p.is_deleted)
        .forEach((project: Project) => {
          projectsMap[project.id] = {
            id: project.id,
            name: project.name || '',
            color: project.color ?? null
          };
        });
      
      return projectsMap;
    },
  });
}
