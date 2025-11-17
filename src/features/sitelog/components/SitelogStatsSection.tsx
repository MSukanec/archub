import { FileText, Calendar, Users, Paperclip } from 'lucide-react';

import { StatCard, StatCardTitle, StatCardValue, StatCardContent } from '@/components/ui/stat-card';
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
    <div className="space-y-4">
      {/* Stats and Filters Row */}
      <div className="flex flex-col lg:flex-row gap-4 items-start justify-between">
        {/* Stats Grid */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          {/* Total Logs - Large with Sparkline */}
          <StatCard 
            className="sm:col-span-2 lg:col-span-1"
            data-testid="stat-card-total-logs"
          >
            <div className="flex items-center gap-2 text-xs font-normal text-muted-foreground uppercase tracking-wide">
              <FileText className="h-4 w-4" />
              <span>Total Bitácoras</span>
            </div>
            <StatCardValue>{totalLogs}</StatCardValue>
            <StatCardContent>
              <MiniTrendChart 
                data={timeline}
                color="var(--accent)"
              />
            </StatCardContent>
          </StatCard>

          {/* Total Events */}
          <StatCard data-testid="stat-card-total-events">
            <div className="flex items-center gap-2 text-xs font-normal text-muted-foreground uppercase tracking-wide">
              <Calendar className="h-4 w-4" />
              <span>Eventos</span>
            </div>
            <StatCardValue>{totalEvents}</StatCardValue>
          </StatCard>

          {/* Total Attendees */}
          <StatCard data-testid="stat-card-total-attendees">
            <div className="flex items-center gap-2 text-xs font-normal text-muted-foreground uppercase tracking-wide">
              <Users className="h-4 w-4" />
              <span>Personal</span>
            </div>
            <StatCardValue>{totalAttendees}</StatCardValue>
          </StatCard>

          {/* Total Files */}
          <StatCard data-testid="stat-card-total-files">
            <div className="flex items-center gap-2 text-xs font-normal text-muted-foreground uppercase tracking-wide">
              <Paperclip className="h-4 w-4" />
              <span>Archivos</span>
            </div>
            <StatCardValue>{totalFiles}</StatCardValue>
          </StatCard>
        </div>

        {/* Filters Bar */}
        <div className="lg:flex-shrink-0">
          <SitelogFiltersBar siteLogs={siteLogs} />
        </div>
      </div>
    </div>
  );
}
