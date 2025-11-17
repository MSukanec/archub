import { Calendar, Users, Paperclip } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { MiniTrendChart } from '@/components/charts/MiniTrendChart';

import { useSitelogMetrics } from '../hooks/use-sitelog-metrics';
import { SitelogFiltersBar } from './SitelogFiltersBar';

interface SitelogStatsSectionProps {
  siteLogs: any[];
}

export function SitelogStatsSection({ siteLogs }: SitelogStatsSectionProps) {
  const {
    totalLogs,
    totalEvents,
    totalAttendees,
    totalFiles,
    timeline
  } = useSitelogMetrics(siteLogs);

  return (
    <Card className="w-full p-6" data-testid="card-sitelog-stats">
      {/* Header: Title/Value on left, Filters on right */}
      <div className="flex flex-col lg:flex-row items-start justify-between gap-4 mb-6">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Total Bitácoras
          </p>
          <p className="text-4xl font-bold" data-testid="text-total-logs">
            {totalLogs}
          </p>
          <p className="text-sm text-muted-foreground">
            Registros de obra completos con datos de personal, eventos y archivos adjuntos
          </p>
        </div>
        
        {/* Filters */}
        <div className="flex-shrink-0">
          <SitelogFiltersBar siteLogs={siteLogs} />
        </div>
      </div>

      {/* Sparkline Chart */}
      <div className="mb-6">
        <MiniTrendChart 
          data={timeline}
          color="var(--accent)"
          height={60}
        />
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Events */}
        <div className="space-y-1" data-testid="stat-events">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <Calendar className="h-3.5 w-3.5" />
            <span>Eventos</span>
          </div>
          <p className="text-2xl font-semibold" data-testid="text-total-events">
            {totalEvents}
          </p>
        </div>

        {/* Personnel */}
        <div className="space-y-1" data-testid="stat-personnel">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <Users className="h-3.5 w-3.5" />
            <span>Personal</span>
          </div>
          <p className="text-2xl font-semibold" data-testid="text-total-attendees">
            {totalAttendees}
          </p>
        </div>

        {/* Files */}
        <div className="space-y-1" data-testid="stat-files">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <Paperclip className="h-3.5 w-3.5" />
            <span>Archivos</span>
          </div>
          <p className="text-2xl font-semibold" data-testid="text-total-files">
            {totalFiles}
          </p>
        </div>
      </div>
    </Card>
  );
}
