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
  
  const roundedGrowthRate = Math.round(Math.abs(growthRate));
  
  if (growthRate > 0) {
    return {
      id: 'growth-explained-increase',
      type: 'warning',
      title: 'Origen del aumento identificado',
      description: `El ${impactPercentage}% del aumento proviene de "${maxImpactCategory}" en este período.`,
      icon: 'TrendingUp',
      priority: 1,
      context: `"${maxImpactCategory}" creció un ${roundedGrowthRate}% respecto al período anterior.`,
      actionHint: `Revisá los conceptos de "${maxImpactCategory}" en este período.`
    };
  } else {
    return {
      id: 'growth-explained-decrease',
      type: 'info',
      title: 'Origen del ahorro identificado',
      description: `El ${impactPercentage}% de la reducción proviene de "${maxImpactCategory}".`,
      icon: 'TrendingDown',
      priority: 3,
      context: `"${maxImpactCategory}" se redujo un ${roundedGrowthRate}% respecto al período anterior.`,
      actionHint: `Revisá los conceptos de "${maxImpactCategory}" en este período.`
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
      priority: 1,
      context: `"${sortedCategories[0].name}" lidera con el ${roundedPercentage}%.`,
      actionHint: `Revisá "${sortedCategories[0].name}" en el gráfico de categorías.`
    };
  }
  
  const topCategoryName = sortedCategories[0]?.name || '';
  const topCategoryPercentage = sortedCategories[0] ? Math.round((sortedCategories[0].value / totalValue) * 100) : 0;
  
  return {
    id: 'concentration-few',
    type: 'warning',
    title: 'Alta concentración del gasto',
    description: `${categoriesNeeded} categorías concentran el ${roundedPercentage}% del gasto total.`,
    icon: 'PieChart',
    priority: 2,
    context: `"${topCategoryName}" lidera con el ${topCategoryPercentage}%.`,
    actionHint: `Revisá "${topCategoryName}" en el gráfico de categorías.`
  };
};

/**
 * Insight 3 – Carga operativa elevada
 * Enfocado en la operación, no en dinero
 * Ajustado para períodos cortos: usa pagos por semana en lugar de pagos por mes
 * Umbral: 15 pagos/mes = ~3.5 pagos/semana, redondeamos a 3.5 para mantener paridad
 */
export const operationalLoadInsight: InsightRule = (context: InsightContext): Insight | null => {
  if (context.isShortPeriod) {
    if (context.daysCount < 7) return null;
    
    const weeksCount = context.daysCount / 7;
    const paymentsPerWeek = context.paymentsCount / weeksCount;
    
    if (paymentsPerWeek >= 3.5) {
      const displayRate = paymentsPerWeek >= 5 
        ? Math.round(paymentsPerWeek) 
        : paymentsPerWeek.toFixed(1).replace('.0', '');
      return {
        id: 'operational-load-high-short',
        type: 'info',
        title: 'Carga operativa elevada',
        description: `Procesás en promedio ${displayRate} pagos por semana.`,
        icon: 'Repeat',
        priority: 4,
        context: `Esto representa ${context.paymentsCount} pagos en total.`,
        actionHint: 'Considerá consolidar pagos recurrentes.'
      };
    }
    return null;
  }
  
  if (context.monthCount === 0) return null;
  
  const paymentsPerMonth = context.paymentsCount / context.monthCount;
  
  if (paymentsPerMonth >= 15) {
    return {
      id: 'operational-load-high',
      type: 'info',
      title: 'Carga operativa elevada',
      description: `Procesás en promedio ${Math.round(paymentsPerMonth)} pagos por mes.`,
      icon: 'Repeat',
      priority: 4,
      context: `Esto representa ${context.paymentsCount} pagos en total.`,
      actionHint: 'Considerá consolidar pagos recurrentes.'
    };
  }
  
  return null;
};

/**
 * Insight 4 – Patrón repetido en el tiempo
 * Detecta si un patrón (categoría dominante) se repite varios meses seguidos
 * Para períodos cortos: muestra categoría dominante si supera el 50% y hay suficiente actividad
 * Requiere al menos 3 pagos para que el insight sea significativo
 */
