/**
 * /lib/currency-visibility.ts
 * 
 * Helpers de visibilidad para campos de moneda y cotización.
 * 
 * REGLAS DE VISIBILIDAD:
 * 
 * 🟢 ORGANIZACIÓN MONOMONEDA (1 moneda activa):
 * - NO mostrar: selectores de moneda, campos de cotización, columnas de moneda, breakdowns
 * - SÍ mostrar: montos simples, KPIs limpias, tablas sin ruido
 * - El usuario no debe notar que existe multimoneda
 * 
 * 🟡 ORGANIZACIÓN MULTIMONEDA (2+ monedas activas):
 * - SÍ mostrar: selector de moneda donde tenga sentido
 * - SÍ mostrar: campo cotización SOLO cuando la moneda del movimiento ≠ moneda por defecto
 * - SÍ mostrar: breakdown por moneda en KPIs
 * - NUNCA mostrar cotización "porque sí"
 * 
 * @module currency-visibility
 */

import type { OrgCurrencyContext } from '@/hooks/use-currencies';

/**
 * Determina si debe mostrarse un selector de moneda.
 * 
 * REGLA: Solo mostrar si la organización es multimoneda.
 * 
 * @param context - Contexto de moneda de la organización
 * @returns true si debe mostrarse el selector
 */
export function shouldShowCurrencySelector(context: OrgCurrencyContext): boolean {
  return context.isMultiCurrency;
}

/**
 * Determina si debe mostrarse el campo de cotización/exchange rate.
 * 
 * REGLAS:
 * 1. Si la org NO es multimoneda → NUNCA mostrar
 * 2. Si es multimoneda → SÍ mostrar (siempre, para cualquier moneda)
 * 
 * @param context - Contexto de moneda de la organización
 * @param selectedCurrencyId - ID de la moneda seleccionada en el formulario
 * @returns true si debe mostrarse el campo de cotización
 */
export function shouldShowExchangeRateField(
  context: OrgCurrencyContext,
  selectedCurrencyId?: string | null
): boolean {
  // Si no es multimoneda, nunca mostrar
  if (!context.isMultiCurrency) return false;
  
  // Si es multimoneda y hay moneda seleccionada, mostrar siempre
  return !!selectedCurrencyId;
}

/**
 * Determina si debe mostrarse la columna de moneda en una tabla.
 * 
 * REGLA: Solo mostrar si la organización es multimoneda.
 * 
 * @param context - Contexto de moneda de la organización
 * @returns true si debe mostrarse la columna
 */
export function shouldShowCurrencyColumn(context: OrgCurrencyContext): boolean {
  return context.isMultiCurrency;
}

/**
 * Determina si debe mostrarse la columna de cotización en una tabla.
 * 
 * REGLA: Solo mostrar si la organización es multimoneda.
 * En tablas, siempre se muestra cuando hay multimoneda porque puede haber
 * registros en diferentes monedas.
 * 
 * @param context - Contexto de moneda de la organización
 * @returns true si debe mostrarse la columna
 */
export function shouldShowExchangeRateColumn(context: OrgCurrencyContext): boolean {
  return context.isMultiCurrency;
}

/**
 * Determina si debe mostrarse el breakdown de monedas en KPIs.
 * 
 * REGLA: Solo mostrar si la organización es multimoneda.
 * 
 * @param context - Contexto de moneda de la organización
 * @returns true si debe mostrarse el breakdown
 */
export function shouldShowKPIBreakdown(context: OrgCurrencyContext): boolean {
  return context.isMultiCurrency;
}

/**
 * Obtiene las props condicionales para ocultar un campo visualmente.
 * Retorna className para ocultar el campo si no debe mostrarse.
 * 
 * @param shouldShow - Si el campo debe mostrarse
 * @returns Props para aplicar al componente
 */
export function getConditionalFieldProps(shouldShow: boolean): { className?: string } {
  return shouldShow ? {} : { className: 'hidden' };
}

/**
 * Tipo de configuración para el wrapper de visibilidad
 */
export interface CurrencyFieldVisibilityConfig {
  /** Contexto de moneda de la organización */
  context: OrgCurrencyContext;
  
  /** ID de la moneda actualmente seleccionada (para exchange rate) */
  selectedCurrencyId?: string | null;
  
  /** Si forzar la visibilidad (override) */
  forceShow?: boolean;
}

/**
 * Helper completo que retorna todas las decisiones de visibilidad.
 * Útil para componentes que necesitan varias decisiones a la vez.
 * 
 * @param config - Configuración de visibilidad
 * @returns Objeto con todas las decisiones de visibilidad
 * 
 * @example
 * const visibility = getCurrencyFieldsVisibility({
 *   context: orgCurrencyContext,
 *   selectedCurrencyId: form.watch('currency_id')
 * });
 * 
 * {visibility.showCurrencySelector && <CurrencySelect />}
 * {visibility.showExchangeRate && <ExchangeRateInput />}
 */
export function getCurrencyFieldsVisibility(config: CurrencyFieldVisibilityConfig) {
  const { context, selectedCurrencyId, forceShow = false } = config;
  
  return {
    /** Si la organización es multimoneda */
    isMultiCurrency: context.isMultiCurrency,
    
    /** Si mostrar el selector de moneda */
    showCurrencySelector: forceShow || shouldShowCurrencySelector(context),
    
    /** Si mostrar el campo de cotización */
    showExchangeRate: forceShow || shouldShowExchangeRateField(context, selectedCurrencyId),
    
    /** Si mostrar columnas de moneda en tablas */
    showCurrencyColumn: forceShow || shouldShowCurrencyColumn(context),
    
    /** Si mostrar columnas de cotización en tablas */
    showExchangeRateColumn: forceShow || shouldShowExchangeRateColumn(context),
    
    /** Si mostrar breakdown de monedas en KPIs */
    showKPIBreakdown: forceShow || shouldShowKPIBreakdown(context),
    
    /** Moneda por defecto (shortcut) */
    defaultCurrency: context.defaultCurrency,
    
    /** Símbolo de la moneda por defecto */
    defaultSymbol: context.defaultCurrencySymbol,
  };
}

/**
 * ============================================================================
 * EJEMPLOS DE USO
 * ============================================================================
 * 
 * // En un formulario:
 * const { isMultiCurrency, defaultCurrencyCode } = useOrgCurrencyContext(organizationId);
 * const visibility = getCurrencyFieldsVisibility({
 *   context: { isMultiCurrency, ... },
 *   selectedCurrencyId: form.watch('currency_id')
 * });
 * 
 * return (
 *   <Form>
 *     {visibility.showCurrencySelector && (
 *       <FormField name="currency_id" ... />
 *     )}
 *     
 *     {visibility.showExchangeRate && (
 *       <FormField name="exchange_rate" ... />
 *     )}
 *   </Form>
 * );
 * 
 * // En una tabla:
 * const columns = [
 *   { header: 'Fecha', ... },
 *   { header: 'Monto', ... },
 *   visibility.showCurrencyColumn && { header: 'Moneda', ... },
 *   visibility.showExchangeRateColumn && { header: 'Cotización', ... },
 * ].filter(Boolean);
 * 
 * // En KPIs:
 * <StatCard>
 *   <StatCardValue>{formatKPI(kpi.value)}</StatCardValue>
 *   {visibility.showKPIBreakdown && kpi.breakdown && (
 *     <StatCardMeta>{formatBreakdown(kpi)}</StatCardMeta>
 *   )}
 * </StatCard>
 */
