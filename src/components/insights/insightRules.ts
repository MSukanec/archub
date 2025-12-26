import { type Insight, type InsightContext, type InsightRule, type InsightAction } from './types';
import { detectTrendDirection, projectYearEndSpend, formatProjectionInsight } from '@/lib/analytics';
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
      actionHint: `Revisá los conceptos de "${maxImpactCategory}" en este período.`,
      actions: [
        {
          id: 'view-category-concepts',
          label: 'Ver conceptos',
          type: 'navigate',
          payload: { tab: 'concepts', filterCategory: maxImpactCategory }
        }
      ]
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
      actionHint: `Revisá los conceptos de "${maxImpactCategory}" en este período.`,
      actions: [
        {
          id: 'view-category-concepts',
          label: 'Ver conceptos',
          type: 'navigate',
          payload: { tab: 'concepts', filterCategory: maxImpactCategory }
        }
      ]
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
      actionHint: `Revisá "${sortedCategories[0].name}" en el gráfico de categorías.`,
      actions: [
        {
          id: 'filter-category',
          label: 'Ver en gráfico',
          type: 'filter',
          payload: { category: sortedCategories[0].name }
        }
      ]
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
    actionHint: `Revisá "${topCategoryName}" en el gráfico de categorías.`,
    actions: [
      {
        id: 'filter-category',
        label: 'Ver en gráfico',
        type: 'filter',
        payload: { category: topCategoryName }
      }
    ]
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
        actionHint: 'Considerá consolidar pagos recurrentes.',
        actions: [
          {
            id: 'view-payments',
            label: 'Ver pagos',
            type: 'navigate',
            payload: { tab: 'payments'}
          }
        ]
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
      actionHint: 'Considerá consolidar pagos recurrentes.',
      actions: [
        {
          id: 'view-payments',
          label: 'Ver pagos',
          type: 'navigate',
          payload: { tab: 'payments'}
        }
      ]
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
        actionHint: 'Revisá si este nivel de gasto es esperado.',
        actions: [
          {
            id: 'open-monthly-chart',
            label: 'Ver evolución',
            type: 'open',
            payload: { panel: 'monthlyChart'}
          }
        ]
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
  let currentTrend: 'above'| 'below'| null = null;
  
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
      actionHint: 'Revisá si este nivel de gasto es esperado.',
      actions: [
        {
          id: 'open-monthly-chart',
          label: 'Ver evolución',
          type: 'open',
          payload: { panel: 'monthlyChart'}
        }
      ]
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
      actionHint: 'Revisá si este nivel de gasto es esperado.',
      actions: [
        {
          id: 'open-monthly-chart',
          label: 'Ver evolución',
          type: 'open',
          payload: { panel: 'monthlyChart'}
        }
      ]
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
      actionHint: 'Revisá si podés agrupar estos pagos.',
      actions: [
        {
          id: 'view-concept',
          label: 'Ver concepto',
          type: 'navigate',
          payload: { tab: 'concepts', filterConcept: topCandidate.conceptName }
        }
      ]
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
    actionHint: 'Revisá si podés agrupar estos pagos.',
    actions: [
      {
        id: 'view-concept',
        label: 'Ver concepto',
        type: 'navigate',
        payload: { tab: 'concepts', filterConcept: topCandidate.conceptName }
      }
    ]
  };
};
/**
 * Insight 6 – Tendencia sostenida de gasto
 * Detecta si hay una tendencia clara (ascendente/descendente) en los últimos meses
 */
export const sustainedTrendInsight: InsightRule = (context: InsightContext): Insight | null => {
  if (context.isShortPeriod || context.monthlyData.length < 3) return null;
  const values = context.monthlyData.map(m => m.value);
  const trend = detectTrendDirection(values, { minDataPoints: 3, stableThresholdPercent: 4 });
  if (!trend || trend.direction === 'stable') return null;
  if (trend.confidence === 'low') return null;
  const changePercent = Math.abs(trend.monthlyChangePercent);
  if (changePercent < 5) return null;
  const isIncreasing = trend.direction === 'increasing';
  const confidenceText = trend.confidence === 'high'? 'consistente': 'moderada';
  return {
    id: isIncreasing ? 'sustained-trend-up': 'sustained-trend-down',
    type: isIncreasing ? 'warning': 'info',
    title: isIncreasing ? 'Tendencia de aumento sostenido': 'Tendencia de reducción sostenida',
    description: `El gasto ${isIncreasing ? 'aumenta': 'disminuye'} ~${Math.round(changePercent)}% mensual en promedio.`,
    icon: isIncreasing ? 'TrendingUp': 'TrendingDown',
    priority: 2,
    context: `Tendencia ${confidenceText} basada en ${context.monthlyData.length} meses de datos.`,
    actionHint: isIncreasing 
      ? 'Revisá qué categorías están impulsando el aumento.'
      : 'Verificá si esta reducción es planificada.',
    actions: [
      {
        id: 'view-monthly-trend',
        label: 'Ver evolución',
        type: 'open',
        payload: { panel: 'monthlyChart'}
      }
    ]
  };
};
/**
 * Insight 7 – Proyección de cierre anual
 * Proyecta el gasto al cierre del año basándose en la tendencia actual
 * Solo considera los meses del año actual (últimos N meses según currentMonth)
 */
