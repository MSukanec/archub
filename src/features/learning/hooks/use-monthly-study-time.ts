import { useQuery } from '@tanstack/react-query';
import { getMonthlyStudyTime } from '../services';
import { LEARNING_QUERY_KEYS } from '../constants';
/**
 * Hook para obtener el tiempo de estudio del mes actual.
 * 
 * Llama al endpoint HTTP que calcula el tiempo de estudio
 * del usuario autenticado en el mes en curso.
 * 
 * El hook está siempre habilitado ya que la autenticación
 * se maneja automáticamente vía Bearer token.
 * 
 * Útil para:
 * - Mostrar estadísticas mensuales en dashboards
 * - Reportes de progreso temporal
 * - Gamificación y logros mensuales
 * 
 * @returns Query con { seconds_this_month: number }
 */
export function useMonthlyStudyTime() {
  return useQuery({
    queryKey: LEARNING_QUERY_KEYS.monthlyStudyTime,
    queryFn: () => getMonthlyStudyTime(),
  });
}
