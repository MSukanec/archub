import { type PeriodMeta, type KPILabels } from './types';

export function getPeriodMeta(startDate: Date | null, endDate: Date): PeriodMeta {
  if (!startDate) {
    return {
      monthsCount: 12,
      daysCount: 365,
      isShortPeriod: false,
      periodType: 'years'
    };
  }

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysCount = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / msPerDay));
  
  const monthsCount = Math.max(1, Math.round(daysCount / 30));
  
  const isShortPeriod = daysCount < 60;
  
  let periodType: 'days' | 'months' | 'years';
  if (daysCount <= 60) {
    periodType = 'days';
  } else if (daysCount <= 365) {
    periodType = 'months';
  } else {
    periodType = 'years';
  }

  return {
    monthsCount,
    daysCount,
    isShortPeriod,
    periodType
  };
}

export function getKPILabels(periodMeta: PeriodMeta): KPILabels {
  if (periodMeta.isShortPeriod) {
    return {
      totalTitle: 'Gasto del período',
      totalHelper: 'Total acumulado en el período seleccionado',
      averageTitle: 'Promedio diario',
      averageHelper: `Promedio por día (${periodMeta.daysCount} días)`
    };
  }

  return {
    totalTitle: 'Gasto Total',
    totalHelper: `Total acumulado en ${periodMeta.monthsCount} meses`,
    averageTitle: 'Promedio Mensual',
    averageHelper: `Promedio por mes (${periodMeta.monthsCount} meses)`
  };
}

export function calculatePeriodAverage(
  totalValue: number,
  periodMeta: PeriodMeta
): { value: number; divisor: number; unit: string } {
  if (periodMeta.isShortPeriod) {
    return {
      value: totalValue / periodMeta.daysCount,
      divisor: periodMeta.daysCount,
      unit: 'día'
    };
  }

  return {
    value: totalValue / periodMeta.monthsCount,
    divisor: periodMeta.monthsCount,
    unit: 'mes'
  };
}
