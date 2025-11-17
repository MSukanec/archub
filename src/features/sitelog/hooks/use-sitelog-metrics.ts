import { useMemo } from 'react';
import { subDays, format, parseISO, startOfDay, endOfDay, isWithinInterval } from 'date-fns';

interface SitelogMetrics {
  totalLogs: number;
  totalEvents: number;
  totalAttendees: number;
  totalEquipment: number;
  totalFiles: number;
  timeline: { value: number; date: string }[];
}

export function useSitelogMetrics(siteLogs: any[]): SitelogMetrics {
  return useMemo(() => {
    const totalLogs = siteLogs.length;
    
    const totalEvents = siteLogs.reduce((sum, log) => {
      return sum + (log.events?.length || 0);
    }, 0);

    const totalAttendees = siteLogs.reduce((sum, log) => {
      return sum + (log.attendees?.length || 0);
    }, 0);

    const totalEquipment = siteLogs.reduce((sum, log) => {
      return sum + (log.equipment?.length || 0);
    }, 0);

    const totalFiles = siteLogs.reduce((sum, log) => {
      return sum + (log.files?.length || 0);
    }, 0);

    // Generate timeline for last 14 days
    const today = new Date();
    const timeline = Array.from({ length: 14 }, (_, i) => {
      const date = subDays(today, 13 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Count logs for this day
      const count = siteLogs.filter(log => {
        if (!log.log_date) return false;
        try {
          const logDate = parseISO(log.log_date);
          return isWithinInterval(logDate, {
            start: startOfDay(date),
            end: endOfDay(date)
          });
        } catch {
          return false;
        }
      }).length;

      return {
        value: count,
        date: dateStr
      };
    });

    return {
      totalLogs,
      totalEvents,
      totalAttendees,
      totalEquipment,
      totalFiles,
      timeline
    };
  }, [siteLogs]);
}
