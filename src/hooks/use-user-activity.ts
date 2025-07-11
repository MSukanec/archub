import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { format, subDays } from 'date-fns'
import { es } from 'date-fns/locale'

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

export function useUserActivity(organizationId: string | undefined) {
  return useQuery({
    queryKey: ['user-activity', organizationId],
    queryFn: async (): Promise<UserActivity[]> => {
      if (!organizationId) return []

      const userActivityData: UserActivity[] = []

      // Generate last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i)
        const dayStart = format(date, 'yyyy-MM-dd')
        const dayEnd = format(date, 'yyyy-MM-dd 23:59:59')

        const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
        const dayName = dayNames[date.getDay()]
        const formattedDate = format(date, 'dd/MM')

        // Get organization members
        const { data: members } = await supabase
          .from('organization_members')
          .select(`
            user_id,
            users (
              full_name,
              avatar_url
            )
          `)
          .eq('organization_id', organizationId)

        const usersActivity: { [key: string]: { user_id: string; full_name: string; avatar_url?: string; activity_count: number } } = {}

        // Initialize all members with 0 activity
        members?.forEach(member => {
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

        // Filter users with activity > 0 and calculate total
        const activeUsers = Object.values(usersActivity).filter(user => user.activity_count > 0)
        const total = activeUsers.reduce((sum, user) => sum + user.activity_count, 0)

        userActivityData.push({
          date: `${dayName} ${formattedDate}`,
          users: activeUsers,
          total
        })
      }

      return userActivityData
    },
    enabled: !!organizationId
  })
}