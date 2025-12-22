import { DollarSign } from 'lucide-react';
import type { DataHealthContext } from '../../types';
import type { MicroRule, MicroRuleConfig, MicroRuleResult } from './types';

export interface ExchangeRateEntity {
  id: string | number;
  currencyId?: string | null;
  exchangeRate?: number | null;
}

const config: MicroRuleConfig = {
  id: 'missing-exchange-rate',
  severity: 'critical',
  icon: DollarSign,
  category: 'currency',
};

function check<T extends ExchangeRateEntity>(
  items: T[],
  ctx: DataHealthContext
): MicroRuleResult<T> {
  // Si la organización NO es multimoneda, no hay problemas de cotización
  // IMPORTANTE: Usamos el contexto de la org, no los datos
  if (!ctx.isMultiCurrency) {
    return {
      affected: [],
      isEmpty: true,
    };
  }
  
  // La organización es multimoneda: verificar cada movimiento
  // En orgs multimoneda, TODOS los movimientos deben tener cotización > 1.0
  // sin importar si es moneda base o secundaria
  const affected = items.filter(item => {
    // Si no tiene currencyId, skip
    if (!item.currencyId) return false;
    
    // Si no tiene exchange_rate, es problema (falta configurar)
    if (!item.exchangeRate) return true;
    
    // Si es NaN, es problema
    if (Number.isNaN(item.exchangeRate)) return true;
    
    // En multi-currency, cotización debe ser > 1.0 para TODAS las monedas
    if (item.exchangeRate <= 1.0) return true;
    
    return false;
  });

  return {
    affected,
    isEmpty: affected.length === 0,
  };
}

export function createMissingExchangeRateRule<T extends ExchangeRateEntity>(): MicroRule<T> {
  return {
    config,
    check: (items, ctx) => check(items, ctx),
  };
}

export const missingExchangeRateConfig = config;