export const yearEndProjectionInsight: InsightRule = (context: InsightContext): Insight | null => {
  if (context.isShortPeriod || context.monthlyData.length < 3) return null;
  const currentMonth = context.currentMonth ?? new Date().getMonth() + 1;
  
  if (currentMonth >= 11) return null;
  const allValues = context.monthlyData.map(m => m.value);
  const currentYearMonths = Math.min(currentMonth, allValues.length);
  const currentYearValues = allValues.slice(-currentYearMonths);
  if (currentYearValues.length < 3) return null;
  const projection = projectYearEndSpend(currentYearValues, currentMonth, { minDataPoints: 3 });
  if (!projection) return null;
  if (projection.direction === 'stable') return null;
  const changePercent = Math.abs(projection.changePercent);
  if (changePercent < 5) return null;
  const isUp = projection.direction === 'up';
  const projectionText = formatProjectionInsight(projection, 'yearEnd');
  return {
    id: isUp ? 'year-end-projection-up': 'year-end-projection-down',
    type: isUp ? 'warning': 'info',
    title: 'Proyección de cierre anual',
    description: projectionText,
    icon: 'Calendar',
    priority: 3,
    context: `Proyección basada en ${currentYearValues.length} meses del año actual, quedan ${projection.monthsRemaining} meses.`,
    actionHint: isUp 
      ? 'Considerá ajustar el presupuesto si el aumento no es planificado.'
      : 'El gasto proyectado está por debajo del promedio histórico.',
    actions: [
      {
        id: 'view-monthly-trend',
        label: 'Ver evolución',
        type: 'open',
        payload: { panel: 'monthlyChart'}
      }
    ]
  };
};
/**
 * Insight 8 – Alerta de aceleración del gasto
 * Detecta si el gasto está acelerando (aumento del ritmo de crecimiento)
 */
export const spendAccelerationInsight: InsightRule = (context: InsightContext): Insight | null => {
  if (context.isShortPeriod || context.monthlyData.length < 4) return null;
  const values = context.monthlyData.map(m => m.value);
  
  const midPoint = Math.floor(values.length / 2);
  const firstHalf = values.slice(0, midPoint);
  const secondHalf = values.slice(midPoint);
  if (firstHalf.length < 2 || secondHalf.length < 2) return null;
  const firstHalfTrend = detectTrendDirection(firstHalf, { minDataPoints: 2 });
  const secondHalfTrend = detectTrendDirection(secondHalf, { minDataPoints: 2 });
  if (!firstHalfTrend || !secondHalfTrend) return null;
  const accelerationDelta = secondHalfTrend.monthlyChangePercent - firstHalfTrend.monthlyChangePercent;
  if (Math.abs(accelerationDelta) < 5) return null;
  const isAccelerating = accelerationDelta > 0;
  if (isAccelerating && secondHalfTrend.direction !== 'increasing') return null;
  if (!isAccelerating && secondHalfTrend.direction !== 'decreasing') return null;
  return {
    id: isAccelerating ? 'spend-accelerating': 'spend-decelerating',
    type: isAccelerating ? 'alert': 'info',
    title: isAccelerating ? 'El gasto está acelerando': 'El gasto está desacelerando',
    description: isAccelerating
      ? `El ritmo de aumento pasó de ${Math.round(firstHalfTrend.monthlyChangePercent)}% a ${Math.round(secondHalfTrend.monthlyChangePercent)}% mensual.`
      : `El ritmo de cambio pasó de ${Math.round(firstHalfTrend.monthlyChangePercent)}% a ${Math.round(secondHalfTrend.monthlyChangePercent)}% mensual.`,
    icon: isAccelerating ? 'Zap': 'Minus',
    priority: isAccelerating ? 1 : 4,
    context: `Comparando la primera y segunda mitad del período seleccionado.`,
    actionHint: isAccelerating 
      ? 'El gasto crece cada vez más rápido. Revisá las causas.'
      : 'El ritmo de cambio se está moderando.',
    actions: [
      {
        id: 'view-monthly-trend',
        label: 'Ver evolución',
        type: 'open',
        payload: { panel: 'monthlyChart'}
      }
    ]
  };
};
/**
 * Insight 9 – Balance negativo sostenido
 * Detecta cuando hay déficit financiero en múltiples períodos consecutivos
 */
