import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subDays, subWeeks } from 'date-fns'
import { es } from 'date-fns/locale'

export interface ConstructionSummary {
  totalPersonnel: number
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  pendingTasks: number
  overdueTasks: number
  activeTasks: number
  totalBudgets: number
  totalBudgetAmount: number
  thisMonthAttendance: number
  totalAttendanceRecords: number
  averageDailyAttendance: number
}

export interface TaskStatusData {
  status: string
  count: number
  percentage: number
  color: string
}

export interface AttendanceWeeklyData {
  week: string
  attendance: number
  expected: number
  rate: number
}

export interface PersonnelTypeData {
  type: string
  count: number
  color: string
}

export interface TaskProgressData {
  category: string
  completed: number
  inProgress: number
  pending: number
}

export interface BudgetUtilizationData {
  month: string
  budgeted: number
  actual: number
  utilization: number
}

// Hook for construction summary data
export function useConstructionSummary(projectId: string | undefined, organizationId: string | undefined) {
  return useQuery({
    queryKey: ['construction-summary', projectId, organizationId],
    queryFn: async (): Promise<ConstructionSummary> => {
      if (!projectId || !organizationId || !supabase) {
        return {
          totalPersonnel: 0,
          totalTasks: 0,
          completedTasks: 0,
          inProgressTasks: 0,
          pendingTasks: 0,
          overdueTasks: 0,
          activeTasks: 0,
          totalBudgets: 0,
          totalBudgetAmount: 0,
          thisMonthAttendance: 0,
          totalAttendanceRecords: 0,
          averageDailyAttendance: 0
        }
      }

      try {
        // Get personnel count
        const { data: personnel } = await supabase
          .from('project_personnel')
          .select('id')
          .eq('project_id', projectId)

        // Get construction tasks
        const { data: tasks } = await supabase
          .from('construction_tasks')
          .select('id, status, due_date')
          .eq('project_id', projectId)

        // Get attendance records
        const { data: attendance } = await supabase
          .from('attendees')
          .select('id, created_at')
          .eq('project_id', projectId)

        // Get budgets
        const { data: budgets } = await supabase
          .from('construction_budgets')
          .select('id, total_amount')
          .eq('project_id', projectId)

        // Calculate task status counts
        let completedTasks = 0
        let inProgressTasks = 0
        let pendingTasks = 0
        let overdueTasks = 0
        const today = new Date()

        tasks?.forEach(task => {
          switch (task.status) {
            case 'completed':
              completedTasks++
              break
            case 'in_progress':
              inProgressTasks++
              break
            case 'pending':
              pendingTasks++
              break
          }

          // Check for overdue tasks
          if (task.due_date && new Date(task.due_date) < today && task.status !== 'completed') {
            overdueTasks++
          }
        })

        // Calculate this month's attendance
        const currentMonth = new Date()
        const monthStart = startOfMonth(currentMonth)
        const monthEnd = endOfMonth(currentMonth)

        const thisMonthAttendance = attendance?.filter(record => {
          const recordDate = new Date(record.created_at)
          return recordDate >= monthStart && recordDate <= monthEnd
        }).length || 0

        // Calculate average daily attendance (last 30 days)
        const thirtyDaysAgo = subDays(today, 30)
        const recentAttendance = attendance?.filter(record => {
          const recordDate = new Date(record.created_at)
          return recordDate >= thirtyDaysAgo
        }).length || 0

        const totalBudgetAmount = budgets?.reduce((sum, budget) => sum + (budget.total_amount || 0), 0) || 0

        return {
          totalPersonnel: personnel?.length || 0,
          totalTasks: tasks?.length || 0,
          completedTasks,
          inProgressTasks,
          pendingTasks,
          overdueTasks,
          activeTasks: inProgressTasks + pendingTasks,
          totalBudgets: budgets?.length || 0,
          totalBudgetAmount,
          thisMonthAttendance,
          totalAttendanceRecords: attendance?.length || 0,
          averageDailyAttendance: Math.round(recentAttendance / 30)
        }
      } catch (error) {
        console.error('Error in useConstructionSummary:', error)
        return {
          totalPersonnel: 0,
          totalTasks: 0,
          completedTasks: 0,
          inProgressTasks: 0,
          pendingTasks: 0,
          overdueTasks: 0,
          activeTasks: 0,
          totalBudgets: 0,
          totalBudgetAmount: 0,
          thisMonthAttendance: 0,
          totalAttendanceRecords: 0,
          averageDailyAttendance: 0
        }
      }
    },
    enabled: !!projectId && !!organizationId
  })
}

