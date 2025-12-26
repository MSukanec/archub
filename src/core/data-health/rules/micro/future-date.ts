import { Calendar } from 'lucide-react';
import type { DataHealthContext } from '../../types';
import type { MicroRule, MicroRuleConfig, MicroRuleResult } from './types';
export interface DateEntity {
  id: string | number;
  date?: string | null;
}
const config: MicroRuleConfig = {
  id: 'future-date',
  severity: 'info',
  icon: Calendar,
  category: 'dates',
};
interface FutureDateOptions {
  dateField?: string;
}
function check<T extends DateEntity>(
  items: T[],
  ctx: DataHealthContext,
  _options?: FutureDateOptions
): MicroRuleResult<T> {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const toleranceDays = ctx.dateToleranceDays ?? 0;
  const toleranceDate = new Date(today);
  toleranceDate.setDate(toleranceDate.getDate() + toleranceDays);
  const affected = items.filter(item => {
    if (!item.date) return false;
    const itemDate = new Date(item.date);
    return itemDate > toleranceDate;
  });
  return {
    affected,
    isEmpty: affected.length === 0,
  };
}
export function createFutureDateRule<T extends DateEntity>(
  options?: FutureDateOptions
): MicroRule<T> {
  return {
    config,
    check: (items, ctx) => check(items, ctx, options),
  };
}
export const futureDateConfig = config;
