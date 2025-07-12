import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { format, subDays, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'

interface ActivityData {
  date: string
  total: number
}

export function useFinancialActivity(organizationId: string | undefined, projectId: string | undefined) {
  return useQuery({
    queryKey: ['financial-activity', organizationId, projectId],
    queryFn: async (): Promise<ActivityData[]> => {
      if (!organizationId || !supabase) {
        return []
      }

      try {
        // Generate last 7 days
        const days = Array.from({ length: 7 }, (_, i) => {
          const date = subDays(new Date(), 6 - i)
          return {
            date: format(startOfDay(date), 'yyyy-MM-dd'),
            displayDate: format(date, 'dd/MM', { locale: es })
          }
        })

        // Get movements for the last 7 days
        let movementsQuery = supabase
          .from('movements')
          .select('movement_date')
          .eq('organization_id', organizationId)
          .gte('movement_date', days[0].date)
          .lte('movement_date', days[6].date)

        if (projectId) {
          movementsQuery = movementsQuery.eq('project_id', projectId)
        }

        const { data: movements, error } = await movementsQuery

        if (error) throw error

        // Count movements per day
        const activityMap = new Map<string, number>()
        
        movements?.forEach(movement => {
          const movementDate = movement.movement_date.split('T')[0] // Extract date part
          activityMap.set(movementDate, (activityMap.get(movementDate) || 0) + 1)
        })

        // Build final data array
        return days.map(day => ({
          date: day.displayDate,
          total: activityMap.get(day.date) || 0
        }))

      } catch (error) {
        console.error('Error fetching financial activity:', error)
        return []
      }
    },
    enabled: !!organizationId
  })
}