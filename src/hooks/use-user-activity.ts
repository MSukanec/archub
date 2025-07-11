import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { format, subDays, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'

type TimePeriod = 'week' | 'month' | 'year'

interface UserActivity {
  date: string
  users: {
    user_id: string
    full_name: string
    avatar_url?: string
    activity_count: number
  }[]
  total: number
}

export function useUserActivity(organizationId: string | undefined, timePeriod: TimePeriod = 'week') {
  return useQuery({
    queryKey: ['user-activity', organizationId, timePeriod],
    queryFn: async (): Promise<UserActivity[]> => {
      if (!organizationId) return []

      try {
        // Calculate number of days/periods based on time period
        let daysCount: number
        
        switch (timePeriod) {
          case 'week':
            daysCount = 7
            break
          case 'month':
            daysCount = 30
            break
          case 'year':
            daysCount = 12 // 12 months for yearly view
            break
          default:
            daysCount = 7
        }

        // Get organization members first
        const { data: allMembers } = await supabase
          .from('organization_members')
          .select(`
            user_id,
            users (
              full_name,
              avatar_url
            )
          `)
          .eq('organization_id', organizationId)
          .eq('is_active', true)

        if (!allMembers || allMembers.length === 0) {
          // Return empty data if no members
          return []
        }

        const userActivityData: UserActivity[] = []

        // Generate date range
        for (let i = daysCount - 1; i >= 0; i--) {
          let date: Date
          let formattedDate: string
          
          if (timePeriod === 'year') {
            // For yearly view, go back by months
            date = subMonths(new Date(), i)
            formattedDate = format(date, 'MMM', { locale: es })
          } else {
            // For week/month view, go back by days
            date = subDays(new Date(), i)
            formattedDate = format(date, 'dd/MM')
          }

          const dayStart = format(date, 'yyyy-MM-dd')
          const dayEnd = format(date, 'yyyy-MM-dd 23:59:59')

          // Initialize activity for all members for this date
          const usersActivity: { [key: string]: { user_id: string; full_name: string; avatar_url?: string; activity_count: number } } = {}

          // Initialize all members with 0 activity
          allMembers.forEach(member => {
            usersActivity[member.user_id] = {
              user_id: member.user_id,
              full_name: member.users?.full_name || 'Usuario',
              avatar_url: member.users?.avatar_url,
              activity_count: 0
            }
          })

          // Count projects created by each user
          const { data: projects } = await supabase
            .from('projects')
            .select('created_by')
            .eq('organization_id', organizationId)
            .gte('created_at', dayStart)
            .lte('created_at', dayEnd)

          projects?.forEach(project => {
            if (project.created_by && usersActivity[project.created_by]) {
              usersActivity[project.created_by].activity_count += 1
            }
          })

          // Count movements created by each user
          const { data: movements } = await supabase
            .from('movements')
            .select('created_by')
            .eq('organization_id', organizationId)
            .gte('created_at', dayStart)
            .lte('created_at', dayEnd)

          movements?.forEach(movement => {
            if (movement.created_by && usersActivity[movement.created_by]) {
              usersActivity[movement.created_by].activity_count += 1
            }
          })

          // Count contacts created by each user
          const { data: contacts } = await supabase
            .from('contacts')
            .select('created_by')
            .eq('organization_id', organizationId)
            .gte('created_at', dayStart)
            .lte('created_at', dayEnd)

          contacts?.forEach(contact => {
            if (contact.created_by && usersActivity[contact.created_by]) {
              usersActivity[contact.created_by].activity_count += 1
            }
          })

          // Count site logs created by each user
          const { data: siteLogs } = await supabase
            .from('site_logs')
            .select('created_by')
            .eq('organization_id', organizationId)
            .gte('created_at', dayStart)
            .lte('created_at', dayEnd)

          siteLogs?.forEach(siteLog => {
            if (siteLog.created_by && usersActivity[siteLog.created_by]) {
              usersActivity[siteLog.created_by].activity_count += 1
            }
          })

          // Only include users with activity > 0 (don't show all members, only active ones)
          const activeUsers = Object.values(usersActivity).filter(user => user.activity_count > 0)
          const total = activeUsers.reduce((sum, user) => sum + user.activity_count, 0)

          userActivityData.push({
            date: formattedDate,
            users: activeUsers, // Only users with actual activity
            total
          })
        }

        return userActivityData
      } catch (error) {
        console.error('Error fetching user activity:', error)
        return []
      }
    },
    enabled: !!organizationId
  })
}