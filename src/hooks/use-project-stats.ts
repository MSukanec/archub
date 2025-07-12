import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useCurrentUser } from '@/hooks/use-current-user'

export function useProjectStats(projectId: string | null) {
  const { data: userData } = useCurrentUser()
  const organizationId = userData?.preferences?.last_organization_id

  return useQuery({
    queryKey: ['project-stats', organizationId, projectId],
    queryFn: async () => {
      if (!supabase || !organizationId || !projectId) return null

      // Get project details
      const { data: project } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      // Get design documents count
      const { count: documentsCount } = await supabase
        .from('design_documents')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)

      // Get site logs count
      const { count: siteLogsCount } = await supabase
        .from('site_logs')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)

      // Get budgets count
      const { count: budgetsCount } = await supabase
        .from('budgets')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)

      // Get movements count for this project
      const { count: movementsCount } = await supabase
        .from('movements')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('project_id', projectId)

      return {
        project,
        totalDocuments: documentsCount || 0,
        totalSiteLogs: siteLogsCount || 0,
        totalBudgets: budgetsCount || 0,
        totalMovements: movementsCount || 0
      }
    },
    enabled: !!organizationId && !!projectId && !!supabase
  })
}

export function useProjectActivity(projectId: string | null) {
  const { data: userData } = useCurrentUser()
  const organizationId = userData?.preferences?.last_organization_id

  return useQuery({
    queryKey: ['project-activity', organizationId, projectId],
    queryFn: async () => {
      if (!supabase || !organizationId || !projectId) return []

      // Get activity data for the last 7 days
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - 6)

      const dates = []
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d))
      }

      const activityData = await Promise.all(
        dates.map(async (date) => {
          const dateStr = date.toISOString().split('T')[0]
          const nextDate = new Date(date)
          nextDate.setDate(nextDate.getDate() + 1)
          const nextDateStr = nextDate.toISOString().split('T')[0]

          // Count activities for this date
          const [documentsResult, siteLogsResult, movementsResult] = await Promise.all([
            supabase
              .from('design_documents')
              .select('*', { count: 'exact', head: true })
              .eq('project_id', projectId)
              .gte('created_at', dateStr)
              .lt('created_at', nextDateStr),
            
            supabase
              .from('site_logs')
              .select('*', { count: 'exact', head: true })
              .eq('project_id', projectId)
              .gte('created_at', dateStr)
              .lt('created_at', nextDateStr),
            
            supabase
              .from('movements')
              .select('*', { count: 'exact', head: true })
              .eq('organization_id', organizationId)
              .eq('project_id', projectId)
              .gte('movement_date', dateStr)
              .lt('movement_date', nextDateStr)
          ])

          const total = (documentsResult.count || 0) + (siteLogsResult.count || 0) + (movementsResult.count || 0)

          return {
            date: date.toLocaleDateString('es-ES', { 
              month: 'short', 
              day: 'numeric' 
            }),
            total
          }
        })
      )

      return activityData
    },
    enabled: !!organizationId && !!projectId && !!supabase
  })
}