export const sustainedNegativeBalanceInsight: InsightRule = (context: InsightContext): Insight | null => {
  if (!context.monthlyFinancialData || context.monthlyFinancialData.length < 2) return null;
  
  const sortedData = [...context.monthlyFinancialData].sort((a, b) => a.month.localeCompare(b.month));
  
  let consecutiveNegative = 0;
  let maxConsecutiveNegative = 0;
  
  for (const monthData of sortedData) {
    if (monthData.balance < 0) {
      consecutiveNegative++;
      maxConsecutiveNegative = Math.max(maxConsecutiveNegative, consecutiveNegative);
    } else {
      consecutiveNegative = 0;
    }
  }
  
  if (maxConsecutiveNegative < 2) return null;
  
  const currentBalance = context.balance ?? 0;
  const isCurrentlyNegative = currentBalance < 0;
  
  if (maxConsecutiveNegative >= 3) {
    return {
      id: 'sustained-negative-balance-critical',
      type: 'alert',
      title: 'Déficit financiero sostenido',
      description: `El balance ha sido negativo durante ${maxConsecutiveNegative} meses consecutivos.`,
      icon: 'AlertTriangle',
      priority: 1,
      context: isCurrentlyNegative 
        ? `El balance actual sigue siendo negativo.`
        : `El balance se ha recuperado en el período actual.`,
      actionHint: 'Revisá los egresos y buscá oportunidades de incrementar ingresos.',
      actions: [
        {
          id: 'view-income-expense',
          label: 'Ver ingresos vs egresos',
          type: 'open',
          payload: { panel: 'incomeExpenseChart'}
        }
      ]
    };
  }
  
  return {
    id: 'sustained-negative-balance-warning',
    type: 'warning',
    title: 'Balance negativo reciente',
    description: `El balance fue negativo durante ${maxConsecutiveNegative} meses consecutivos.`,
    icon: 'TrendingDown',
    priority: 2,
    context: 'Los egresos superaron a los ingresos en múltiples períodos.',
    actionHint: 'Monitoreá la evolución del balance.',
    actions: [
      {
        id: 'view-income-expense',
        label: 'Ver ingresos vs egresos',
        type: 'open',
        payload: { panel: 'incomeExpenseChart'}
      }
    ]
  };
};
/**
 * Insight 10 – Dependencia de un proyecto
 * Detecta cuando un solo proyecto representa la mayoría de los ingresos o egresos
 */
