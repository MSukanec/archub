/**
 * Convierte un monto de una moneda a otra usando las tasas de cambio
 * @param amount - Monto a convertir
 * @param fromRate - Tasa de cambio de la moneda origen
 * @param toRate - Tasa de cambio de la moneda destino
 * @returns Monto convertido
 * 
 * @example
 * // Si USD tiene rate=1 y ARS tiene rate=1000
 * // Convertir 100 USD a ARS:
 * convertCurrency(100, 1, 1000) // = 100000 ARS
 * 
 * // Convertir 100000 ARS a USD:
 * convertCurrency(100000, 1000, 1) // = 100 USD
 */
export function convertCurrency(
  amount: number,
  fromRate: number,
  toRate: number
): number {
  if (fromRate === 0 || toRate === 0) {
    throw new Error('Las tasas de cambio no pueden ser cero');
  }
  
  // Convertir a moneda base (dividir por fromRate)
  // Luego convertir a moneda destino (multiplicar por toRate)
  return (amount / fromRate) * toRate;
}
