import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { subDays, format, startOfDay, endOfDay } from 'date-fns'

interface SiteLogActivity {
  date: string
  users: {
    user_id: string
    full_name: string
    avatar_url?: string
    activity_count: number
  }[]
  total: number
}

type TimePeriod = 'week' | 'month' | 'year'

export function useSiteLogActivity(organizationId: string | undefined, projectId: string | undefined, timePeriod: TimePeriod = 'week') {
  return useQuery({
    queryKey: ['sitelog-activity', organizationId, projectId, timePeriod],
    queryFn: async (): Promise<SiteLogActivity[]> => {
      if (!supabase || !organizationId || !projectId) {
        return []
      }

      try {
        // Calculate the date range based on the time period
        let daysBack: number
        switch (timePeriod) {
          case 'week':
            daysBack = 7
            break
          case 'month':
            daysBack = 30
            break
          case 'year':
            daysBack = 365
            break
          default:
            daysBack = 7
        }

        // Get all site logs within the period
        const { data: siteLogs, error } = await supabase
          .from('site_logs')
          .select(`
            id,
            created_by,
            created_at,
            project_id,
            creator:users!created_by(
              id,
              full_name,
              avatar_url
            )
          `)
          .eq('project_id', projectId)
          .gte('created_at', subDays(new Date(), daysBack).toISOString())
          .order('created_at', { ascending: true })

        if (error) {
          throw error
        }

        const allSiteLogs = siteLogs || []

        // Get organization members for user data
        const { data: members } = await supabase
          .from('organization_members')
          .select(`
            user_id,
            users!inner(
              id,
              full_name,
              avatar_url
            )
          `)
          .eq('organization_id', organizationId)

        const memberMap = new Map()
        members?.forEach(member => {
          if (member.users) {
            memberMap.set(member.user_id, member.users)
          }
        })

        // Process activity data by day
        const activityData: SiteLogActivity[] = []
        
        for (let i = 0; i < daysBack; i++) {
          const currentDate = subDays(new Date(), daysBack - 1 - i)
          const dayStart = startOfDay(currentDate)
          const dayEnd = endOfDay(currentDate)
          const formattedDate = format(currentDate, 'dd/MM')

          // Initialize users activity for this day
          const usersActivity: Record<string, any> = {}
          memberMap.forEach((userData, userId) => {
            usersActivity[userId] = {
              user_id: userId,
              full_name: userData.full_name || 'Usuario',
              avatar_url: userData.avatar_url,
              activity_count: 0
            }
          })

          // Count site log activities for this day
          allSiteLogs.filter(s => s.created_at >= dayStart.toISOString() && s.created_at <= dayEnd.toISOString())
            .forEach(siteLog => {
              if (siteLog.created_by && usersActivity[siteLog.created_by]) {
                usersActivity[siteLog.created_by].activity_count += 1
              }
            })

          // Only include users with activity > 0 (don't show all members, only active ones)
          const activeUsers = Object.values(usersActivity).filter(user => user.activity_count > 0)
          const total = activeUsers.reduce((sum, user) => sum + user.activity_count, 0)

          activityData.push({
            date: formattedDate,
            users: activeUsers, // Only users with actual activity
            total
          })
        }

        return activityData
      } catch (error) {
        return []
      }
    },
    enabled: !!organizationId && !!projectId
  })
}