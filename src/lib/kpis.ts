/**
 * /lib/kpis.ts
 * 
 * Sistema HEADLESS de KPIs - Lógica pura sin UI
 * 
 * Este archivo centraliza TODA la lógica de cálculo de KPIs sin componentes visuales.
 * Las funciones retornan datos estructurados que pueden usarse en cualquier UI.
 * 
 * Principios:
 * - Nunca retorna JSX
 * - Siempre retorna { value, formatted, meta?, breakdown? }
 * - KPIs monetarias usan EXCLUSIVAMENTE convertToBaseCurrency()
 * - KPIs no-monetarias evitan lógica monetaria
 * - Soporta contexto de moneda (proyecto u organización)
 */

import { convertToBaseCurrency, formatKPI, formatSubValue } from '@/lib/money';
import type { MoneyItem } from '@/lib/money';

/**
 * Resultado estándar de cualquier KPI
 */
export interface KPIResult {
  /** Valor numérico crudo */
  value: number;
  
  /** Valor formateado para mostrar */
  formatted: string;
  
  /** Metadata adicional (símbolo, unidad, etc.) */
  meta?: Record<string, any>;
  
  /** Desglose por moneda (solo para KPIs monetarias) */
  breakdown?: Array<{
    currencyCode: string;
    currencySymbol: string;
    total: number;
  }>;
}

/**
 * Configuración para KPIs monetarias
 */
export interface MonetaryKPIConfig {
  items: MoneyItem[];
  baseCurrencyId?: string;
  symbol?: string;
  locale?: string;
  quoteCurrency?: string;
}

/**
 * Configuración para KPIs de conteo
 */
export interface CountKPIConfig {
  count: number;
  label?: string;
  locale?: string;
}

/**
 * Configuración para KPIs de porcentaje
 */
export interface PercentageKPIConfig {
  numerator: number;
  denominator: number;
  decimals?: number;
  locale?: string;
}

/**
 * Configuración para KPIs de texto
 */
export interface TextKPIConfig {
  text: string;
  icon?: string;
}

/**
 * ============================================================================
 * KPI MONETARIA - El tipo más importante
 * ============================================================================
 * 
 * Calcula el total convertido a moneda base + breakdown por moneda
 * 
 * RETORNA:
 * {
 *   value: 150000,
 *   formatted: "150.000",
 *   breakdown: [
 *     { currencyCode: 'USD', currencySymbol: 'USD', total: 100 },
 *     { currencyCode: 'ARS', currencySymbol: '$', total: 50000 }
 *   ]
 * }
 * 
 * USO EN COMPONENTES:
 * const kpi = calculateMonetaryKPI({
 *   items: transactions,
 *   baseCurrencyId: orgCurrencyId
 * });
 * 
 * <div>
 *   <h3>{formatKPI(kpi.value)}</h3>
 *   <p>{formatSubValue(kpi.breakdown!)}</p>
 * </div>
 */
export function calculateMonetaryKPI(config: MonetaryKPIConfig): KPIResult {
  const { 
    items = [], 
    baseCurrencyId, 
    symbol = '$',
    locale = 'es-AR',
    quoteCurrency = 'USD'
  } = config;
  
  // Si no hay items, retornar 0
  if (items.length === 0) {
    return {
      value: 0,
      formatted: formatKPI(0, locale),
      breakdown: []
    };
  }
  
  // Calcular total convertido usando signatura EXPLÍCITA de convertToBaseCurrency
  const totalConverted = items.reduce((sum, item) => {
    const currencyId = item.currency?.id || item.currency_id;
    const currencyCode = item.currency?.code;
    
    return sum + convertToBaseCurrency(
      currencyCode || currencyId || 'unknown',
      baseCurrencyId,
      item.amount,
      item.exchange_rate ?? null,
      { quoteCurrency }
    );
  }, 0);
  
  // Calcular breakdown por moneda (sin convertir)
  const breakdownMap = new Map<string, {
    code: string;
    symbol: string;
    total: number;
  }>();
  
  items.forEach(item => {
    const code = item.currency?.code || 'N/A';
    const currencySymbol = item.currency?.symbol || symbol;
    
    if (!breakdownMap.has(code)) {
      breakdownMap.set(code, {
        code,
        symbol: currencySymbol,
        total: 0
      });
    }
    
    const entry = breakdownMap.get(code)!;
    entry.total += item.amount;
  });
  
  const breakdown = Array.from(breakdownMap.values())
    .sort((a, b) => Math.abs(b.total) - Math.abs(a.total))
    .map(b => ({
      currencyCode: b.code,
      currencySymbol: b.symbol,
      total: b.total
    }));
  
  return {
    value: totalConverted,
    formatted: formatKPI(totalConverted, locale),
    breakdown
  };
}

