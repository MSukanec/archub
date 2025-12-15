import { type Insight, type InsightContext, type InsightRule } from './types';

export const growthInsight: InsightRule = (context: InsightContext): Insight | null => {
  if (context.previousPeriodGasto === 0) return null;
  
  const growthRate = ((context.totalGasto - context.previousPeriodGasto) / context.previousPeriodGasto) * 100;
  
  if (growthRate > 20) {
    return {
      id: 'growth-warning',
      type: 'warning',
      title: 'Crecimiento significativo del gasto',
      description: `El gasto aumentó un ${Math.round(growthRate)}% respecto al período anterior. Revisá las categorías con mayor incremento.`,
      icon: 'TrendingUp',
      priority: 1
    };
  }
  
  if (growthRate < -20) {
    return {
      id: 'growth-savings',
      type: 'info',
      title: 'Reducción notable del gasto',
      description: `Lograste reducir el gasto un ${Math.abs(Math.round(growthRate))}% respecto al período anterior. ¡Buen trabajo!`,
      icon: 'TrendingDown',
      priority: 3
    };
  }
  
  return null;
};

export const concentrationInsight: InsightRule = (context: InsightContext): Insight | null => {
  if (context.topCategoryPercentage <= 50 || !context.topCategoryName) return null;
  
  return {
    id: 'concentration-warning',
    type: 'warning',
    title: 'Alta concentración de gastos',
    description: `"${context.topCategoryName}" representa el ${context.topCategoryPercentage}% del gasto total. Considerá diversificar o renegociar.`,
    icon: 'PieChart',
    priority: 2
  };
};

export const frequencyInsight: InsightRule = (context: InsightContext): Insight | null => {
  if (context.monthCount === 0) return null;
  
  const paymentsPerMonth = context.paymentsCount / context.monthCount;
  
  if (paymentsPerMonth >= 15) {
    return {
      id: 'frequency-high',
      type: 'info',
      title: 'Alto volumen de pagos',
      description: `Procesás aproximadamente ${Math.round(paymentsPerMonth)} pagos por mes. Considerá automatizar o consolidar pagos recurrentes.`,
      icon: 'Repeat',
      priority: 4
    };
  }
  
  if (paymentsPerMonth <= 2 && context.paymentsCount > 0) {
    return {
      id: 'frequency-low',
      type: 'info',
      title: 'Bajo volumen de pagos',
      description: `Solo tenés ${Math.round(paymentsPerMonth)} pago${paymentsPerMonth === 1 ? '' : 's'} promedio por mes. Asegurate de estar registrando todos los gastos.`,
      icon: 'AlertCircle',
      priority: 5
    };
  }
  
  return null;
};

export const volatilityInsight: InsightRule = (context: InsightContext): Insight | null => {
  if (context.monthlyData.length < 3) return null;
  
  const values = context.monthlyData.map(m => m.value);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  
  if (mean === 0) return null;
  
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;
  const stdDev = Math.sqrt(avgSquaredDiff);
  
  const coefficientOfVariation = (stdDev / mean) * 100;
  
  if (coefficientOfVariation > 50) {
    return {
      id: 'volatility-high',
      type: 'warning',
      title: 'Alta variabilidad mensual',
      description: `Los gastos varían significativamente entre meses (CV: ${Math.round(coefficientOfVariation)}%). Esto puede dificultar la planificación presupuestaria.`,
      icon: 'Activity',
      priority: 3
    };
  }
  
  return null;
};

export const recurrenceInsight: InsightRule = (context: InsightContext): Insight | null => {
  if (context.categoryData.length === 0 || context.monthCount < 2) return null;
  
  const sortedCategories = [...context.categoryData].sort((a, b) => b.value - a.value);
  const topCategory = sortedCategories[0];
  
  if (!topCategory) return null;
  
  const totalValue = context.categoryData.reduce((sum, c) => sum + c.value, 0);
  const categoryShare = totalValue > 0 ? (topCategory.value / totalValue) * 100 : 0;
  
  if (categoryShare >= 25 && categoryShare < 50) {
    return {
      id: 'recurrence-top',
      type: 'info',
      title: 'Categoría predominante identificada',
      description: `"${topCategory.name}" es tu gasto más frecuente con ${Math.round(categoryShare)}% del total. Monitoreá su evolución.`,
      icon: 'Tag',
      priority: 5
    };
  }
  
  return null;
};

export const allInsightRules: InsightRule[] = [
  growthInsight,
  concentrationInsight,
  frequencyInsight,
  volatilityInsight,
  recurrenceInsight
];
