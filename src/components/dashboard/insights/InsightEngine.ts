import { type Insight, type InsightContext, type InsightRule, type CategoryData, type PaymentsByConceptData } from './types';
import { allInsightRules } from './insightRules';

/**
 * Ejecuta un conjunto de reglas custom contra el contexto.
 * Útil para dashboards que necesitan reglas específicas.
 */
export function runInsightRules(
  context: InsightContext, 
  rules: InsightRule[], 
  maxInsights: number = 3
): Insight[] {
  const insights: Insight[] = [];
  
  for (const rule of rules) {
    const insight = rule(context);
    if (insight !== null) {
      insights.push(insight);
    }
  }
  
  insights.sort((a, b) => a.priority - b.priority);
  
  return insights.slice(0, maxInsights);
}

/**
 * Genera insights usando las reglas por defecto.
 * Wrapper conveniente sobre runInsightRules.
 */
export function generateInsights(context: InsightContext, maxInsights: number = 3): Insight[] {
  return runInsightRules(context, allInsightRules, maxInsights);
}

export function buildInsightContext(params: {
  totalGasto: number;
  previousPeriodGasto: number;
  categoryData: CategoryData[];
  previousCategoryData?: CategoryData[];
  monthlyData: Array<{ month: string; value: number }>;
  paymentsCount: number;
  monthCount: number;
  paymentsByConcept?: PaymentsByConceptData[];
}): InsightContext {
  const { 
    totalGasto, 
    previousPeriodGasto, 
    categoryData, 
    previousCategoryData = [],
    monthlyData, 
    paymentsCount, 
    monthCount,
    paymentsByConcept = []
  } = params;
  
  let topCategoryName = '';
  let topCategoryPercentage = 0;
  
  if (categoryData.length > 0) {
    const totalCategoryValue = categoryData.reduce((sum, c) => sum + c.value, 0);
    const sortedCategories = [...categoryData].sort((a, b) => b.value - a.value);
    const topCategory = sortedCategories[0];
    
    if (topCategory && totalCategoryValue > 0) {
      topCategoryName = topCategory.name;
      topCategoryPercentage = Math.round((topCategory.value / totalCategoryValue) * 100);
    }
  }
  
  return {
    totalGasto,
    previousPeriodGasto,
    categoryData,
    previousCategoryData,
    monthlyData,
    paymentsCount,
    monthCount,
    topCategoryPercentage,
    topCategoryName,
    paymentsByConcept
  };
}
