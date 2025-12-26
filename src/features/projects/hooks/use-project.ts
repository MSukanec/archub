import { useQuery } from '@tanstack/react-query';
import { getProjectById } from '../services/getProjectById';
import { projectsKeys } from '@/core/query-keys';
/**
 * Valida si un ID es un UUID válido (no temporal)
 */
function isValidUUID(id: string | undefined): boolean {
  if (!id) return false;
  // Temporal IDs start with 'temp-', real UUIDs are 8-4-4-4-12 hex format
  if (id.startsWith('temp-')) return false;
  // Basic UUID validation: 36 chars, 8-4-4-4-12 hex pattern
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}
/**
 * Hook para obtener un proyecto específico por ID.
 * 
 * Usa React Query para cachear y gestionar el estado de la petición.
 * Los datos incluyen project_data con tipos y modalidades.
 * 
 * Nota: Solo hace queries si el ID es un UUID válido (no ID temporal).
 * 
 * @param projectId - ID del proyecto
 * @returns Query con el proyecto o null
 */
export function useProject(projectId: string | undefined) {
  const isValid = isValidUUID(projectId);
  
  return useQuery({
    queryKey: projectsKeys.detail(projectId),
    queryFn: () => getProjectById(projectId!),
    enabled: isValid,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
