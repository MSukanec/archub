import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { format, subDays, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import { useOrganizationMembers } from './use-organization-members'

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
  // Use the hook to get organization members (which now uses API endpoint)
  const { data: membersData } = useOrganizationMembers(organizationId)
  
  return useQuery({
    queryKey: ['user-activity', organizationId, timePeriod],
    queryFn: async (): Promise<UserActivity[]> => {
      if (!organizationId || !membersData) return []

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

        // Use members from the hook (already transformed)
        const allMembers = membersData.map(m => ({
          user_id: m.user_id,
          users: {
            full_name: m.full_name,
            avatar_url: m.avatar_url
          }
        }))

        if (!allMembers || allMembers.length === 0) {
          // Return empty data if no members
          return []
        }

        // Calculate overall date range for optimization
        let overallStartDate: string
        let overallEndDate: string

        if (timePeriod === 'year') {
          const startDate = subMonths(new Date(), 11)
          overallStartDate = format(new Date(startDate.getFullYear(), startDate.getMonth(), 1), 'yyyy-MM-dd') + 'T00:00:00.000Z'
          overallEndDate = format(new Date(), 'yyyy-MM-dd') + 'T23:59:59.999Z'
        } else {
          const startDate = subDays(new Date(), daysCount - 1)
          overallStartDate = format(startDate, 'yyyy-MM-dd') + 'T00:00:00.000Z'
          overallEndDate = format(new Date(), 'yyyy-MM-dd') + 'T23:59:59.999Z'
        }

        // Fetch ALL data in one go for the entire period
        const [projectsResult, movementsResult, contactsResult, siteLogsResult] = await Promise.all([
          supabase
            .from('projects')
            .select('created_by, created_at')
            .eq('organization_id', organizationId)
            .gte('created_at', overallStartDate)
            .lte('created_at', overallEndDate),
          
          supabase
            .from('movements')
            .select('created_by, created_at')
            .eq('organization_id', organizationId)
            .gte('created_at', overallStartDate)
            .lte('created_at', overallEndDate),
          
          supabase
            .from('contacts')
            .select('created_by, created_at')
            .eq('organization_id', organizationId)
            .gte('created_at', overallStartDate)
            .lte('created_at', overallEndDate)
            .not('created_by', 'is', null),
          
          supabase
            .from('site_logs')
            .select('created_by, created_at')
            .eq('organization_id', organizationId)
            .gte('created_at', overallStartDate)
            .lte('created_at', overallEndDate)
        ])

        const allProjects = projectsResult.data || []
        const allMovements = movementsResult.data || []
        const allContacts = contactsResult.data || []
        const allSiteLogs = siteLogsResult.data || []

        const userActivityData: UserActivity[] = []

        // Now process each date period using the cached data
        for (let i = daysCount - 1; i >= 0; i--) {
          let date: Date
          let formattedDate: string
          let dayStart: string
          let dayEnd: string
          
          if (timePeriod === 'year') {
            // For yearly view, go back by months
            date = subMonths(new Date(), i)
            formattedDate = format(date, 'MMM', { locale: es })
            
            // Query entire month
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
            const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
            
            dayStart = format(monthStart, 'yyyy-MM-dd') + 'T00:00:00.000Z'
            dayEnd = format(monthEnd, 'yyyy-MM-dd') + 'T23:59:59.999Z'
          } else {
            // For week/month view, go back by days
            date = subDays(new Date(), i)
            formattedDate = format(date, 'dd/MM')
            
            dayStart = format(date, 'yyyy-MM-dd') + 'T00:00:00.000Z'
            dayEnd = format(date, 'yyyy-MM-dd') + 'T23:59:59.999Z'
          }

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

          // Filter and count activities from cached data
          allProjects.filter(p => p.created_at >= dayStart && p.created_at <= dayEnd)
            .forEach(project => {
              if (project.created_by && usersActivity[project.created_by]) {
                usersActivity[project.created_by].activity_count += 1
              }
            })

          allMovements.filter(m => m.created_at >= dayStart && m.created_at <= dayEnd)
            .forEach(movement => {
              if (movement.created_by && usersActivity[movement.created_by]) {
                usersActivity[movement.created_by].activity_count += 1
              }
            })

          allContacts.filter(c => c.created_at >= dayStart && c.created_at <= dayEnd)
            .forEach(contact => {
              if (contact.created_by && usersActivity[contact.created_by]) {
                usersActivity[contact.created_by].activity_count += 1
              }
            })

          allSiteLogs.filter(s => s.created_at >= dayStart && s.created_at <= dayEnd)
            .forEach(siteLog => {
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
    enabled: !!organizationId && !!membersData
  })
}