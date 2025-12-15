import { type Insight, type InsightContext, type InsightRule } from './types';

/**
 * Insight 1 – Crecimiento explicado (narrativo)
 * Explica QUÉ categoría explica la mayor parte del aumento/reducción del gasto
 */
export const growthExplainedInsight: InsightRule = (context: InsightContext): Insight | null => {
  if (context.previousPeriodGasto === 0 || context.totalGasto === 0) return null;
  
  const growthRate = ((context.totalGasto - context.previousPeriodGasto) / context.previousPeriodGasto) * 100;
  const absoluteChange = context.totalGasto - context.previousPeriodGasto;
  
  if (Math.abs(growthRate) < 15) return null;
  
  const previousCategoryMap = new Map(context.previousCategoryData.map(c => [c.name, c.value]));
  
  let maxImpactCategory = '';
  let maxImpactAmount = 0;
  
  for (const category of context.categoryData) {
    const previousValue = previousCategoryMap.get(category.name) || 0;
    const categoryChange = category.value - previousValue;
    
    if (growthRate > 0 && categoryChange > maxImpactAmount) {
      maxImpactAmount = categoryChange;
      maxImpactCategory = category.name;
    } else if (growthRate < 0 && categoryChange < maxImpactAmount) {
      maxImpactAmount = categoryChange;
      maxImpactCategory = category.name;
    }
  }
  
  if (!maxImpactCategory || maxImpactAmount === 0) return null;
  
  const impactPercentage = Math.round(Math.abs(maxImpactAmount / absoluteChange) * 100);
  
  if (impactPercentage < 25) return null;
  
  if (growthRate > 0) {
    return {
      id: 'growth-explained-increase',
      type: 'warning',
      title: 'Origen del aumento identificado',
      description: `El ${impactPercentage}% del aumento proviene de "${maxImpactCategory}" en este período.`,
      icon: 'TrendingUp',
      priority: 1
    };
  } else {
    return {
      id: 'growth-explained-decrease',
      type: 'info',
      title: 'Origen del ahorro identificado',
      description: `El ${impactPercentage}% de la reducción proviene de "${maxImpactCategory}".`,
      icon: 'TrendingDown',
      priority: 3
    };
  }
};

/**
 * Insight 2 – Alta concentración del gasto
 * Indica cuántas categorías concentran la mayor parte del gasto
 */
export const concentrationNarrativeInsight: InsightRule = (context: InsightContext): Insight | null => {
  if (context.categoryData.length < 2) return null;
  
  const totalValue = context.categoryData.reduce((sum, c) => sum + c.value, 0);
  if (totalValue === 0) return null;
  
  const sortedCategories = [...context.categoryData].sort((a, b) => b.value - a.value);
  
  let accumulatedPercentage = 0;
  let categoriesNeeded = 0;
  
  for (const category of sortedCategories) {
    accumulatedPercentage += (category.value / totalValue) * 100;
    categoriesNeeded++;
    
    if (accumulatedPercentage >= 80) break;
  }
  
  if (categoriesNeeded > 3 || accumulatedPercentage < 70) return null;
  
  const roundedPercentage = Math.round(accumulatedPercentage);
  
  if (categoriesNeeded === 1) {
    return {
      id: 'concentration-single',
      type: 'alert',
      title: 'Concentración crítica',
      description: `Una sola categoría ("${sortedCategories[0].name}") concentra el ${roundedPercentage}% del gasto total.`,
      icon: 'AlertTriangle',
      priority: 1
    };
  }
  
  return {
    id: 'concentration-few',
    type: 'warning',
    title: 'Alta concentración del gasto',
    description: `${categoriesNeeded} categorías concentran el ${roundedPercentage}% del gasto total.`,
    icon: 'PieChart',
    priority: 2
  };
};

/**
 * Insight 3 – Carga operativa elevada
 * Enfocado en la operación, no en dinero
 */
export const operationalLoadInsight: InsightRule = (context: InsightContext): Insight | null => {
  if (context.monthCount === 0) return null;
  
  const paymentsPerMonth = context.paymentsCount / context.monthCount;
  
  if (paymentsPerMonth >= 15) {
    return {
      id: 'operational-load-high',
      type: 'info',
      title: 'Carga operativa elevada',
      description: `Procesás en promedio ${Math.round(paymentsPerMonth)} pagos por mes. Considerá consolidar pagos recurrentes.`,
      icon: 'Repeat',
      priority: 4
    };
  }
  
  return null;
};

/**
 * Insight 4 – Patrón repetido en el tiempo
 * Detecta si un patrón (categoría dominante) se repite varios meses seguidos
 */
export const repeatedPatternInsight: InsightRule = (context: InsightContext): Insight | null => {
  if (context.monthlyData.length < 3) return null;
  
  const values = context.monthlyData.map(m => m.value);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  
  if (mean === 0) return null;
  
  let consecutiveAboveMean = 0;
  let maxConsecutive = 0;
  let currentTrend: 'above' | 'below' | null = null;
  
  for (const value of values) {
    const isAbove = value > mean * 1.1;
    
    if (isAbove) {
      if (currentTrend === 'above') {
        consecutiveAboveMean++;
      } else {
        consecutiveAboveMean = 1;
        currentTrend = 'above';
      }
      maxConsecutive = Math.max(maxConsecutive, consecutiveAboveMean);
    } else {
      currentTrend = null;
      consecutiveAboveMean = 0;
    }
  }
  
  if (maxConsecutive >= 3) {
    return {
      id: 'repeated-pattern',
      type: 'info',
      title: 'Patrón sostenido detectado',
      description: `Este patrón de gasto elevado se repite desde hace ${maxConsecutive} períodos consecutivos.`,
      icon: 'Activity',
      priority: 5
    };
  }
  
  if (context.topCategoryPercentage > 40 && context.monthCount >= 3) {
    return {
      id: 'dominant-category-pattern',
      type: 'info',
      title: 'Categoría dominante consistente',
      description: `"${context.topCategoryName}" mantiene el ${context.topCategoryPercentage}% del gasto de forma sostenida.`,
      icon: 'Tag',
      priority: 5
    };
  }
  
  return null;
};

/**
 * Insight 5 – Oportunidad de consolidación
 * Detecta conceptos con muchos pagos pequeños y frecuentes
 */
export const consolidationOpportunityInsight: InsightRule = (context: InsightContext): Insight | null => {
  if (!context.paymentsByConcept || context.paymentsByConcept.length === 0 || context.monthCount === 0) return null;
  
  const avgPaymentsPerMonthThreshold = 3;
  
  const consolidationCandidates = context.paymentsByConcept.filter(concept => {
    const avgPaymentsPerMonth = concept.paymentsCount / context.monthCount;
    return avgPaymentsPerMonth >= avgPaymentsPerMonthThreshold && concept.paymentsCount >= 6;
  });
  
  if (consolidationCandidates.length === 0) return null;
  
  const topCandidate = consolidationCandidates.reduce((max, c) => 
    c.paymentsCount > max.paymentsCount ? c : max
  );
  
  return {
    id: 'consolidation-opportunity',
    type: 'info',
    title: 'Oportunidad de consolidación',
    description: `"${topCandidate.conceptName}" tiene ${topCandidate.paymentsCount} pagos en el período. Podrías consolidarlos.`,
    icon: 'Layers',
    priority: 6
  };
};

export const allInsightRules: InsightRule[] = [
  growthExplainedInsight,
  concentrationNarrativeInsight,
  operationalLoadInsight,
  repeatedPatternInsight,
  consolidationOpportunityInsight
];