// Hook for task status distribution
export function useTaskStatusData(projectId: string | undefined) {
  return useQuery({
    queryKey: ['task-status-data', projectId],
    queryFn: async (): Promise<TaskStatusData[]> => {
      if (!projectId || !supabase) return []

      const { data: tasks } = await supabase
        .from('construction_tasks')
        .select('status')
        .eq('project_id', projectId)

      if (!tasks) return []

      const statusCounts = tasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const total = tasks.length
      const colors = {
        'completed': 'var(--chart-positive)',
        'in_progress': 'var(--chart-2)',
        'pending': 'var(--chart-4)',
        'cancelled': 'var(--chart-5)'
      }

      const statusLabels = {
        'completed': 'Completadas',
        'in_progress': 'En Progreso', 
        'pending': 'Pendientes',
        'cancelled': 'Canceladas'
      }

      return Object.entries(statusCounts).map(([status, count]) => ({
        status: statusLabels[status as keyof typeof statusLabels] || status,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        color: colors[status as keyof typeof colors] || 'var(--chart-1)'
      }))
    },
    enabled: !!projectId
  })
}

// Hook for weekly attendance data
export function useWeeklyAttendanceData(projectId: string | undefined) {
  return useQuery({
    queryKey: ['weekly-attendance-data', projectId],
    queryFn: async (): Promise<AttendanceWeeklyData[]> => {
      if (!projectId || !supabase) return []

      const { data: attendance } = await supabase
        .from('attendees')
        .select('created_at, personnel_id')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(500) // Last 500 records for performance

      const { data: personnel } = await supabase
        .from('project_personnel')
        .select('id')
        .eq('project_id', projectId)

      if (!attendance || !personnel) return []

      const totalPersonnel = personnel.length
      const weeks: AttendanceWeeklyData[] = []

      // Generate last 8 weeks
      for (let i = 7; i >= 0; i--) {
        const weekStart = startOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 })
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })

        const weekAttendance = attendance.filter(record => {
          const recordDate = new Date(record.created_at)
          return recordDate >= weekStart && recordDate <= weekEnd
        })

        const expected = totalPersonnel * 5 // 5 working days
        const actual = weekAttendance.length
        const rate = expected > 0 ? Math.round((actual / expected) * 100) : 0

        weeks.push({
          week: format(weekStart, 'dd/MM', { locale: es }),
          attendance: actual,
          expected,
          rate
        })
      }

      return weeks
    },
    enabled: !!projectId
  })
}

// Hook for personnel by type data
export function usePersonnelTypeData(projectId: string | undefined, organizationId: string | undefined) {
  return useQuery({
    queryKey: ['personnel-type-data', projectId, organizationId],
    queryFn: async (): Promise<PersonnelTypeData[]> => {
      if (!projectId || !organizationId || !supabase) return []

      const { data: personnel } = await supabase
        .from('project_personnel')
        .select(`
          contact:contacts (
            contact_type_links (
              contact_type:contact_types (
                name
              )
            )
          )
        `)
        .eq('project_id', projectId)

      if (!personnel) return []

      const typeCounts = personnel.reduce((acc, person) => {
        const contactType = person.contact?.contact_type_links?.[0]?.contact_type?.name || 'Sin categoría'
        acc[contactType] = (acc[contactType] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const colors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']
      
      return Object.entries(typeCounts).map(([type, count], index) => ({
        type,
        count,
        color: colors[index % colors.length]
      }))
    },
    enabled: !!projectId && !!organizationId
  })
}