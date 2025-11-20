import { useQuery } from '@tanstack/react-query';
import { getLearningDashboard } from '../services';
import { LEARNING_QUERY_KEYS } from '../constants';

/**
 * Hook para obtener el dashboard de aprendizaje del usuario.
 * 
 * Incluye:
 * - Cursos en los que está inscrito
 * - Completaciones recientes
 * - Lecciones favoritas
 * - Progreso general
 * 
 * El service getLearningDashboard maneja la autenticación internamente.
 */
export function useLearningDashboard() {
  return useQuery({
    queryKey: LEARNING_QUERY_KEYS.dashboard,
    queryFn: () => getLearningDashboard(),
  });
}
