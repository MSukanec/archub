export type InsightType = 'info' | 'warning' | 'alert';

export interface Insight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  icon: string;
  priority: number;
}

export interface InsightContext {
  totalGasto: number;
  previousPeriodGasto: number;
  categoryData: Array<{ name: string; value: number }>;
  monthlyData: Array<{ month: string; value: number }>;
  paymentsCount: number;
  monthCount: number;
  topCategoryPercentage: number;
  topCategoryName: string;
}

export type InsightRule = (context: InsightContext) => Insight | null;