export const projectDependencyInsight: InsightRule = (context: InsightContext): Insight | null => {
  if (!context.projectFinancialData || context.projectFinancialData.length < 2) return null;
  
  const totalIncome = context.projectFinancialData.reduce((sum, p) => sum + p.income, 0);
  const totalExpense = context.projectFinancialData.reduce((sum, p) => sum + Math.abs(p.expense), 0);
  
  if (totalIncome === 0 && totalExpense === 0) return null;
  
  const sortedByIncome = [...context.projectFinancialData].sort((a, b) => b.income - a.income);
  const topIncomeProject = sortedByIncome[0];
  const topIncomePercentage = totalIncome > 0 ? Math.round((topIncomeProject.income / totalIncome) * 100) : 0;
  
  const sortedByExpense = [...context.projectFinancialData].sort((a, b) => Math.abs(b.expense) - Math.abs(a.expense));
  const topExpenseProject = sortedByExpense[0];
  const topExpensePercentage = totalExpense > 0 ? Math.round((Math.abs(topExpenseProject.expense) / totalExpense) * 100) : 0;
  
  if (topIncomePercentage >= 70 && totalIncome > 0) {
    return {
      id: 'project-income-dependency',
      type: topIncomePercentage >= 85 ? 'alert': 'warning',
      title: 'Alta dependencia de ingresos',
      description: `El proyecto "${topIncomeProject.projectName}" representa el ${topIncomePercentage}% de los ingresos.`,
      icon: 'Target',
      priority: topIncomePercentage >= 85 ? 1 : 2,
      context: 'La diversificación de ingresos reduce el riesgo financiero.',
      actionHint: 'Considerá expandir la cartera de proyectos con facturación.',
      actions: [
        {
          id: 'view-category-breakdown',
          label: 'Ver distribución',
          type: 'open',
          payload: { panel: 'categoryBreakdown'}
        }
      ]
    };
  }
  
  if (topExpensePercentage >= 70 && totalExpense > 0) {
    return {
      id: 'project-expense-concentration',
      type: 'info',
      title: 'Concentración de egresos',
      description: `El proyecto "${topExpenseProject.projectName}" concentra el ${topExpensePercentage}% de los egresos.`,
      icon: 'Wallet',
      priority: 4,
      context: 'Este proyecto demanda la mayor inversión actualmente.',
      actionHint: 'Verificá que el proyecto esté generando el retorno esperado.',
      actions: [
        {
          id: 'view-category-breakdown',
          label: 'Ver distribución',
          type: 'open',
          payload: { panel: 'categoryBreakdown'}
        }
      ]
    };
  }
  
  return null;
};
/**
 * Insight 11 – Ratio ingreso/egreso desfavorable
 * Detecta cuando los egresos son significativamente mayores que los ingresos
 */
export const incomeExpenseRatioInsight: InsightRule = (context: InsightContext): Insight | null => {
  const totalIngresos = context.totalIngresos ?? 0;
  const totalEgresos = context.totalEgresos ?? 0;
  
  if (totalIngresos === 0 && totalEgresos === 0) return null;
  
  if (totalIngresos === 0 && totalEgresos > 0) {
    return {
      id: 'no-income-recorded',
      type: 'warning',
      title: 'Sin ingresos registrados',
      description: 'No hay ingresos en este período, pero sí hay egresos.',
      icon: 'AlertCircle',
      priority: 2,
      context: 'Puede que falten registrar cobros de clientes o aportes.',
      actionHint: 'Verificá si hay cobros pendientes de registrar.',
      actions: [
        {
          id: 'view-movements',
          label: 'Ver movimientos',
          type: 'navigate',
          payload: { tab: 'movements'}
        }
      ]
    };
  }
  
  if (totalIngresos > 0) {
    const ratio = totalEgresos / totalIngresos;
    
    if (ratio >= 1.5) {
      return {
        id: 'high-expense-ratio',
        type: 'alert',
        title: 'Egresos superan ingresos',
        description: `Los egresos son ${ratio.toFixed(1)}x mayores que los ingresos.`,
        icon: 'Scale',
        priority: 1,
        context: 'El flujo de caja está siendo afectado negativamente.',
        actionHint: 'Revisá los egresos mayores y buscá optimizarlos.',
        actions: [
          {
            id: 'view-category-breakdown',
            label: 'Ver distribución',
            type: 'open',
            payload: { panel: 'categoryBreakdown'}
          }
        ]
      };
    }
    
    if (ratio >= 1.0 && ratio < 1.5) {
      return {
        id: 'expense-exceeds-income',
        type: 'warning',
        title: 'Balance negativo',
        description: `Los egresos superan a los ingresos en un ${Math.round((ratio - 1) * 100)}%.`,
        icon: 'TrendingDown',
        priority: 3,
        context: 'El período cerró con déficit financiero.',
        actionHint: 'Monitoreá la evolución del balance.',
        actions: [
          {
            id: 'view-monthly-trend',
            label: 'Ver evolución',
            type: 'open',
            payload: { panel: 'monthlyChart'}
          }
        ]
      };
    }
  }
  
  return null;
};
export const allInsightRules: InsightRule[] = [
  growthExplainedInsight,
  concentrationNarrativeInsight,
  operationalLoadInsight,
  repeatedPatternInsight,
  consolidationOpportunityInsight,
  sustainedTrendInsight,
  yearEndProjectionInsight,
  spendAccelerationInsight,
  sustainedNegativeBalanceInsight,
  projectDependencyInsight,
  incomeExpenseRatioInsight
];
export const financialInsightRules: InsightRule[] = [
  sustainedNegativeBalanceInsight,
  projectDependencyInsight,
  incomeExpenseRatioInsight,
  concentrationNarrativeInsight,
  operationalLoadInsight,
  sustainedTrendInsight,
  spendAccelerationInsight
];
