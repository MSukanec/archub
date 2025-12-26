import { Users, FolderOpen } from 'lucide-react';
import type { DataHealthContext } from '../../types';
import type { MicroRule, MicroRuleConfig, MicroRuleResult } from './types';
export type RelationType = 'client'| 'project'| 'category'| 'concept'| 'custom';
export interface RelationEntity {
  id: string | number;
}
interface MissingRelationOptions<T> {
  relationType: RelationType;
  relationField: keyof T;
  filterFn?: (item: T) => boolean;
}
const relationConfigs: Record<RelationType, MicroRuleConfig> = {
  client: {
    id: 'missing-client',
    severity: 'warning',
    icon: Users,
    category: 'missing_relation',
  },
  project: {
    id: 'missing-project',
    severity: 'warning',
    icon: FolderOpen,
    category: 'missing_relation',
  },
  category: {
    id: 'missing-category',
    severity: 'info',
    icon: FolderOpen,
    category: 'classification',
  },
  concept: {
    id: 'missing-concept',
    severity: 'info',
    icon: FolderOpen,
    category: 'classification',
  },
  custom: {
    id: 'missing-relation',
    severity: 'warning',
    icon: FolderOpen,
    category: 'missing_relation',
  },
};
function check<T extends RelationEntity>(
  items: T[],
  _ctx: DataHealthContext,
  options: MissingRelationOptions<T>
): MicroRuleResult<T> {
  const { relationField, filterFn } = options;
  const affected = items.filter(item => {
    if (filterFn && !filterFn(item)) return false;
    const value = item[relationField];
    return value === null || value === undefined || value === '';
  });
  return {
    affected,
    isEmpty: affected.length === 0,
  };
}
export function createMissingRelationRule<T extends RelationEntity>(
  options: MissingRelationOptions<T>
): MicroRule<T> {
  const config = relationConfigs[options.relationType];
  
  return {
    config,
    check: (items, ctx) => check(items, ctx, options),
  };
}
export const missingRelationConfigs = relationConfigs;
