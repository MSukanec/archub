import { getCoursePriceBySlug } from '@/lib/getCoursePrice';
import type { CoursePricing } from '../types';
/**
 * Obtiene la información de pricing de un curso.
 * 
 * Usa la función getCoursePrice del sistema unificado de precios:
 * - Lee el precio base en USD desde courses.price
 * - Si la moneda es ARS, convierte usando exchange_rates
 * - Retorna null si el curso no existe o no está activo
 * 
 * @param courseSlug - Slug del curso
 * @param currency - Código de moneda (default: 'ARS')
 * @param provider - Proveedor de pago opcional (ej: 'mercadopago', 'paypal')
 * @returns Información de pricing del curso o null si no existe
 */
export async function getCoursePricing(
  courseSlug: string,
  currency: string = 'ARS',
  provider?: string
): Promise<CoursePricing | null> {
  if (!courseSlug) {
    return null;
  }
  const priceData = await getCoursePriceBySlug(courseSlug, {
    currency,
    provider
  });
  if (!priceData) {
    return null;
  }
  return {
    courseSlug,
    currency: priceData.currency_code,
    provider: priceData.provider || 'default',
    price: priceData.amount,
    originalPrice: undefined,
    discount: undefined,
    discountPct: undefined,
    isOnSale: false
  };
}
