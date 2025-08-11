import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { format, subDays, subWeeks, subMonths, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, startOfWeek, startOfMonth, endOfWeek, endOfMonth, getDay, startOfQuarter, endOfQuarter, eachQuarterOfInterval } from 'date-fns'
import { es } from 'date-fns/locale'

interface SiteLogTimelineData {
  date: string
  files: number
  events: number
  attendees: number
  equipment: number
}

type TimePeriod = 'days' | 'weeks' | 'months'

export function useSiteLogTimeline(
  organizationId: string | undefined,
  projectId: string | undefined,
  timePeriod: TimePeriod = 'days'
) {
  return useQuery({
    queryKey: ['sitelog-timeline', organizationId, projectId, timePeriod],
    queryFn: async (): Promise<SiteLogTimelineData[]> => {
      if (!organizationId || !projectId) {
        return []
      }

      // Calculate date range and intervals based on time period
      const now = new Date()
      let startDate: Date
      let dateFormat: string
      let intervals: Date[]

      switch (timePeriod) {
        case 'days': // Now shows individual days
          startDate = subDays(now, 6) // Last 7 days including today
          intervals = eachDayOfInterval({ start: startDate, end: now })
          break
        case 'weeks': // Now shows months
          startDate = subMonths(now, 6) // Last 7 months including current month
          intervals = eachMonthOfInterval({ start: startDate, end: now })
          break
        case 'months': // Now shows quarters
          startDate = subMonths(now, 18) // Last 7 quarters (21 months back)
          intervals = []
          // Generate quarterly intervals manually
          for (let i = 6; i >= 0; i--) {
            const quarterDate = subMonths(now, i * 3)
            intervals.push(startOfQuarter(quarterDate))
          }
          break
        default:
          startDate = subWeeks(now, 6)
          intervals = eachWeekOfInterval({ start: startDate, end: now }, { weekStartsOn: 1 })
      }
      
      // Fetch site logs in the date range
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
        .lte('log_date', format(now, 'yyyy-MM-dd'))

      if (siteLogsError) {

        throw siteLogsError
      }

      // Get site log IDs for related data queries
      const siteLogIds = siteLogs?.map(log => log.id) || []

      // Fetch related data in parallel
      const [filesResult, eventsResult, attendeesResult, equipmentResult] = await Promise.all([
        // Files
        supabase
          .from('project_media')
          .select('site_log_id')
          .in('site_log_id', siteLogIds),
        
        // Events
        supabase
          .from('site_log_events')
          .select('site_log_id')
          .in('site_log_id', siteLogIds),
        
        // Attendees
        supabase
          .from('attendees')
          .select('site_log_id')
          .in('site_log_id', siteLogIds),
        
        // Equipment
        supabase
          .from('site_log_equipment')
          .select('site_log_id')
          .in('site_log_id', siteLogIds)
      ])




      // Group data by site log ID
      const filesByLogId = (filesResult.data || []).reduce((acc, file) => {
        acc[file.site_log_id] = (acc[file.site_log_id] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const eventsByLogId = (eventsResult.data || []).reduce((acc, event) => {
        acc[event.site_log_id] = (acc[event.site_log_id] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const attendeesByLogId = (attendeesResult.data || []).reduce((acc, attendee) => {
        acc[attendee.site_log_id] = (acc[attendee.site_log_id] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const equipmentByLogId = (equipmentResult.data || []).reduce((acc, equipment) => {
        acc[equipment.site_log_id] = (acc[equipment.site_log_id] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // Group site logs by date
      const logsByDate = (siteLogs || []).reduce((acc, log) => {
        const date = log.log_date
        if (!acc[date]) {
          acc[date] = []
        }
        acc[date].push(log)
        return acc
      }, {} as Record<string, any[]>)

      // Create timeline data for each interval
      const timelineData: SiteLogTimelineData[] = intervals.map(intervalDate => {
        let relevantLogs: any[] = []
        let formattedDate: string
        
        if (timePeriod === 'days') { // Now shows individual days
          // For individual days - show day name and date
          const dayName = format(intervalDate, 'EEE', { locale: es }).toLowerCase()
          const dayDate = format(intervalDate, 'dd/MM')
          formattedDate = `${dayName} ${dayDate}`
          
          // Find logs for this specific day
          const dateKey = format(intervalDate, 'yyyy-MM-dd')
          relevantLogs = (siteLogs || []).filter(log => {
            return log.log_date === dateKey
          })
        } else if (timePeriod === 'weeks') { // Now shows months
          // For months, get all logs within that month
          const monthStart = startOfMonth(intervalDate)
          const monthEnd = endOfMonth(intervalDate)
          formattedDate = format(intervalDate, 'MMM yy', { locale: es })
          
          // Find all logs within this month
          relevantLogs = (siteLogs || []).filter(log => {
            const logDate = new Date(log.log_date)
            return logDate >= monthStart && logDate <= monthEnd
          })
        } else { // months - now shows quarters
          // For quarters
          const quarterStart = startOfQuarter(intervalDate)
          const quarterEnd = endOfQuarter(intervalDate)
          const startMonth = format(quarterStart, 'MMM', { locale: es }).toLowerCase()
          const endMonth = format(quarterEnd, 'MMM', { locale: es }).toLowerCase()
          const year = format(intervalDate, 'yy')
          formattedDate = `${startMonth}-${endMonth} ${year}`
          
          // Find all logs within this quarter
          relevantLogs = (siteLogs || []).filter(log => {
            const logDate = new Date(log.log_date)
            return logDate >= quarterStart && logDate <= quarterEnd
          })
        }

        // Calculate totals for this interval (summing all logs in the period)
        const files = relevantLogs.reduce((sum, log) => sum + (filesByLogId[log.id] || 0), 0)
        const events = relevantLogs.reduce((sum, log) => sum + (eventsByLogId[log.id] || 0), 0)
        const attendees = relevantLogs.reduce((sum, log) => sum + (attendeesByLogId[log.id] || 0), 0)
        const equipment = relevantLogs.reduce((sum, log) => sum + (equipmentByLogId[log.id] || 0), 0)

        return {
          date: formattedDate,
          files,
          events,
          attendees,
          equipment
        }
      })

      return timelineData
    },
    enabled: !!organizationId && !!projectId
  })
}