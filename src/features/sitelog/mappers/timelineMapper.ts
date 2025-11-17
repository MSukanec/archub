import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter } from 'date-fns';
import { es } from 'date-fns/locale';
import type { SiteLogTimelineData, TimePeriod } from '../types';

export function mapToTimelineData(
  siteLogs: any[],
  intervals: Date[],
  timePeriod: TimePeriod,
  filesByLogId: Record<string, number>,
  eventsByLogId: Record<string, number>,
  attendeesByLogId: Record<string, number>,
  equipmentByLogId: Record<string, number>
): SiteLogTimelineData[] {
  return intervals.map(intervalDate => {
    let relevantLogs: any[] = [];
    let formattedDate: string;
    
    if (timePeriod === 'days') {
      const dayName = format(intervalDate, 'EEE', { locale: es }).toLowerCase();
      const dayDate = format(intervalDate, 'dd/MM');
      formattedDate = `${dayName} ${dayDate}`;
      
      const dateKey = format(intervalDate, 'yyyy-MM-dd');
      relevantLogs = (siteLogs || []).filter(log => {
        return log.log_date === dateKey;
      });
    } else if (timePeriod === 'weeks') {
      const monthStart = startOfMonth(intervalDate);
      const monthEnd = endOfMonth(intervalDate);
      formattedDate = format(intervalDate, 'MMM yy', { locale: es });
      
      relevantLogs = (siteLogs || []).filter(log => {
        const logDate = new Date(log.log_date);
        return logDate >= monthStart && logDate <= monthEnd;
      });
    } else {
      const quarterStart = startOfQuarter(intervalDate);
      const quarterEnd = endOfQuarter(intervalDate);
      const startMonth = format(quarterStart, 'MMM', { locale: es }).toLowerCase();
      const endMonth = format(quarterEnd, 'MMM', { locale: es }).toLowerCase();
      const year = format(intervalDate, 'yy');
      formattedDate = `${startMonth}-${endMonth} ${year}`;
      
      relevantLogs = (siteLogs || []).filter(log => {
        const logDate = new Date(log.log_date);
        return logDate >= quarterStart && logDate <= quarterEnd;
      });
    }

    const files = relevantLogs.reduce((sum, log) => sum + (filesByLogId[log.id] || 0), 0);
    const events = relevantLogs.reduce((sum, log) => sum + (eventsByLogId[log.id] || 0), 0);
    const attendees = relevantLogs.reduce((sum, log) => sum + (attendeesByLogId[log.id] || 0), 0);
    const equipment = relevantLogs.reduce((sum, log) => sum + (equipmentByLogId[log.id] || 0), 0);

    return {
      date: formattedDate,
      files,
      events,
      attendees,
      equipment
    };
  });
}
