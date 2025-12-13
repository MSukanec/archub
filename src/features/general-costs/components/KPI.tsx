import { Card } from '@/components/ui/card';
import { MiniTrendChart } from '@/components/charts/legacy/MiniTrendChart';

import { useGeneralCostsMetrics } from '../hooks/use-general-costs-metrics';
import type { GeneralCost } from '../types';

interface GeneralCostsStatsSectionProps {
  generalCosts: GeneralCost[];
}

export function GeneralCostsStatsSection({ generalCosts }: GeneralCostsStatsSectionProps) {
  const {
    totalCosts,
    timeline
  } = useGeneralCostsMetrics(generalCosts);

  return (
    <Card className="w-full p-6" data-testid="card-general-costs-stats">
      {/* Header: Title/Value */}
      <div className="flex flex-col items-start justify-between gap-4 mb-6">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Total Gastos Generales
          </p>
          <p className="text-4xl font-bold" data-testid="text-total-costs">
            {totalCosts}
          </p>
          <p className="text-sm text-muted-foreground">
            Conceptos de gastos generales de la organización
          </p>
        </div>
      </div>

      {/* Sparkline Chart */}
      <div>
        <MiniTrendChart 
          data={timeline}
          color="var(--accent)"
        />
      </div>
    </Card>
  );
}
