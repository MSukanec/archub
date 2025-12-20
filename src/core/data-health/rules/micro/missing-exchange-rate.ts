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
  const minValidRate = 1.0;
  
  const affected = items.filter(item => {
    const isForeignCurrency = item.currencyId && 
      ctx.defaultCurrencyId && 
      item.currencyId !== ctx.defaultCurrencyId;
    const hasInvalidRate = !item.exchangeRate || 
      item.exchangeRate <= minValidRate || 
      Number.isNaN(item.exchangeRate);
    return isForeignCurrency && hasInvalidRate;
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
