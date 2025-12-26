import { useQuery } from '@tanstack/react-query';
import { getCoursePricing } from '../services';
import { LEARNING_QUERY_KEYS } from '../constants';

/**
 * Hook para obtener la información de pricing de un curso.
 * 
 * Usa la función getCoursePrice del sistema unificado de precios:
 * - Lee el precio base en USD desde courses.price
 * - Si la moneda es ARS, convierte usando exchange_rates
 * - Retorna null si el curso no existe o no está activo
 */
export function useCoursePricing(
  courseSlug: string | undefined,
  currency: string = 'ARS',
  provider?: string
) {
  return useQuery({
    queryKey: LEARNING_QUERY_KEYS.coursePricing(courseSlug!, currency, provider),
    queryFn: () => getCoursePricing(courseSlug!, currency, provider),
    enabled: !!courseSlug,
  });
}
