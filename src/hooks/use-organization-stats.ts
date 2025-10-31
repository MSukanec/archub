import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useCurrentUser } from './use-current-user'
import { useProjectContext } from '@/stores/projectContext'
import { subDays, startOfDay, format } from 'date-fns'

export interface OrganizationStats {
  activeProjects: number
  documentsLast30Days: number
  generatedTasks: number
  financialMovementsLast30Days: number
}

export interface ActivityData {
  date: string
  total: number
}

export function useOrganizationStats() {
  const { currentOrganizationId } = useProjectContext()

  return useQuery({
    queryKey: ['organization-stats', currentOrganizationId],
    queryFn: async (): Promise<OrganizationStats> => {
      if (!supabase || !currentOrganizationId) {
        return {
          activeProjects: 0,
          documentsLast30Days: 0,
          generatedTasks: 0,
          financialMovementsLast30Days: 0
        }
      }

      try {
        const thirtyDaysAgo = subDays(new Date(), 30)

      // Count active projects
      const { count: activeProjectsCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', currentOrganizationId)
        .eq('is_active', true)

      // Count documents uploaded in last 30 days
      const { count: documentsCount } = await supabase
        .from('design_documents')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', currentOrganizationId)
        .gte('created_at', thirtyDaysAgo.toISOString())

      // Count generated tasks
      const { count: tasksCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })

      // Sum financial movements in last 30 days
      const { data: movements } = await supabase
        .from('movements')
        .select('amount')
        .eq('organization_id', currentOrganizationId)
        .gte('movement_date', thirtyDaysAgo.toISOString())

      const totalMovements = movements?.reduce((sum, movement) => sum + (movement.amount || 0), 0) || 0

      return {
        activeProjects: activeProjectsCount || 0,
        documentsLast30Days: documentsCount || 0,
        generatedTasks: tasksCount || 0,
        financialMovementsLast30Days: Math.abs(totalMovements)
      }
      } catch (error) {
        console.error('Error fetching organization stats:', error)
        // Return default values instead of throwing to avoid breaking the UI
        return {
          activeProjects: 0,
          documentsLast30Days: 0,
          generatedTasks: 0,
          financialMovementsLast30Days: 0
        }
      }
    },
    enabled: !!currentOrganizationId,
    retry: 0, // Don't retry on error to avoid spamming failed requests
    staleTime: Infinity, // Cache forever to avoid repeated errors
    gcTime: 600000
  })
}

export function useOrganizationActivity() {
  const { data: userData } = useCurrentUser()
  const currentOrganizationId = userData?.organization?.id

  return useQuery({
    queryKey: ['organization-activity', currentOrganizationId],
    queryFn: async (): Promise<ActivityData[]> => {
      if (!supabase || !currentOrganizationId) return []

      try {
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = subDays(new Date(), 6 - i)
          return startOfDay(date)
        })

        const activityData: ActivityData[] = []

        for (const date of last7Days) {
        const nextDay = new Date(date)
        nextDay.setDate(nextDay.getDate() + 1)

        // Count movements for this day
        const { count: movimientosCount } = await supabase
          .from('movements')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', currentOrganizationId)
          .gte('movement_date', date.toISOString())
          .lt('movement_date', nextDay.toISOString())

        // Count tasks created this day
        const { count: tareasCount } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', date.toISOString())
          .lt('created_at', nextDay.toISOString())

        // Count contacts created this day
        const { count: contactosCount } = await supabase
          .from('contacts')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', currentOrganizationId)
          .gte('created_at', date.toISOString())
          .lt('created_at', nextDay.toISOString())

        // Count documents uploaded this day
        const { count: documentosCount } = await supabase
          .from('design_documents')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', currentOrganizationId)
          .gte('created_at', date.toISOString())
          .lt('created_at', nextDay.toISOString())

        const movimientos = movimientosCount || 0
        const tareas = tareasCount || 0
        const contactos = contactosCount || 0
        const documentos = documentosCount || 0
        const total = movimientos + tareas + contactos + documentos

        const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
        const dayName = dayNames[date.getDay()]
        const formattedDate = format(date, 'dd/MM')
        
        activityData.push({
          date: `${dayName} ${formattedDate}`,
          total
        })
      }

        return activityData
      } catch (error) {
        console.error('Error fetching organization activity:', error)
        // Return empty array instead of throwing to avoid breaking the UI
        return []
      }
    },
    enabled: !!currentOrganizationId,
    retry: 0, // Don't retry on error to avoid spamming failed requests
    staleTime: Infinity, // Cache forever to avoid repeated errors
    gcTime: 600000
  })
}