/**
 * ============================================================================
 * KPI DE CONTEO - Para cantidades simples
 * ============================================================================
 * 
 * RETORNA:
 * {
 *   value: 25,
 *   formatted: "25"
 * }
 * 
 * USO EN COMPONENTES:
 * const kpi = calculateCountKPI({ count: totalPayments });
 * <div>
 *   <h3>{kpi.formatted}</h3>
 *   <p>Pagos registrados</p>
 * </div>
 */
export function calculateCountKPI(config: CountKPIConfig): KPIResult {
  const { count, label = 'Total', locale = 'es-AR' } = config;
  
  return {
    value: count,
    formatted: count.toLocaleString(locale),
    meta: {
      unit: label
    }
  };
}

/**
 * ============================================================================
 * KPI DE PORCENTAJE - Para ratios y variaciones
 * ============================================================================
 * 
 * RETORNA:
 * {
 *   value: 33.33,
 *   formatted: "33,33%"
 * }
 * 
 * USO EN COMPONENTES:
 * const kpi = calculatePercentageKPI({
 *   numerator: 10,
 *   denominator: 30,
 *   decimals: 2
 * });
 * <div>
 *   <h3>{kpi.formatted}</h3>
 *   <p>Completado</p>
 * </div>
 */
export function calculatePercentageKPI(config: PercentageKPIConfig): KPIResult {
  const { numerator, denominator, decimals = 2, locale = 'es-AR' } = config;
  
  // Evitar división por cero
  if (denominator === 0) {
    return {
      value: 0,
      formatted: '0%',
      meta: { unit: '%' }
    };
  }
  
  const percentage = (numerator / denominator) * 100;
  const formattedValue = percentage.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
  
  return {
    value: percentage,
    formatted: `${formattedValue}%`,
    meta: { unit: '%' }
  };
}

/**
 * ============================================================================
 * KPI DE TEXTO - Para valores no-numéricos
 * ============================================================================
 * 
 * RETORNA:
 * {
 *   value: 0, // No aplica
 *   formatted: "En progreso",
 *   meta: { icon: 'clock' }
 * }
 * 
 * USO EN COMPONENTES:
 * const kpi = calculateTextKPI({
 *   text: "En progreso",
 *   icon: "clock"
 * });
 * <div>
 *   <h3>{kpi.formatted}</h3>
 * </div>
 */
export function calculateTextKPI(config: TextKPIConfig): KPIResult {
  const { text, icon } = config;
  
  return {
    value: 0,
    formatted: text,
    meta: { icon }
  };
}

/**
 * ============================================================================
 * KPI AGREGADA - Sumatoria de múltiples KPIs monetarias
 * ============================================================================
 * 
 * Útil para mostrar "Total Aportes" + "Total Retiros" en una sola cifra
 * 
 * RETORNA:
 * {
 *   value: 350000,
 *   formatted: "350.000",
 *   breakdown: [...]
 * }
 * 
 * USO EN COMPONENTES:
 * const combined = calculateAggregateMonetaryKPI({
 *   kpis: [contributionsKPI, withdrawalsKPI]
 * });
 */
