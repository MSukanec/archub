import { Users } from 'lucide-react';
import type { DataHealthContext } from '../../types';
import type { MicroRule, MicroRuleConfig, MicroRuleResult } from './types';

export interface PersonnelEntity {
  id: string | number;
  personnel_id?: string | null;
}

export interface MissingPersonnelOptions<T extends PersonnelEntity> {
  filterFn?: (item: T) => boolean;
}

const config: MicroRuleConfig = {
  id: 'missing-personnel',
  severity: 'warning',
  icon: Users,
  category: 'missing_relation',
};

function check<T extends PersonnelEntity>(
  items: T[],
  _ctx: DataHealthContext,
  options?: MissingPersonnelOptions<T>
): MicroRuleResult<T> {
  const { filterFn } = options || {};

  const affected = items.filter(item => {
    if (filterFn && !filterFn(item)) return false;
    return item.personnel_id === null || item.personnel_id === undefined || item.personnel_id === '';
  });

  return {
    affected,
    isEmpty: affected.length === 0,
  };
}

export function createMissingPersonnelRule<T extends PersonnelEntity>(
  options?: MissingPersonnelOptions<T>
): MicroRule<T> {
  return {
    config,
    check: (items, ctx) => check(items, ctx, options),
  };
}

export const missingPersonnelConfig = config;
