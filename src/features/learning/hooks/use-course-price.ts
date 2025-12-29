import { useQuery } from '@tanstack/react-query';
import { getCoursePricing } from '../services/student/getCoursePricing';
import { learningKeys } from '@/core/query-keys';
import type { CoursePricing } from '../types';

/**
 * Parámetros del hook useCoursePriceQuery
 */
interface UseCoursePriceParams {
  /**
   * Slug del curso (requerido)
   */
  courseSlug: string;
  
  /**
   * Código de moneda ISO (default: 'ARS')
   * Ejemplos: 'USD', 'ARS', 'EUR'
   */
  currency?: string;
  
  /**
   * Proveedor de pago (opcional)
   * Ejemplos: 'mercadopago', 'paypal', 'stripe'
   */
  provider?: string;
}

/**
 * Hook para obtener el precio de un curso.
 * 
 * Utiliza el servicio `getCoursePricing` que:
 * - Lee el precio base en USD desde `courses.price`
 * - Si la moneda es ARS, convierte usando `exchange_rates`
 * - Retorna null si el curso no existe o no está activo
 * 
 * **Características:**
 * - Conversión automática de moneda
 * - Soporte para múltiples proveedores de pago
 * - Cache automático con React Query
 * - Refetch al cambiar slug, moneda o proveedor
 * 
 * **Casos de uso:**
 * - Mostrar precio en páginas de curso
 * - Checkout y pasarelas de pago
 * - Comparación de precios entre proveedores
 * 
 * @param params - Parámetros del hook
 * @param params.courseSlug - Slug del curso (requerido)
 * @param params.currency - Código de moneda (default: 'ARS')
 * @param params.provider - Proveedor de pago (opcional)
 * 
 * @returns Query con datos de pricing del curso
 * 
 * @example
 * ```tsx
 * // Precio básico en ARS
 * function CoursePriceDisplay({ slug }: { slug: string }) {
 *   const { data, isLoading, error } = useCoursePrice({ 
 *     courseSlug: slug 
 *   });
 * 
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <ErrorMessage />;
 *   if (!data) return <span>Precio no disponible</span>;
 * 
 *   return <span>${data.price} {data.currency}</span>;
 * }
 * ```
 * 
 * @example
 * ```tsx
 * // Precio con proveedor específico
 * function CheckoutPrice({ slug }: { slug: string }) {
 *   const { data, isLoading } = useCoursePrice({
 *     courseSlug: slug,
 *     currency: 'USD',
 *     provider: 'paypal'
 *   });
 * 
 *   return (
 *     <div>
 *       {isLoading ? (
 *         <Spinner />
 *       ) : (
 *         <div>
 *           <h3>Precio: ${data?.price} {data?.currency}</h3>
 *           {data?.isOnSale && (
 *             <p>Original: ${data.originalPrice}</p>
 *           )}
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useCoursePrice({
  courseSlug,
  currency = 'ARS',
  provider
}: UseCoursePriceParams) {
  return useQuery<CoursePricing | null>({
    queryKey: learningKeys.coursePrice(courseSlug, currency, provider),
    queryFn: async () => {
      if (!courseSlug) {
        return null;
      }
      
      return await getCoursePricing(courseSlug, currency, provider);
    },
    enabled: !!courseSlug,
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });
}