export const repeatedPatternInsight: InsightRule = (context: InsightContext): Insight | null => {
  if (context.isShortPeriod) {
    if (context.topCategoryPercentage > 50 && context.paymentsCount >= 3) {
      return {
        id: 'dominant-category-short',
        type: 'info',
        title: 'Categoría dominante',
        description: `"${context.topCategoryName}" concentra el ${context.topCategoryPercentage}% del gasto en este período.`,
        icon: 'Tag',
        priority: 5,
        context: 'Este patrón se observa en el período actual.',
        actionHint: 'Revisá si este nivel de gasto es esperado.'
      };
    }
    return null;
  }
  
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
      priority: 5,
      context: `Este patrón comenzó hace ${maxConsecutive} períodos.`,
      actionHint: 'Revisá si este nivel de gasto es esperado.'
    };
  }
  
  if (context.topCategoryPercentage > 40 && context.monthCount >= 3) {
    return {
      id: 'dominant-category-pattern',
      type: 'info',
      title: 'Categoría dominante consistente',
      description: `"${context.topCategoryName}" mantiene el ${context.topCategoryPercentage}% del gasto de forma sostenida.`,
      icon: 'Tag',
      priority: 5,
      context: `Este patrón comenzó hace ${context.monthCount} períodos.`,
      actionHint: 'Revisá si este nivel de gasto es esperado.'
    };
  }
  
  return null;
};

/**
 * Insight 5 – Oportunidad de consolidación
 * Detecta conceptos con muchos pagos pequeños y frecuentes
 * Para períodos cortos: ajusta umbrales (>=3 pagos en el período)
 */
export const consolidationOpportunityInsight: InsightRule = (context: InsightContext): Insight | null => {
  if (!context.paymentsByConcept || context.paymentsByConcept.length === 0) return null;
  
  if (context.isShortPeriod) {
    const consolidationCandidates = context.paymentsByConcept.filter(concept => 
      concept.paymentsCount >= 3
    );
    
    if (consolidationCandidates.length === 0) return null;
    
    const topCandidate = consolidationCandidates.reduce((max, c) => 
      c.paymentsCount > max.paymentsCount ? c : max
    );
    
    const totalPayments = context.paymentsByConcept.reduce((sum, c) => sum + c.paymentsCount, 0);
    const conceptPercentage = totalPayments > 0 ? Math.round((topCandidate.paymentsCount / totalPayments) * 100) : 0;
    
    return {
      id: 'consolidation-opportunity-short',
      type: 'info',
      title: 'Oportunidad de consolidación',
      description: `"${topCandidate.conceptName}" tiene ${topCandidate.paymentsCount} pagos en el período.`,
      icon: 'Layers',
      priority: 6,
      context: `Este concepto representa el ${conceptPercentage}% del total de pagos.`,
      actionHint: 'Revisá si podés agrupar estos pagos.'
    };
  }
  
  if (context.monthCount === 0) return null;
  
  const avgPaymentsPerMonthThreshold = 3;
  
  const consolidationCandidates = context.paymentsByConcept.filter(concept => {
    const avgPaymentsPerMonth = concept.paymentsCount / context.monthCount;
    return avgPaymentsPerMonth >= avgPaymentsPerMonthThreshold && concept.paymentsCount >= 6;
  });
  
  if (consolidationCandidates.length === 0) return null;
  
  const topCandidate = consolidationCandidates.reduce((max, c) => 
    c.paymentsCount > max.paymentsCount ? c : max
  );
  
  const totalPayments = context.paymentsByConcept.reduce((sum, c) => sum + c.paymentsCount, 0);
  const conceptPercentage = totalPayments > 0 ? Math.round((topCandidate.paymentsCount / totalPayments) * 100) : 0;
  
  return {
    id: 'consolidation-opportunity',
    type: 'info',
    title: 'Oportunidad de consolidación',
    description: `"${topCandidate.conceptName}" tiene ${topCandidate.paymentsCount} pagos en el período.`,
    icon: 'Layers',
    priority: 6,
    context: `Este concepto representa el ${conceptPercentage}% del total de pagos.`,
    actionHint: 'Revisá si podés agrupar estos pagos.'
  };
};

export const allInsightRules: InsightRule[] = [
  growthExplainedInsight,
  concentrationNarrativeInsight,
  operationalLoadInsight,
  repeatedPatternInsight,
  consolidationOpportunityInsight
];
