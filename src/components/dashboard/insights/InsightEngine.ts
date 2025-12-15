import { type Insight, type InsightContext } from './types';
import { allInsightRules } from './insightRules';

export function generateInsights(context: InsightContext, maxInsights: number = 3): Insight[] {
  const insights: Insight[] = [];
  
  for (const rule of allInsightRules) {
    const insight = rule(context);
    if (insight !== null) {
      insights.push(insight);
    }
  }
  
  insights.sort((a, b) => a.priority - b.priority);
  
  return insights.slice(0, maxInsights);
}

export function buildInsightContext(params: {
  totalGasto: number;
  previousPeriodGasto: number;
  categoryData: Array<{ name: string; value: number }>;
  monthlyData: Array<{ month: string; value: number }>;
  paymentsCount: number;
  monthCount: number;
}): InsightContext {
  const { totalGasto, previousPeriodGasto, categoryData, monthlyData, paymentsCount, monthCount } = params;
  
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
    monthlyData,
    paymentsCount,
    monthCount,
    topCategoryPercentage,
    topCategoryName
  };
}
