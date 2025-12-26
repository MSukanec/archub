import { Paperclip } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { SparklineChart } from '@/components/charts/sparkline/SparklineChart';

import { useSitelogMetrics } from '../hooks/use-sitelog-metrics';

interface SitelogStatsSectionProps {
  siteLogs: any[];
}

export function SitelogStatsSection({ siteLogs }: SitelogStatsSectionProps) {
  const {
    totalLogs,
    totalAttendees,
    totalFiles,
    timeline
  } = useSitelogMetrics(siteLogs);

  return (
    <Card className="w-full p-6" data-testid="card-sitelog-stats">
      {/* Header: Title/Value on left, KPIs on right */}
      <div className="flex flex-col lg:flex-row items-start justify-between gap-4 mb-6">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Total Bitácoras
          </p>
          <p className="text-4xl font-bold" data-testid="text-total-logs">
            {totalLogs}
          </p>
          <p className="text-sm text-muted-foreground">
            Registros de obra completos con datos de personal y archivos adjuntos
          </p>
        </div>
        
        {/* Quick Stats - Solo Archivos */}
        <div className="flex items-center gap-6">
          {/* Files */}
          <div className="flex items-center gap-2" data-testid="stat-files">
            <Paperclip className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Archivos</span>
            <span className="text-lg font-semibold" data-testid="text-total-files">
              {totalFiles}
            </span>
          </div>
        </div>
      </div>

      {/* Sparkline Chart */}
      <div>
        <SparklineChart 
          data={timeline}
          color="var(--accent)"
        />
      </div>
    </Card>
  );
}
