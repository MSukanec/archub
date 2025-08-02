/**
 * Utilidades globales para formateo de monedas
 * Asegura que NUNCA se muestren decimales en toda la aplicación
 */

/**
 * Formatea un número como moneda sin decimales
 * @param amount - El monto a formatear
 * @param symbol - El símbolo de moneda (por defecto '$')
 * @param locale - El locale para formateo (por defecto 'es-AR')
 * @returns String formateado con símbolo sin decimales
 */
export function formatCurrency(
  amount: number, 
  symbol: string = '$', 
  locale: string = 'es-AR'
): string {
  const formattedNumber = amount.toLocaleString(locale, { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  });
  return `${symbol} ${formattedNumber}`;
}

/**
 * Formatea usando Intl.NumberFormat con configuración estándar
 * @param amount - El monto a formatear
 * @param currency - Código de moneda ISO (ARS, USD, etc.)
 * @param locale - El locale para formateo (por defecto 'es-AR')
 * @returns String formateado con símbolo de moneda sin decimales
 */
export function formatIntlCurrency(
  amount: number,
  currency: string = 'ARS',
  locale: string = 'es-AR'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Formatea un número sin decimales y sin símbolo de moneda
 * @param amount - El monto a formatear
 * @param locale - El locale para formateo (por defecto 'es-AR')
 * @returns String formateado sin decimales
 */
export function formatNumber(
  amount: number,
  locale: string = 'es-AR'
): string {
  return amount.toLocaleString(locale, { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  });
}

/**
 * Formatea porcentajes con 2 decimales exactos
 * @param amount - El valor del porcentaje (0.1234 = 12.34%)
 * @param locale - El locale para formateo (por defecto 'es-AR')
 * @returns String formateado como porcentaje con 2 decimales exactos
 */
export function formatPercentage(
  amount: number,
  locale: string = 'es-AR'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}