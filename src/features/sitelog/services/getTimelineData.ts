import { supabase } from '@/lib/supabase';
import { format, subDays, subWeeks, subMonths, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, startOfWeek, startOfMonth, endOfWeek, endOfMonth, getDay, startOfQuarter, endOfQuarter, eachQuarterOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import type { SiteLogTimelineData, TimePeriod } from '../types';

/**
 * Obtiene datos agregados de bitácoras para visualización en timeline/gráficos.
 * 
 * Calcula totales por período de:
 * - Archivos subidos
 * - Eventos registrados
 * - Asistentes presentes
 * - Equipamiento utilizado
 * 
 * @param organizationId - ID de la organización
 * @param projectId - ID del proyecto
 * @param timePeriod - Período de agregación: 'days' (7 días), 'weeks' (7 meses), 'months' (7 trimestres)
 * @returns Array con datos agregados por período
 * @throws {Error} Si falla la query de Supabase
 */
export async function getTimelineData(
  organizationId: string,
  projectId: string,
  timePeriod: TimePeriod = 'days'
): Promise<SiteLogTimelineData[]> {
  if (!organizationId || !projectId) {
    return [];
  }

  const now = new Date();
  let startDate: Date;
  let dateFormat: string;
  let intervals: Date[];

  switch (timePeriod) {
    case 'days':
      startDate = subDays(now, 6);
      intervals = eachDayOfInterval({ start: startDate, end: now });
      break;
    case 'weeks':
      startDate = subMonths(now, 6);
      intervals = eachMonthOfInterval({ start: startDate, end: now });
      break;
    case 'months':
      startDate = subMonths(now, 18);
      intervals = [];
      for (let i = 6; i >= 0; i--) {
        const quarterDate = subMonths(now, i * 3);
        intervals.push(startOfQuarter(quarterDate));
      }
      break;
    default:
      startDate = subWeeks(now, 6);
      intervals = eachWeekOfInterval({ start: startDate, end: now }, { weekStartsOn: 1 });
  }
  
  const { data: siteLogs, error: siteLogsError } = await supabase
    .from('site_logs')
    .select(`
      id,
      log_date,
      organization_id,
      project_id
    `)
    .eq('organization_id', organizationId)
    .eq('project_id', projectId)
    .gte('log_date', format(startDate, 'yyyy-MM-dd'))
    .lte('log_date', format(now, 'yyyy-MM-dd'));

  if (siteLogsError) {
    throw siteLogsError;
  }

  const siteLogIds = siteLogs?.map(log => log.id) || [];

  const [filesResult, eventsResult, attendeesResult, equipmentResult] = await Promise.all([
    supabase
      .from('project_media')
      .select('site_log_id')
      .in('site_log_id', siteLogIds),
    
    supabase
      .from('site_log_events')
      .select('site_log_id')
      .in('site_log_id', siteLogIds),
    
    supabase
      .from('personnel_attendees')
      .select('site_log_id')
      .in('site_log_id', siteLogIds),
    
    supabase
      .from('site_log_equipment')
      .select('site_log_id')
      .in('site_log_id', siteLogIds)
  ]);

  const filesByLogId = (filesResult.data || []).reduce((acc, file) => {
    acc[file.site_log_id] = (acc[file.site_log_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const eventsByLogId = (eventsResult.data || []).reduce((acc, event) => {
    acc[event.site_log_id] = (acc[event.site_log_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const attendeesByLogId = (attendeesResult.data || []).reduce((acc, attendee) => {
    acc[attendee.site_log_id] = (acc[attendee.site_log_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const equipmentByLogId = (equipmentResult.data || []).reduce((acc, equipment) => {
    acc[equipment.site_log_id] = (acc[equipment.site_log_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const logsByDate = (siteLogs || []).reduce((acc, log) => {
    const date = log.log_date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(log);
    return acc;
  }, {} as Record<string, any[]>);

  const timelineData: SiteLogTimelineData[] = intervals.map(intervalDate => {
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

  return timelineData;
}
