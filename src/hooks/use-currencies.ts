import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { organizationKeys } from '@/core/query-keys'

export interface Currency {
  id: string
  name: string
  symbol: string
  code: string
}

export interface OrganizationCurrency {
  id: string
  organization_id: string
  currency_id: string
  is_default: boolean
  is_active: boolean
  currency: Currency
}

export const useCurrencies = () => {
  return useQuery({
    queryKey: ['currencies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('currencies')
        .select('*')
        .order('name')
      
      if (error) throw error
      return data as Currency[]
    },
  })
}

export const useOrganizationCurrencies = (organizationId?: string) => {
  return useQuery({
    queryKey: organizationKeys.currencies(organizationId),
    queryFn: async () => {
      if (!organizationId) return []
      
      // Query from optimized view (organization_currencies_view)
      const { data, error } = await supabase
        .from('organization_currencies_view')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_deleted', false)
        .order('is_default', { ascending: false })
      
      if (error) throw error
      
      // Transform flat view data to nested structure expected by frontend
      const transformedData = (data || []).map((c: any) => ({
        id: c.id,
        organization_id: c.organization_id,
        currency_id: c.currency_id,
        is_default: c.is_default,
        is_active: c.is_active,
        currency: {
          id: c.currency_id,
          name: c.currency_name,
          symbol: c.currency_symbol,
          code: c.currency_code,
        },
      }))
      
      return transformedData as OrganizationCurrency[]
    },
    enabled: !!organizationId,
  })
}

export const useOrganizationDefaultCurrency = (organizationId?: string) => {
  return useQuery({
    queryKey: organizationKeys.defaultCurrency(organizationId),
    queryFn: async () => {
      if (!organizationId) return null
      
      // Query from optimized view (organization_currencies_view)
      const { data, error } = await supabase
        .from('organization_currencies_view')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_default', true)
        .maybeSingle()
      
      if (error) throw error
      if (!data) return null
      
      // Transform to Currency structure
      return {
        id: data.currency_id,
        name: data.currency_name,
        symbol: data.currency_symbol,
        code: data.currency_code,
      } as Currency
    },
    enabled: !!organizationId,
  })
}

/**
 * ============================================================================
 * CONTEXTO GLOBAL DE MONEDA DE ORGANIZACIÓN
 * ============================================================================
 * 
 * Hook centralizado que determina si una organización es MULTIMONEDA o MONOMONEDA.
 * 
 * REGLA PRINCIPAL (NO NEGOCIABLE):
 * - Una organización es MULTIMONEDA solo si tiene más de una moneda activa
 * - Si tiene 1 sola moneda activa → comportamiento MONOMONEDA
 * - Si tiene 2 o más monedas activas → comportamiento MULTIMONEDA
 * 
 * Esta regla se resuelve en un solo lugar (este hook), no duplicada por componentes.
 * 
 * @example
 * const { isMultiCurrency, defaultCurrency, activeCurrencies, isLoading } = useOrgCurrencyContext(orgId);
 * 
 * // En componentes de UI:
 * {isMultiCurrency && <CurrencySelector />}
 * {isMultiCurrency && showExchangeRate && <ExchangeRateField />}
 */
export interface OrgCurrencyContext {
  /** TRUE si la organización tiene más de 1 moneda activa */
  isMultiCurrency: boolean
  
  /** Moneda por defecto de la organización */
  defaultCurrency: Currency | null
  
  /** ID de la moneda por defecto (shortcut) */
  defaultCurrencyId: string | null
  
  /** Código de la moneda por defecto (shortcut para KPIs) */
  defaultCurrencyCode: string | null
  
  /** Símbolo de la moneda por defecto */
  defaultCurrencySymbol: string
  
  /** Lista de monedas activas de la organización */
  activeCurrencies: OrganizationCurrency[]
  
  /** Número de monedas activas */
  activeCurrencyCount: number
  
  /** Loading state */
  isLoading: boolean
  
  /** Error state */
  error: Error | null
  
  /**
   * Determina si se debe mostrar el campo de cotización.
   * Solo se muestra si:
   * 1. La org es multimoneda Y
   * 2. La moneda del movimiento es diferente a la moneda por defecto
   */
  shouldShowExchangeRate: (currencyId?: string | null) => boolean
  
  /**
   * Determina si una moneda es la moneda por defecto.
   */
  isDefaultCurrency: (currencyId?: string | null) => boolean
}

export const useOrgCurrencyContext = (organizationId?: string): OrgCurrencyContext => {
  const { 
    data: orgCurrencies = [], 
    isLoading: isLoadingCurrencies,
    error: currenciesError 
  } = useOrganizationCurrencies(organizationId)
  
  const {
    data: defaultCurrency = null,
    isLoading: isLoadingDefault,
    error: defaultError
  } = useOrganizationDefaultCurrency(organizationId)
  
  // Filtrar solo monedas activas
  const activeCurrencies = orgCurrencies.filter(oc => oc.is_active)
  const activeCurrencyCount = activeCurrencies.length
  
  // REGLA PRINCIPAL: isMultiCurrency solo si hay más de 1 moneda activa
  const isMultiCurrency = activeCurrencyCount > 1
  
  // Shortcuts para acceso rápido
  const defaultCurrencyId = defaultCurrency?.id ?? null
  const defaultCurrencyCode = defaultCurrency?.code ?? null
  const defaultCurrencySymbol = defaultCurrency?.symbol ?? '$'
  
  // Helper: determina si mostrar cotización
  const shouldShowExchangeRate = (currencyId?: string | null): boolean => {
    if (!isMultiCurrency) return false
    if (!currencyId || !defaultCurrencyId) return false
    return currencyId !== defaultCurrencyId
  }
  
  // Helper: verifica si es la moneda por defecto
  const isDefaultCurrency = (currencyId?: string | null): boolean => {
    if (!currencyId || !defaultCurrencyId) return false
    return currencyId === defaultCurrencyId
  }
  
  return {
    isMultiCurrency,
    defaultCurrency,
    defaultCurrencyId,
    defaultCurrencyCode,
    defaultCurrencySymbol,
    activeCurrencies,
    activeCurrencyCount,
    isLoading: isLoadingCurrencies || isLoadingDefault,
    error: currenciesError || defaultError || null,
    shouldShowExchangeRate,
    isDefaultCurrency,
  }
}