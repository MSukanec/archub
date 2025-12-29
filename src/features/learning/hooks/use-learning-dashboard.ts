import { useQuery } from '@tanstack/react-query';
import { getLearningDashboard } from '../services';
import { learningKeys } from '@/core/query-keys';

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
    queryKey: learningKeys.dashboard(),
    queryFn: () => getLearningDashboard(),
  });
}
