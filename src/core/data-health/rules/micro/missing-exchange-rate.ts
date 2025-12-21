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
  // Cualquier movimiento con exchange_rate = 1.0 o null es sospechoso
  // porque 1.0 es el valor por defecto sin configuración de cotización
  const affected = items.filter(item => {
    // Si no tiene currencyId, skip
    if (!item.currencyId) return false;
    
    // Si es la moneda por defecto, exchange_rate = 1.0 está bien
    if (ctx.defaultCurrencyId && item.currencyId === ctx.defaultCurrencyId) {
      return false;
    }
    
    // Si no tiene exchange_rate, es problema (falta configurar)
    if (!item.exchangeRate) return true;
    
    // Si es NaN, es problema
    if (Number.isNaN(item.exchangeRate)) return true;
    
    // Si es exactamente 1.0 y NO es la moneda por defecto, es problema
    if (item.exchangeRate === 1.0) return true;
    
    // Si es menor a 1.0, es problema (cotización inválida)
    if (item.exchangeRate < 1.0) return true;
    
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
