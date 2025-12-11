/**
 * /lib/money.ts
 * 
 * Módulo centralizado para el manejo de multimoneda en Seencel.
 * 
 * REGLA CENTRAL DEL SISTEMA MULTIMONEDA:
 * - Nunca se guardan columnas precalculadas (amount_converted).
 * - Cada movimiento guarda: amount, currency_id, exchange_rate, created_at.
 * - Las conversiones se calculan: amount_in_base = amount * exchange_rate.
 * 
 * @module money
 */

export interface MoneyItem {
  amount: number;
  currency_id?: string;
  currency?: {
    id?: string;
    code?: string;
    symbol?: string;
    name?: string;
  } | null;
  exchange_rate?: number | null;
}

export interface CurrencyBreakdown {
  currencyId: string;
  currencyCode: string;
  currencySymbol: string;
  currencyName?: string;
  total: number;
  count: number;
}

export interface BreakdownResult {
  baseTotal: number;
  breakdown: CurrencyBreakdown[];
  breakdownMap: Record<string, number>;
}

export interface ConvertOptions {
  direction?: 'multiply' | 'divide';
  defaultRate?: number;
}

/**
 * Convierte un monto a la moneda base de la organización.
 * 
 * Regla: amount_in_base = amount * exchange_rate
 * 
 * @param amount - Monto original
 * @param exchangeRate - Cotización del momento del movimiento
 * @param options - Opciones de conversión
 * @returns Monto convertido a moneda base
 * 
 * @example
 * // Convertir 100 USD a ARS con cotización 1000
 * convert(100, 1000) // => 100000
 */
export function convert(
  amount: number,
  exchangeRate?: number | null,
  options: ConvertOptions = {}
): number {
  const { direction = 'multiply', defaultRate = 1 } = options;
  const rate = exchangeRate ?? defaultRate;
  
  if (rate === 0) return amount;
  
  return direction === 'multiply' 
    ? amount * rate 
    : amount / rate;
}

/**
 * Formatea un monto como moneda SIN decimales (estándar Seencel).
 * 
 * @param amount - El monto a formatear
 * @param symbol - Símbolo de moneda (por defecto '$')
 * @param options - Opciones de formateo
 * @returns String formateado con símbolo y separadores de miles
 * 
 * @example
 * format(150000, 'USD') // => "USD 150.000"
 * format(-50000, '$')   // => "$ -50.000"
 */
