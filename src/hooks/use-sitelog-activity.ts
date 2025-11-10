import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { subDays, format, startOfDay, endOfDay } from 'date-fns'
import { useOrganizationMembers } from './use-organization-members'

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
  // Use the hook to get organization members (which now uses API endpoint)
  const { data: membersData } = useOrganizationMembers(organizationId)
  
  return useQuery({
    queryKey: ['sitelog-activity', organizationId, projectId, timePeriod],
    queryFn: async (): Promise<SiteLogActivity[]> => {
      if (!supabase || !organizationId || !projectId || !membersData) {
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

        // Use members from the hook (already transformed)
        const memberMap = new Map()
        membersData.forEach(member => {
          memberMap.set(member.user_id, {
            id: member.user_id,
            full_name: member.full_name,
            avatar_url: member.avatar_url
          })
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
    enabled: !!organizationId && !!projectId && !!membersData
  })
}