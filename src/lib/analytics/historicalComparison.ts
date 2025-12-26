import {
  type HistoricalComparisonResult,
  type HistoricalComparisonOptions,
  type ComparisonDirection,
  type ComparisonType,
  DEFAULT_COMPARISON_OPTIONS,
} from './types';
export function calculateHistoricalComparison(
  currentValue: number,
  historicalValues: number[],
  options: HistoricalComparisonOptions = {}
): HistoricalComparisonResult | null {
  const { windowSize, minDataPoints, stableThresholdPercent } = {
    ...DEFAULT_COMPARISON_OPTIONS,
    ...options,
  };
  const relevantValues = historicalValues.slice(-windowSize);
  
  if (relevantValues.length < minDataPoints) {
    return null;
  }
  const sum = relevantValues.reduce((acc, val) => acc + val, 0);
  const historicalAverage = sum / relevantValues.length;
  if (historicalAverage === 0) {
    return null;
  }
  const deltaPercent = ((currentValue - historicalAverage) / historicalAverage) * 100;
  const absoluteDelta = Math.abs(deltaPercent);
  let direction: ComparisonDirection;
  if (absoluteDelta <= stableThresholdPercent) {
    direction = 'stable';
  } else if (deltaPercent > 0) {
    direction = 'up';
  } else {
    direction = 'down';
  }
  let comparisonType: ComparisonType;
  if (absoluteDelta <= stableThresholdPercent) {
    comparisonType = 'at_average';
  } else if (deltaPercent > 0) {
    comparisonType = 'above_average';
  } else {
    comparisonType = 'below_average';
  }
  return {
    deltaPercent: Math.round(deltaPercent * 10) / 10,
    direction,
    comparisonType,
    historicalAverage: Math.round(historicalAverage * 100) / 100,
    currentValue,
    dataPoints: relevantValues.length,
  };
}
export function formatHistoricalComparison(
  result: HistoricalComparisonResult | null,
  options?: { prefix?: string; suffix?: string }
): string | null {
  if (!result) return null;
  const { prefix = '', suffix = 'vs promedio'} = options ?? {};
  const sign = result.deltaPercent > 0 ? '+': '';
  
  return `${prefix}${sign}${result.deltaPercent}% ${suffix}`;
}
