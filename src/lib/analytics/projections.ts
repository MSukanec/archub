import type { ComparisonDirection } from './types';
export type TrendDirection = 'increasing'| 'decreasing'| 'stable';
export interface TrendAnalysis {
  direction: TrendDirection;
  monthlyChangePercent: number;
  averageMonthlyChange: number;
  confidence: 'low'| 'medium'| 'high';
}
export interface SpendProjection {
  projectedValue: number;
  currentValue: number;
  changePercent: number;
  direction: ComparisonDirection;
  monthsAhead: number;
  confidence: 'low'| 'medium'| 'high';
}
export interface YearEndProjection {
  projectedAnnualSpend: number;
  currentAnnualSpend: number;
  changePercent: number;
  direction: ComparisonDirection;
  monthsRemaining: number;
  confidence: 'low'| 'medium'| 'high';
}
export interface ProjectionOptions {
  minDataPoints?: number;
  stableThresholdPercent?: number;
}
const DEFAULT_PROJECTION_OPTIONS: Required<ProjectionOptions> = {
  minDataPoints: 3,
  stableThresholdPercent: 5,
};
export function detectTrendDirection(
  monthlyValues: number[],
  options: ProjectionOptions = {}
): TrendAnalysis | null {
  const { minDataPoints, stableThresholdPercent } = {
    ...DEFAULT_PROJECTION_OPTIONS,
    ...options,
  };
  if (monthlyValues.length < minDataPoints) {
    return null;
  }
  const changes: number[] = [];
  for (let i = 1; i < monthlyValues.length; i++) {
    changes.push(monthlyValues[i] - monthlyValues[i - 1]);
  }
  const averageChange = changes.reduce((sum, c) => sum + c, 0) / changes.length;
  const avgValue = monthlyValues.reduce((sum, v) => sum + v, 0) / monthlyValues.length;
  if (avgValue === 0) {
    return null;
  }
  const monthlyChangePercent = (averageChange / avgValue) * 100;
  let direction: TrendDirection;
  if (Math.abs(monthlyChangePercent) <= stableThresholdPercent) {
    direction = 'stable';
  } else if (averageChange > 0) {
    direction = 'increasing';
  } else {
    direction = 'decreasing';
  }
  const positiveChanges = changes.filter(c => c > 0).length;
  const negativeChanges = changes.filter(c => c < 0).length;
  const consistencyRatio = Math.max(positiveChanges, negativeChanges) / changes.length;
  let confidence: 'low'| 'medium'| 'high';
  if (monthlyValues.length >= 6 && consistencyRatio >= 0.7) {
    confidence = 'high';
  } else if (monthlyValues.length >= 4 && consistencyRatio >= 0.5) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }
  return {
    direction,
    monthlyChangePercent: Math.round(monthlyChangePercent * 10) / 10,
    averageMonthlyChange: Math.round(averageChange * 100) / 100,
    confidence,
  };
}
export function projectMonthlySpend(
  monthlyValues: number[],
  monthsAhead: number = 1,
  options: ProjectionOptions = {}
): SpendProjection | null {
  const { minDataPoints, stableThresholdPercent } = {
    ...DEFAULT_PROJECTION_OPTIONS,
    ...options,
  };
  if (monthlyValues.length < minDataPoints) {
    return null;
  }
  const trend = detectTrendDirection(monthlyValues, options);
  if (!trend) {
    return null;
  }
  const currentValue = monthlyValues[monthlyValues.length - 1];
  const projectedValue = currentValue + (trend.averageMonthlyChange * monthsAhead);
  const changePercent = currentValue !== 0
    ? ((projectedValue - currentValue) / currentValue) * 100
    : 0;
  let direction: ComparisonDirection;
  if (Math.abs(changePercent) <= stableThresholdPercent) {
    direction = 'stable';
  } else if (changePercent > 0) {
    direction = 'up';
  } else {
    direction = 'down';
  }
  return {
    projectedValue: Math.max(0, Math.round(projectedValue * 100) / 100),
    currentValue,
    changePercent: Math.round(changePercent * 10) / 10,
    direction,
    monthsAhead,
    confidence: trend.confidence,
  };
}
export function projectYearEndSpend(
  monthlyValues: number[],
  currentMonth: number = new Date().getMonth() + 1,
  options: ProjectionOptions = {}
): YearEndProjection | null {
  const { minDataPoints } = {
    ...DEFAULT_PROJECTION_OPTIONS,
    ...options,
  };
  if (monthlyValues.length < minDataPoints) {
    return null;
  }
  const monthsRemaining = 12 - currentMonth;
  if (monthsRemaining <= 0) {
    return null;
  }
  const currentYearMonths = Math.min(currentMonth, monthlyValues.length);
  const currentYearValues = monthlyValues.slice(-currentYearMonths);
  const trend = detectTrendDirection(currentYearValues, options);
  if (!trend) {
    return null;
  }
  const currentAnnualSpend = currentYearValues.reduce((sum, v) => sum + v, 0);
  const currentMonthValue = currentYearValues[currentYearValues.length - 1];
  let projectedRemainingSpend = 0;
  for (let i = 1; i <= monthsRemaining; i++) {
    projectedRemainingSpend += currentMonthValue + (trend.averageMonthlyChange * i);
  }
  projectedRemainingSpend = Math.max(0, projectedRemainingSpend);
  const projectedAnnualSpend = currentAnnualSpend + projectedRemainingSpend;
  const avgMonthlySpend = currentAnnualSpend / currentYearMonths;
  const baselineAnnualSpend = avgMonthlySpend * 12;
  
  const changePercent = baselineAnnualSpend !== 0
    ? ((projectedAnnualSpend - baselineAnnualSpend) / baselineAnnualSpend) * 100
    : 0;
  let direction: ComparisonDirection;
  if (Math.abs(changePercent) <= 5) {
    direction = 'stable';
  } else if (changePercent > 0) {
    direction = 'up';
  } else {
    direction = 'down';
  }
  return {
    projectedAnnualSpend: Math.round(projectedAnnualSpend * 100) / 100,
    currentAnnualSpend: Math.round(currentAnnualSpend * 100) / 100,
    changePercent: Math.round(changePercent * 10) / 10,
    direction,
    monthsRemaining,
    confidence: trend.confidence,
  };
}
export function calculateLinearRegression(values: number[]): {
  slope: number;
  intercept: number;
  rSquared: number;
} | null {
  if (values.length < 2) {
    return null;
  }
  const n = values.length;
  const xs = Array.from({ length: n }, (_, i) => i);
  
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((sum, x, i) => sum + x * values[i], 0);
  const sumXX = xs.reduce((sum, x) => sum + x * x, 0);
  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) {
    return null;
  }
  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;
  const meanY = sumY / n;
  const ssTotal = values.reduce((sum, y) => sum + Math.pow(y - meanY, 2), 0);
  const ssResidual = values.reduce((sum, y, i) => {
    const predicted = intercept + slope * i;
    return sum + Math.pow(y - predicted, 2);
  }, 0);
  const rSquared = ssTotal !== 0 ? 1 - (ssResidual / ssTotal) : 0;
  return {
    slope: Math.round(slope * 100) / 100,
    intercept: Math.round(intercept * 100) / 100,
    rSquared: Math.round(rSquared * 1000) / 1000,
  };
}
export function formatProjectionInsight(
  projection: SpendProjection | YearEndProjection,
  type: 'monthly'| 'yearEnd'
): string {
  const sign = projection.changePercent > 0 ? '+': '';
  const changeText = `${sign}${projection.changePercent}%`;
  if (type === 'monthly') {
    const p = projection as SpendProjection;
    if (p.direction === 'stable') {
      return `El gasto se mantendría estable en los próximos ${p.monthsAhead} mes(es).`;
    }
    const verb = p.direction === 'up'? 'aumentaría': 'disminuiría';
    return `Si continúa la tendencia actual, el gasto ${verb} ${changeText} en ${p.monthsAhead} mes(es).`;
  }
  const p = projection as YearEndProjection;
  if (p.direction === 'stable') {
    return `El cierre anual se mantendría en línea con el promedio mensual actual.`;
  }
  const verb = p.direction === 'up'? 'sería mayor': 'sería menor';
  return `Si el gasto continúa a este ritmo, el cierre anual ${verb} en un ${Math.abs(p.changePercent)}%.`;
}
