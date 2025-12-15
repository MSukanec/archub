export type InsightType = 'info' | 'warning' | 'alert';

export interface Insight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  icon: string;
  priority: number;
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
}

export type InsightRule = (context: InsightContext) => Insight | null;
