export type ComparisonDirection = 'up'| 'down'| 'stable';
export type ComparisonType = 'above_average'| 'below_average'| 'at_average';
export interface HistoricalComparisonResult {
  deltaPercent: number;
  direction: ComparisonDirection;
  comparisonType: ComparisonType;
  historicalAverage: number;
  currentValue: number;
  dataPoints: number;
}
export interface HistoricalComparisonOptions {
  windowSize?: number;
  minDataPoints?: number;
  stableThresholdPercent?: number;
}
export const DEFAULT_COMPARISON_OPTIONS: Required<HistoricalComparisonOptions> = {
  windowSize: 6,
  minDataPoints: 3,
  stableThresholdPercent: 5,
};
export interface PeriodMeta {
  monthsCount: number;
  daysCount: number;
  isShortPeriod: boolean;
  periodType: 'days'| 'months'| 'years';
}
export interface KPILabels {
  totalTitle: string;
  totalHelper: string;
  averageTitle: string;
  averageHelper: string;
}
