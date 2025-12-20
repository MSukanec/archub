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
  // Detectar si hay múltiples monedas en los datos
  const uniqueCurrencies = new Set<string>();
  for (const item of items) {
    if (item.currencyId) {
      uniqueCurrencies.add(item.currencyId);
    }
  }
  
  // Si solo hay una moneda, no hay problemas de cotización
  if (uniqueCurrencies.size <= 1) {
    return {
      affected: [],
      isEmpty: true,
    };
  }
  
  // Hay múltiples monedas: validar cotización para movimientos en moneda no-base
  const minValidRate = 1.0;
  
  const affected = items.filter(item => {
    // Si no tiene currencyId, skip
    if (!item.currencyId) return false;
    
    // Si es la moneda base, no necesita validación especial
    if (ctx.defaultCurrencyId && item.currencyId === ctx.defaultCurrencyId) {
      return false;
    }
    
    // Para movimientos en moneda no-base, validar cotización
    // Inválida si: no existe, es <= 1.0, o es NaN
    const hasInvalidRate = !item.exchangeRate || 
      item.exchangeRate <= minValidRate || 
      Number.isNaN(item.exchangeRate);
    
    return hasInvalidRate;
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
