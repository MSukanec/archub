/**
 * Formatea un monto con símbolo de moneda
 * @param amount - Monto numérico
 * @param symbol - Símbolo de moneda (ej: "$", "USD")
 * @param code - Código de moneda opcional (ej: "ARS", "USD")
 * @returns String formateado con separadores de miles
 */
export function formatCurrency(amount: number, symbol: string, code?: string): string {
  const formattedAmount = amount.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  if (code) {
    return `${symbol}${formattedAmount} ${code}`;
  }
  
  return `${symbol}${formattedAmount}`;
}

/**
 * Formatea un rango de fechas en español
 * @param start - Fecha de inicio en formato YYYY-MM-DD
 * @param end - Fecha de fin en formato YYYY-MM-DD
 * @returns String formateado en español
 */
export function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  const formatOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  };
  
  const formattedStart = startDate.toLocaleDateString('es-AR', formatOptions);
  const formattedEnd = endDate.toLocaleDateString('es-AR', formatOptions);
  
  if (start === end) {
    return formattedStart;
  }
  
  return `${formattedStart} - ${formattedEnd}`;
}

/**
 * Formatea el conteo de movimientos con pluralización correcta
 * @param count - Número de movimientos
 * @returns String formateado con pluralización
 */
export function formatMovementCount(count: number): string {
  if (count === 0) {
    return 'sin movimientos';
  }
  if (count === 1) {
    return '1 movimiento';
  }
  return `${count} movimientos`;
}