export function calculateAggregateMonetaryKPI(config: {
  kpis: KPIResult[];
  locale?: string;
}): KPIResult {
  const { kpis = [], locale = 'es-AR' } = config;
  
  // Sumar todos los values
  const totalValue = kpis.reduce((sum, kpi) => sum + kpi.value, 0);
  
  // Combinar todos los breakdowns
  const breakdownMap = new Map<string, {
    code: string;
    symbol: string;
    total: number;
  }>();
  
  kpis.forEach(kpi => {
    (kpi.breakdown || []).forEach(item => {
      if (!breakdownMap.has(item.currencyCode)) {
        breakdownMap.set(item.currencyCode, {
          code: item.currencyCode,
          symbol: item.currencySymbol,
          total: 0
        });
      }
      breakdownMap.get(item.currencyCode)!.total += item.total;
    });
  });
  
  const breakdown = Array.from(breakdownMap.values())
    .sort((a, b) => Math.abs(b.total) - Math.abs(a.total))
    .map(b => ({
      currencyCode: b.code,
      currencySymbol: b.symbol,
      total: b.total
    }));
  
  return {
    value: totalValue,
    formatted: formatKPI(totalValue, locale),
    breakdown: breakdown.length > 0 ? breakdown : undefined
  };
}

/**
 * ============================================================================
 * HELPERS - Funciones auxiliares
 * ============================================================================
 */

/**
 * Obtiene el breakdown formateado como string
 * Útil para mostrar directamente: "USD 100 + ARS 50.000"
 */
export function formatBreakdown(kpi: KPIResult, locale: string = 'es-AR'): string {
  if (!kpi.breakdown || kpi.breakdown.length === 0) {
    return kpi.formatted;
  }
  
  return formatSubValue(
    kpi.breakdown.map(b => ({
      currencySymbol: b.currencySymbol,
      total: b.total
    })),
    { locale }
  );
}

/**
 * Verifica si un KPI tiene multiple monedas
 */
export function hasMultipleCurrencies(kpi: KPIResult): boolean {
  return (kpi.breakdown?.length || 0) > 1;
}

/**
 * Obtiene el currency code dominante (el con mayor valor)
 */
export function getDominantCurrency(kpi: KPIResult): string | null {
  if (!kpi.breakdown || kpi.breakdown.length === 0) return null;
  return kpi.breakdown[0]?.currencyCode || null;
}

/**
 * ============================================================================
 * PATRÓN DE USO COMPLETO
 * ============================================================================
 * 
 * En un componente que muestre KPIs monetarias:
 * 
 * export function PartnerStatsSection() {
 *   const { data: transactions } = usePartnerTransactions(organizationId);
 *   const orgCurrencyId = userData?.organization?.preferences?.default_currency_id;
 *   
 *   const contributionsKPI = calculateMonetaryKPI({
 *     items: transactions.filter(t => t.type === 'contribution'),
 *     baseCurrencyId: orgCurrencyId
 *   });
 *   
 *   const withdrawalsKPI = calculateMonetaryKPI({
 *     items: transactions.filter(t => t.type === 'withdrawal'),
 *     baseCurrencyId: orgCurrencyId
 *   });
 *   
 *   return (
 *     <div>
 *       <StatCard>
 *         <StatCardTitle>Total Aportes</StatCardTitle>
 *         <StatCardValue>{formatKPI(contributionsKPI.value)}</StatCardValue>
 *         <StatCardMeta>{formatBreakdown(contributionsKPI)}</StatCardMeta>
 *       </StatCard>
 *       
 *       <StatCard>
 *         <StatCardTitle>Total Retiros</StatCardTitle>
 *         <StatCardValue>{formatKPI(withdrawalsKPI.value)}</StatCardValue>
 *         <StatCardMeta>{formatBreakdown(withdrawalsKPI)}</StatCardMeta>
 *       </StatCard>
 *     </div>
 *   );
 * }
 */
