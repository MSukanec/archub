import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { format, subDays, subMonths, subYears, eachDayOfInterval, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'

interface SiteLogTimelineData {
  date: string
  files: number
  events: number
  attendees: number
  equipment: number
}

type TimePeriod = 'week' | 'month' | 'year'

export function useSiteLogTimeline(
  organizationId: string | undefined,
  projectId: string | undefined,
  timePeriod: TimePeriod = 'week'
) {
  return useQuery({
    queryKey: ['sitelog-timeline', organizationId, projectId, timePeriod],
    queryFn: async (): Promise<SiteLogTimelineData[]> => {
      if (!organizationId || !projectId) {
        return []
      }

      // Calculate date range based on time period
      const now = new Date()
      let startDate: Date
      let dateFormat: string

      switch (timePeriod) {
        case 'week':
          startDate = subDays(now, 6) // Last 7 days including today
          dateFormat = 'dd/MM'
          break
        case 'month':
          startDate = subDays(now, 29) // Last 30 days including today
          dateFormat = 'dd/MM'
          break
        case 'year':
          startDate = subMonths(now, 11) // Last 12 months including current
          dateFormat = 'MMM'
          break
        default:
          startDate = subDays(now, 6)
          dateFormat = 'dd/MM'
      }

      // Generate all dates in the range
      const dateRange = eachDayOfInterval({ start: startDate, end: now })
      
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
        console.error('Error fetching site logs for timeline:', siteLogsError)
        throw siteLogsError
      }

      // Get site log IDs for related data queries
      const siteLogIds = siteLogs?.map(log => log.id) || []

      // Fetch related data in parallel
      const [filesResult, eventsResult, attendeesResult, equipmentResult] = await Promise.all([
        // Files
        supabase
          .from('site_log_files')
          .select('site_log_id')
          .in('site_log_id', siteLogIds),
        
        // Events
        supabase
          .from('site_log_events')
          .select('site_log_id')
          .in('site_log_id', siteLogIds),
        
        // Attendees
        supabase
          .from('site_log_attendees')
          .select('site_log_id')
          .in('site_log_id', siteLogIds),
        
        // Equipment
        supabase
          .from('site_log_equipment')
          .select('site_log_id')
          .in('site_log_id', siteLogIds)
      ])

      if (filesResult.error) console.error('Error fetching files:', filesResult.error)
      if (eventsResult.error) console.error('Error fetching events:', eventsResult.error)
      if (attendeesResult.error) console.error('Error fetching attendees:', attendeesResult.error)
      if (equipmentResult.error) console.error('Error fetching equipment:', equipmentResult.error)

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

      // Create timeline data for each date in range
      const timelineData: SiteLogTimelineData[] = dateRange.map(date => {
        const dateKey = format(date, 'yyyy-MM-dd')
        const formattedDate = format(date, dateFormat, { locale: es })
        const logsForDate = logsByDate[dateKey] || []

        // Calculate totals for this date
        const files = logsForDate.reduce((sum, log) => sum + (filesByLogId[log.id] || 0), 0)
        const events = logsForDate.reduce((sum, log) => sum + (eventsByLogId[log.id] || 0), 0)
        const attendees = logsForDate.reduce((sum, log) => sum + (attendeesByLogId[log.id] || 0), 0)
        const equipment = logsForDate.reduce((sum, log) => sum + (equipmentByLogId[log.id] || 0), 0)

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