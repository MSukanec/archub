import { useMemo } from 'react';
import type { GeneralCost } from '../types';
interface GeneralCostsMetrics {
  totalCosts: number;
  timeline: { value: number; date: Date }[];
}
/**
 * Hook para calcular métricas de gastos generales.
 * 
 * Calcula estadísticas sobre gastos generales incluyendo:
 * - Total de conceptos de gastos generales
 * - Timeline de creación de gastos por fecha
 * 
 * @param generalCosts - Array de gastos generales
 * @returns GeneralCostsMetrics con las estadísticas calculadas
 */
export function useGeneralCostsMetrics(generalCosts: GeneralCost[]): GeneralCostsMetrics {
  return useMemo(() => {
    const totalCosts = generalCosts.length;
    // Generate historical timeline with running total
    // First, collect all general cost creation dates
    const costDates: Date[] = [];
    
    generalCosts.forEach(cost => {
      if (!cost.created_at) return;
      try {
        const date = new Date(cost.created_at);
        // Reset time to midnight for proper grouping
        date.setHours(0, 0, 0, 0);
        costDates.push(date);
      } catch {
        // Skip invalid dates
      }
    });
    // Sort dates chronologically
    costDates.sort((a, b) => a.getTime() - b.getTime());
    // Determine the date range for the timeline
    let startDate: Date;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (costDates.length === 0) {
      // No costs, show last 14 days with zeros
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 13);
    } else {
      const earliestCostDate = costDates[0];
      const daysAgo14 = new Date(today);
      daysAgo14.setDate(daysAgo14.getDate() - 13);
      
      // Start from the earlier of: 14 days ago or first cost date
      startDate = earliestCostDate < daysAgo14 ? earliestCostDate : daysAgo14;
    }
    // Build timeline with running total
    const timeline: { date: Date; value: number }[] = [];
    let cumulativeCount = 0;
    let costIndex = 0;
    
    const currentDate = new Date(startDate);
    while (currentDate <= today) {
      // Count all costs created up to and including this date
      while (costIndex < costDates.length && costDates[costIndex].getTime() <= currentDate.getTime()) {
        cumulativeCount++;
        costIndex++;
      }
      
      timeline.push({
        date: new Date(currentDate),
        value: cumulativeCount
      });
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return {
      totalCosts,
      timeline
    };
  }, [generalCosts]);
}
