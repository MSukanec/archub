/**
 * Utilidades globales para formateo de monedas
 * Asegura que SIEMPRE se muestren exactamente 2 decimales en toda la aplicación
 */

/**
 * Formatea un número como moneda con 2 decimales exactos
 * @param amount - El monto a formatear
 * @param symbol - El símbolo de moneda (por defecto '$')
 * @param locale - El locale para formateo (por defecto 'es-AR')
 * @returns String formateado con símbolo y 2 decimales exactos
 */
export function formatCurrency(
  amount: number, 
  symbol: string = '$', 
  locale: string = 'es-AR'
): string {
  const formattedNumber = amount.toLocaleString(locale, { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
  return `${symbol} ${formattedNumber}`;
}

/**
 * Formatea usando Intl.NumberFormat con configuración estándar
 * @param amount - El monto a formatear
 * @param currency - Código de moneda ISO (ARS, USD, etc.)
 * @param locale - El locale para formateo (por defecto 'es-AR')
 * @returns String formateado con símbolo de moneda y 2 decimales exactos
 */
export function formatIntlCurrency(
  amount: number,
  currency: string = 'ARS',
  locale: string = 'es-AR'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Formatea un número con 2 decimales exactos sin símbolo de moneda
 * @param amount - El monto a formatear
 * @param locale - El locale para formateo (por defecto 'es-AR')
 * @returns String formateado con 2 decimales exactos
 */
export function formatNumber(
  amount: number,
  locale: string = 'es-AR'
): string {
  return amount.toLocaleString(locale, { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
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