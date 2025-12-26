import { useMemo } from 'react';
import { subDays, format, parseISO, startOfDay, endOfDay, isWithinInterval } from 'date-fns';

interface SitelogMetrics {
  totalLogs: number;
  totalAttendees: number;
  totalFiles: number;
  timeline: { value: number; date: string }[];
}

export function useSitelogMetrics(siteLogs: any[]): SitelogMetrics {
  return useMemo(() => {
    const totalLogs = siteLogs.length;

    const totalAttendees = siteLogs.reduce((sum, log) => {
      return sum + (log.attendees?.length || 0);
    }, 0);

    const totalFiles = siteLogs.reduce((sum, log) => {
      return sum + (log.files?.length || 0);
    }, 0);

    // Generate historical timeline from all logs
    // Group logs by date
    const logsByDate: Record<string, number> = {};
    
    siteLogs.forEach(log => {
      if (!log.log_date) return;
      try {
        // Use log_date directly as it's already in YYYY-MM-DD format
        const dateStr = log.log_date;
        logsByDate[dateStr] = (logsByDate[dateStr] || 0) + 1;
      } catch {
        // Skip invalid dates
      }
    });

    // Convert to timeline array sorted by date
    const timeline = Object.entries(logsByDate)
      .map(([date, count]) => ({
        value: count,
        date
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalLogs,
      totalAttendees,
      totalFiles,
      timeline
    };
  }, [siteLogs]);
}
