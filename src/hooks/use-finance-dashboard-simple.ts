import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns'
import { es } from 'date-fns/locale'

interface FinancialSummary {
  totalIncome: number
  totalExpenses: number
  balance: number
  totalMovements: number
  thisMonthIncome: number
  thisMonthExpenses: number
  thisMonthBalance: number
}

interface MonthlyFlowData {
  month: string
  income: number
  expenses: number
  net: number
}

interface WalletBalance {
  wallet: string
  balance: number
  color: string
}

export function useFinancialSummary(organizationId: string | undefined, projectId: string | undefined) {
  return useQuery({
    queryKey: ['financial-summary', organizationId, projectId],
    queryFn: async (): Promise<FinancialSummary> => {
      if (!organizationId || !supabase) {
        return {
          totalIncome: 0,
          totalExpenses: 0,
          balance: 0,
          totalMovements: 0,
          thisMonthIncome: 0,
          thisMonthExpenses: 0,
          thisMonthBalance: 0
        }
      }

      try {
        // Get movements with concepts in a single query
        let query = supabase
          .from('movements')
          .select(`
            amount,
            movement_date,
            movement_concepts!movements_type_id_fkey (
              name
            )
          `)
          .eq('organization_id', organizationId)

        if (projectId) {
          query = query.eq('project_id', projectId)
        }

        const { data: movements, error } = await query

        if (error) throw error

        // Calculate totals
        let totalIncome = 0
        let totalExpenses = 0
        let thisMonthIncome = 0
        let thisMonthExpenses = 0

        const currentMonth = new Date()
        const monthStart = startOfMonth(currentMonth)
        const monthEnd = endOfMonth(currentMonth)

        movements?.forEach((movement: any) => {
          const amount = Math.abs(movement.amount || 0)
          const typeName = movement.movement_concepts?.name?.toLowerCase() || ''
          const movementDate = new Date(movement.movement_date)
          
          const isIncome = typeName.includes('ingreso')
          const isThisMonth = movementDate >= monthStart && movementDate <= monthEnd

          if (isIncome) {
            totalIncome += amount
            if (isThisMonth) thisMonthIncome += amount
          } else {
            totalExpenses += amount
            if (isThisMonth) thisMonthExpenses += amount
          }
        })

        return {
          totalIncome,
          totalExpenses,
          balance: totalIncome - totalExpenses,
          totalMovements: movements?.length || 0,
          thisMonthIncome,
          thisMonthExpenses,
          thisMonthBalance: thisMonthIncome - thisMonthExpenses
        }
      } catch (error) {
        console.error('Error in useFinancialSummary:', error)
        return {
          totalIncome: 0,
          totalExpenses: 0,
          balance: 0,
          totalMovements: 0,
          thisMonthIncome: 0,
          thisMonthExpenses: 0,
          thisMonthBalance: 0
        }
      }
    },
    enabled: !!organizationId
  })
}

export function useMonthlyFlowData(organizationId: string | undefined, projectId: string | undefined) {
  return useQuery({
    queryKey: ['monthly-flow', organizationId, projectId],
    queryFn: async (): Promise<MonthlyFlowData[]> => {
      if (!organizationId || !supabase) return []

      try {
        // Get last 12 months
        const endDate = new Date()
        const startDate = subMonths(endDate, 11)
        const months = eachMonthOfInterval({ start: startDate, end: endDate })

        // Get movements with concepts
        let query = supabase
          .from('movements')
          .select(`
            amount,
            movement_date,
            movement_concepts!movements_type_id_fkey (
              name
            )
          `)
          .eq('organization_id', organizationId)
          .gte('movement_date', startDate.toISOString())

        if (projectId) {
          query = query.eq('project_id', projectId)
        }

        const { data: movements, error } = await query

        if (error) throw error

        // Group by month
        const monthlyData: MonthlyFlowData[] = months.map(month => {
          const monthStart = startOfMonth(month)
          const monthEnd = endOfMonth(month)
          
          let income = 0
          let expenses = 0

          movements?.forEach((movement: any) => {
            const movementDate = new Date(movement.movement_date)
            if (movementDate >= monthStart && movementDate <= monthEnd) {
              const amount = Math.abs(movement.amount || 0)
              const typeName = movement.movement_concepts?.name?.toLowerCase() || ''
              
              if (typeName.includes('ingreso')) {
                income += amount
              } else {
                expenses += amount
              }
            }
          })

          return {
            month: format(month, 'MMM yyyy', { locale: es }),
            income,
            expenses,
            net: income - expenses
          }
        })

        return monthlyData
      } catch (error) {
        console.error('Error in useMonthlyFlowData:', error)
        return []
      }
    },
    enabled: !!organizationId
  })
}

export function useWalletBalances(organizationId: string | undefined, projectId: string | undefined) {
  return useQuery({
    queryKey: ['wallet-balances', organizationId, projectId],
    queryFn: async (): Promise<WalletBalance[]> => {
      if (!organizationId || !supabase) return []

      try {
        // Get movements with wallet and concept data
        let query = supabase
          .from('movements')
          .select(`
            amount,
            wallets!movements_wallet_id_fkey (
              name
            ),
            movement_concepts!movements_type_id_fkey (
              name
            )
          `)
          .eq('organization_id', organizationId)

        if (projectId) {
          query = query.eq('project_id', projectId)
        }

        const { data: movements, error } = await query

        if (error) throw error

        // Calculate balances by wallet
        const walletBalances: { [key: string]: number } = {}

        movements?.forEach((movement: any) => {
          const walletName = movement.wallets?.name || 'Sin billetera'
          const amount = movement.amount || 0
          const typeName = movement.movement_concepts?.name?.toLowerCase() || ''
          
          if (!walletBalances[walletName]) {
            walletBalances[walletName] = 0
          }

          if (typeName.includes('ingreso')) {
            walletBalances[walletName] += Math.abs(amount)
          } else {
            walletBalances[walletName] -= Math.abs(amount)
          }
        })

        // Generate colors
        const colors = [
          'hsl(var(--chart-1))',
          'hsl(var(--chart-2))',
          'hsl(var(--chart-3))',
          'hsl(var(--chart-4))',
          'hsl(var(--chart-5))'
        ]

        // Convert to array and filter positive balances
        const result: WalletBalance[] = Object.entries(walletBalances)
          .map(([walletName, balance], index) => ({
            wallet: walletName,
            balance: Math.max(0, balance), // Only show positive balances
            color: colors[index % colors.length]
          }))
          .filter(item => item.balance > 0)

        return result
      } catch (error) {
        console.error('Error in useWalletBalances:', error)
        return []
      }
    },
    enabled: !!organizationId
  })
}

export function useRecentMovements(organizationId: string | undefined, projectId: string | undefined, limit: number = 5) {
  return useQuery({
    queryKey: ['recent-movements', organizationId, projectId, limit],
    queryFn: async () => {
      if (!organizationId || !supabase) return []

      try {
        // Get recent movements with all related data
        let query = supabase
          .from('movements')
          .select(`
            id,
            description,
            amount,
            movement_date,
            movement_concepts!movements_type_id_fkey (
              name
            )
          `)
          .eq('organization_id', organizationId)
          .order('movement_date', { ascending: false })
          .limit(limit)

        if (projectId) {
          query = query.eq('project_id', projectId)
        }

        const { data, error } = await query

        if (error) throw error

        return data || []
      } catch (error) {
        console.error('Error in useRecentMovements:', error)
        return []
      }
    },
    enabled: !!organizationId
  })
}