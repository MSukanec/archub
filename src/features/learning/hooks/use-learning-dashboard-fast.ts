import { useQuery } from '@tanstack/react-query';
import { getLearningDashboardFast } from '../services';
import { learningKeys } from '@/core/query-keys';

/**
 * Hook para obtener una versión optimizada del dashboard de aprendizaje.
 * 
 * Versión más rápida que incluye:
 * - Enrollments con información básica del curso
 * - Actividad reciente
 * 
 * Útil para cargas iniciales rápidas y actualizaciones frecuentes.
 */
export function useLearningDashboardFast() {
  const result = useQuery({
    queryKey: learningKeys.dashboardFast(),
    queryFn: () => getLearningDashboardFast(),
  });
  
  // DEBUG: Log dashboard data
  if (result.data?.courses?.[0]) {
    console.log('[useLearningDashboardFast] First course:', result.data.courses[0]);
  }
  
  return result;
}
