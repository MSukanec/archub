import { useQuery } from '@tanstack/react-query';
import { getLearningDashboardFast } from '../services';
import { LEARNING_QUERY_KEYS } from '../constants';

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
  return useQuery({
    queryKey: LEARNING_QUERY_KEYS.dashboardFast,
    queryFn: () => getLearningDashboardFast(),
  });
}
