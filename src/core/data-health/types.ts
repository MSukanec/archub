export type DataSeverity = 'info'| 'warning'| 'critical';
export interface CorrectiveAction {
  label: string;
  description?: string;
  actionType: 'navigate'| 'edit'| 'bulk_edit'| 'manual';
  targetPath?: string;
  targetIds?: (string | number)[];
}
export interface DataIssue {
  id: string;
  ruleId: string;
  title: string;
  description: string;
  severity: DataSeverity;
  recommendedAction: CorrectiveAction;
  affectedCount: number;
  affectedEntities?: Array<{ id: string | number; label: string }>;
  metadata?: Record<string, unknown>;
}
export interface DataHealthContext {
  organizationId: string;
  locale?: string;
  currencyMap?: Map<string, { code: string; symbol: string }>;
  defaultCurrencyId?: string;
  dateToleranceDays?: number;
  /** Whether the organization has multi-currency enabled (more than 1 active currency) */
  isMultiCurrency?: boolean;
}
export interface DataHealthRule<TInput = unknown> {
  id: string;
  name: string;
  description: string;
  category: string;
  appliesTo: string[];
  check: (input: TInput[], ctx: DataHealthContext) => DataIssue | null;
}
export interface DataHealthResult {
  issues: DataIssue[];
  stats: {
    totalRulesChecked: number;
    issuesFound: number;
    bySeverity: Record<DataSeverity, number>;
  };
  checkedAt: Date;
}
export interface NormalizedPayment {
  id: string | number;
  label: string;
  amount: number;
  amountInBase?: number | null;
  currencyId?: string | null;
  currencyCode?: string | null;
  exchangeRate?: number | null;
  categoryId?: string | null;
  categoryName?: string | null;
  conceptId?: string | null;
  conceptName?: string | null;
  paymentDate?: string | null;
  status?: string | null;
  walletId?: string | null;
  walletName?: string | null;
  description?: string | null;
  movementType?: string | null;
  clientId?: string | null;
  projectId?: string | null;
}
