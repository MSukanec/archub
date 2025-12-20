import type { LucideIcon } from 'lucide-react';
import type { DataSeverity, DataHealthContext, CorrectiveAction } from '../../types';

export interface MicroRuleConfig {
  id: string;
  severity: DataSeverity;
  icon: LucideIcon;
  category: string;
}

export interface MicroRuleResult<T> {
  affected: T[];
  isEmpty: boolean;
}

export interface EntityLabels {
  singular: string;
  plural: string;
}

export interface MicroRuleAdapter<T> {
  entityLabels: EntityLabels;
  formatTitle: (count: number) => string;
  formatDescription: (count: number) => string;
  getLabel: (item: T) => string;
  getRecommendedAction: (affectedIds: (string | number)[]) => CorrectiveAction;
}

export interface MicroRule<T = unknown> {
  config: MicroRuleConfig;
  check: (items: T[], ctx: DataHealthContext) => MicroRuleResult<T>;
}

export type MicroRuleFactory<T, TOptions = void> = TOptions extends void
  ? () => MicroRule<T>
  : (options: TOptions) => MicroRule<T>;