export function format(
  amount: number,
  symbol: string = '$',
  options: { locale?: string; showSign?: boolean } = {}
): string {
  const { locale = 'es-AR', showSign = false } = options;
  
  const formattedNumber = Math.abs(amount).toLocaleString(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  const sign = amount < 0 ? '-' : (showSign && amount > 0 ? '+' : '');
  
  return `${symbol} ${sign}${formattedNumber}`;
}

/**
 * Formatea un monto para KPIs (valor principal grande).
 * Sin símbolo, solo el número formateado.
 * 
 * @param value - Valor numérico
 * @param locale - Locale para formateo
 * @returns String formateado para KPI
 * 
 * @example
 * formatKPI(1500000) // => "1.500.000"
 */
export function formatKPI(value: number, locale: string = 'es-AR'): string {
  return Math.abs(value).toLocaleString(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/**
 * Formatea el desglose por moneda para mostrar debajo del KPI principal.
 * 
 * @param breakdown - Array de breakdowns por moneda
 * @param options - Opciones de formato
 * @returns String con el desglose formateado
 * 
 * @example
 * formatSubValue([
 *   { currencySymbol: 'USD', total: 75000 },
 *   { currencySymbol: 'ARS', total: 150000000 }
 * ])
 * // => "USD 75.000 + ARS 150.000.000"
 */
export function formatSubValue(
  breakdown: Array<{ currencySymbol: string; total: number }>,
  options: { separator?: string; locale?: string } = {}
): string {
  const { separator = ' + ', locale = 'es-AR' } = options;
  
  return breakdown
    .filter(b => b.total !== 0)
    .map(b => format(b.total, b.currencySymbol, { locale }))
    .join(separator);
}

/**
 * Agrupa y suma items por moneda sin convertir.
 * Retorna el desglose real por cada moneda.
 * 
 * @param items - Array de items con amount y currency
 * @returns Map con totales por currencyId
 * 
 * @example
 * const items = [
 *   { amount: 100, currency: { id: 'usd', code: 'USD', symbol: '$' } },
 *   { amount: 200, currency: { id: 'usd', code: 'USD', symbol: '$' } },
 *   { amount: 50000, currency: { id: 'ars', code: 'ARS', symbol: '$' } }
 * ];
 * sumByCurrency(items)
 * // => [
 * //   { currencyId: 'usd', currencyCode: 'USD', total: 300 },
 * //   { currencyId: 'ars', currencyCode: 'ARS', total: 50000 }
 * // ]
 */
export function sumByCurrency(items: MoneyItem[]): CurrencyBreakdown[] {
  const map = new Map<string, CurrencyBreakdown>();
  
  for (const item of items) {
    const currencyId = item.currency?.id || item.currency_id || 'unknown';
    const currencyCode = item.currency?.code || 'N/A';
    const currencySymbol = item.currency?.symbol || '$';
    const currencyName = item.currency?.name;
    
    if (!map.has(currencyId)) {
      map.set(currencyId, {
        currencyId,
        currencyCode,
        currencySymbol,
        currencyName,
        total: 0,
        count: 0,
      });
    }
    
    const entry = map.get(currencyId)!;
    entry.total += item.amount;
    entry.count += 1;
  }
  
  return Array.from(map.values()).sort((a, b) => Math.abs(b.total) - Math.abs(a.total));
}

/**
 * Suma todos los items convirtiéndolos a la moneda base.
 * Usa la fórmula: amount * exchange_rate.
 * 
 * @param items - Array de items con amount, currency y exchange_rate
 * @param baseCurrencyId - ID de la moneda base de la organización
 * @returns Total convertido a moneda base
 * 
 * @example
 * const items = [
 *   { amount: 100, currency: { id: 'usd' }, exchange_rate: 1000 },
 *   { amount: 50000, currency: { id: 'ars' }, exchange_rate: 1 }
 * ];
 * sumAllInBaseCurrency(items, 'ars') // => 100000 + 50000 = 150000
 */
export function sumAllInBaseCurrency(
  items: MoneyItem[],
  baseCurrencyId?: string
): number {
  return items.reduce((sum, item) => {
    const currencyId = item.currency?.id || item.currency_id;
    
    // Si ya está en moneda base, no convertir
    if (currencyId === baseCurrencyId) {
      return sum + item.amount;
    }
    
    // Convertir usando exchange_rate
    return sum + convert(item.amount, item.exchange_rate);
  }, 0);
}

/**
 * Devuelve un objeto completo con el total convertido y el desglose por moneda.
 * Esto es ideal para KPIs que muestran ambos valores.
 * 
 * @param items - Array de items monetarios
 * @param baseCurrencyId - ID de la moneda base
 * @returns Objeto con baseTotal y breakdown
 * 
 * @example
 * explainBreakdown(items, 'ars')
 * // => {
 * //   baseTotal: 150000,
 * //   breakdown: [
 * //     { currencyId: 'usd', currencyCode: 'USD', currencySymbol: '$', total: 75000, count: 2 },
 * //     { currencyId: 'ars', currencyCode: 'ARS', currencySymbol: '$', total: 150000000, count: 5 }
 * //   ],
 * //   breakdownMap: { USD: 75000, ARS: 150000000 }
 * // }
 */
export function explainBreakdown(
  items: MoneyItem[],
  baseCurrencyId?: string
): BreakdownResult {
  const breakdown = sumByCurrency(items);
  const baseTotal = sumAllInBaseCurrency(items, baseCurrencyId);
  
  const breakdownMap: Record<string, number> = {};
  breakdown.forEach(b => {
    breakdownMap[b.currencyCode] = b.total;
  });
  
  return {
    baseTotal,
    breakdown,
    breakdownMap,
  };
}

/**
 * Obtiene el exchange rate efectivo para una moneda.
 * Si es la moneda base, retorna 1.
 * 
 * @param currencyId - ID de la moneda
 * @param baseCurrencyId - ID de la moneda base de la organización
 * @param providedRate - Rate provisto (opcional)
 * @returns Exchange rate a usar
 */
export function getEffectiveExchangeRate(
  currencyId?: string,
  baseCurrencyId?: string,
  providedRate?: number | null
): number {
  // Si es la moneda base, rate = 1
  if (currencyId && currencyId === baseCurrencyId) {
    return 1;
  }
  
  // Si hay rate provisto, usarlo
  if (providedRate != null && providedRate !== 0) {
    return providedRate;
  }
  
  // Default
  return 1;
}

export interface ConvertToBaseOptions {
  /**
   * Qué hacer cuando no hay moneda base definida:
   * - 'passthrough': Retorna el amount sin convertir (default, usado en financial-metrics)
   * - 'zero': Retorna 0 para evitar mezclar monedas (usado en partner-metrics)
   */
  onMissingBase?: 'passthrough' | 'zero';
  
  /**
   * Código de la moneda que se usa como referencia en el exchange_rate.
   * Por defecto es 'USD'. El exchange_rate siempre significa "1 [quoteCurrency] = X [otra moneda]".
   * 
   * Ejemplo con quoteCurrency='USD' y exchange_rate=1000:
   * - Si item está en USD y base es ARS → multiplica (100 USD * 1000 = 100,000 ARS)
   * - Si item está en ARS y base es USD → divide (100,000 ARS / 1000 = 100 USD)
   */
  quoteCurrency?: string;
}

/**
 * Convierte un monto de una moneda a la moneda base, manejando correctamente
 * el caso donde el movimiento ya está en moneda base.
 * 
 * Esta es la función principal para usar en hooks y servicios.
 * Acepta tanto código de moneda (e.g., "ARS", "USD") como ID de moneda.
 * 
 * IMPORTANTE: El exchange_rate siempre está definido como "1 [quoteCurrency] = X [otra moneda]"
 * Por ejemplo, si quoteCurrency='USD' y exchange_rate=1000, significa 1 USD = 1000 ARS.
 * 
 * La dirección de conversión se determina automáticamente:
 * - Si el item está en quoteCurrency (USD) y base es otra (ARS) → multiplica
 * - Si el item está en otra moneda (ARS) y base es quoteCurrency (USD) → divide
 * 
 * @param item - Item con amount, currency y exchange_rate
 * @param baseCurrencyCodeOrId - Código (e.g., "ARS") o ID de la moneda base
 * @param options - Opciones de conversión
 * @returns Monto convertido a moneda base
 */
export function convertToBaseCurrency(
  item: MoneyItem,
  baseCurrencyCodeOrId?: string,
  options: ConvertToBaseOptions = {}
): number {
  const { onMissingBase = 'passthrough', quoteCurrency = 'USD' } = options;
  
  // Si no hay moneda base definida, usar estrategia configurada
  if (!baseCurrencyCodeOrId) {
    return onMissingBase === 'zero' ? 0 : item.amount;
  }
  
  // Obtener identificadores del item
  const currencyId = item.currency?.id || item.currency_id;
  const currencyCode = item.currency?.code;
  
  // Comparar tanto por ID como por código (baseCurrencyCodeOrId puede ser cualquiera)
  const isAlreadyInBaseCurrency = 
    currencyId === baseCurrencyCodeOrId || 
    currencyCode === baseCurrencyCodeOrId;
  
  // Si ya está en moneda base, retornar sin conversión
  if (isAlreadyInBaseCurrency) {
    return item.amount;
  }
  
  // Determinar dirección de conversión basada en quoteCurrency
  // El exchange_rate siempre significa "1 [quoteCurrency] = X [otra moneda]"
  // 
  // Ejemplo con quoteCurrency='USD' y exchange_rate=1000:
  // - Item en USD, base es ARS: USD → ARS = amount * rate (100 * 1000 = 100,000)
  // - Item en ARS, base es USD: ARS → USD = amount / rate (100,000 / 1000 = 100)
  
  const itemIsQuoteCurrency = currencyCode === quoteCurrency;
  const direction: 'multiply' | 'divide' = itemIsQuoteCurrency ? 'multiply' : 'divide';
  
  return convert(item.amount, item.exchange_rate, { direction });
}

/**
 * Formatea un exchange rate para mostrar en UI.
 * 
 * @param rate - El exchange rate
 * @param options - Opciones de formateo
 * @returns String formateado del rate
 */
export function formatExchangeRate(
  rate: number,
  options: { locale?: string; minDecimals?: number; maxDecimals?: number } = {}
): string {
  const { locale = 'es-AR', minDecimals = 2, maxDecimals = 4 } = options;
  
  return rate.toLocaleString(locale, {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  });
}

/**
 * Valida que un item tenga los campos monetarios requeridos.
 */
export function isValidMoneyItem(item: unknown): item is MoneyItem {
  if (!item || typeof item !== 'object') return false;
  const obj = item as Record<string, unknown>;
  return typeof obj.amount === 'number';
}

/**
 * Objeto exportado con todas las funciones para uso con namespace.
 * 
 * @example
 * import { money } from '@/lib/money';
 * money.convert(100, 1000);
 * money.format(150000, 'USD');
 */
export const money = {
  convert,
  convertToBaseCurrency,
  format,
  formatKPI,
  formatSubValue,
  formatExchangeRate,
  sumByCurrency,
  sumAllInBaseCurrency,
  explainBreakdown,
  getEffectiveExchangeRate,
  isValidMoneyItem,
};

export default money;
