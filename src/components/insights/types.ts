export type InsightType = 'info'| 'warning'| 'alert';
export type InsightActionType = 'navigate'| 'filter'| 'open';
export interface InsightAction {
  id: string;
  label: string;
  type: InsightActionType;
  payload: Record<string, unknown>;
}
export interface Insight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  icon: string;
  priority: number;
  context?: string;      // POR QUÉ pasó (explicación del origen)
  actionHint?: string;   // QUÉ HACER (sugerencia concreta)
  actions?: InsightAction[];
}
export interface CategoryData {
  name: string;
  value: number;
}
export interface PaymentsByConceptData {
  conceptName: string;
  paymentsCount: number;
  totalAmount: number;
}
export interface ProjectFinancialData {
  projectId: string;
  projectName: string;
  income: number;
  expense: number;
  balance: number;
}
export interface MonthlyFinancialData {
  month: string;
  income: number;
  expense: number;
  balance: number;
}
export interface InsightContext {
  totalGasto: number;
  previousPeriodGasto: number;
  categoryData: CategoryData[];
  previousCategoryData: CategoryData[];
  monthlyData: Array<{ month: string; value: number }>;
  paymentsCount: number;
  monthCount: number;
  topCategoryPercentage: number;
  topCategoryName: string;
  paymentsByConcept: PaymentsByConceptData[];
  isShortPeriod: boolean;
  daysCount: number;
  currentMonth?: number;
  totalIngresos?: number;
  totalEgresos?: number;
  balance?: number;
  monthlyFinancialData?: MonthlyFinancialData[];
  projectFinancialData?: ProjectFinancialData[];
}
export type InsightRule = (context: InsightContext) => Insight | null;
