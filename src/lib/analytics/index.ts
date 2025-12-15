export { calculateHistoricalComparison, formatHistoricalComparison } from './historicalComparison';
export { getPeriodMeta, getKPILabels, calculatePeriodAverage } from './periodMeta';
export {
  detectTrendDirection,
  projectMonthlySpend,
  projectYearEndSpend,
  calculateLinearRegression,
  formatProjectionInsight,
} from './projections';
export type {
  HistoricalComparisonResult,
  HistoricalComparisonOptions,
  ComparisonDirection,
  ComparisonType,
  PeriodMeta,
  KPILabels,
} from './types';
export type {
  TrendDirection,
  TrendAnalysis,
  SpendProjection,
  YearEndProjection,
  ProjectionOptions,
} from './projections';
export { DEFAULT_COMPARISON_OPTIONS } from './types';
