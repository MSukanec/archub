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
interface MovementWithConcepts {
  amount: number
  movement_date: string
  type_id: string
  wallet_id: string
  movement_concepts: {
    name: string
  }
  wallets: {
    name: string
  }
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
      // Get movements data and movement concepts separately
      let movementsQuery = supabase
        .from('movements')
        .select('amount, movement_date, type_id')
        .eq('organization_id', organizationId)
      if (projectId) {
        movementsQuery = movementsQuery.eq('project_id', projectId)
      }
      const { data: movements, error } = await movementsQuery
      if (error) throw error
      if (!movements) return {
        totalIncome: 0,
        totalExpenses: 0,
        balance: 0,
        totalMovements: 0,
        thisMonthIncome: 0,
        thisMonthExpenses: 0,
        thisMonthBalance: 0
      }
      // Calculate totals using amount sign (positive = income, negative = expense)
      let totalIncome = 0
      let totalExpenses = 0
      let thisMonthIncome = 0
      let thisMonthExpenses = 0
      const currentMonth = new Date()
      const monthStart = startOfMonth(currentMonth)
      const monthEnd = endOfMonth(currentMonth)
      movements.forEach(movement => {
        const amount = movement.amount || 0
        const movementDate = new Date(movement.movement_date)
        
        const isIncome = amount > 0
        const isThisMonth = movementDate >= monthStart && movementDate <= monthEnd
        if (isIncome) {
          totalIncome += Math.abs(amount)
          if (isThisMonth) thisMonthIncome += Math.abs(amount)
        } else {
          totalExpenses += Math.abs(amount)
          if (isThisMonth) thisMonthExpenses += Math.abs(amount)
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
    },
    enabled: !!organizationId
  })
}
export function useMonthlyFlowData(organizationId: string | undefined, projectId: string | undefined) {
  return useQuery({
    queryKey: ['monthly-flow', organizationId, projectId],
    queryFn: async (): Promise<MonthlyFlowData[]> => {
      if (!organizationId || !supabase) return []
      // Get last 12 months
      const endDate = new Date()
      const startDate = subMonths(endDate, 11)
      const months = eachMonthOfInterval({ start: startDate, end: endDate })
      // Get movements data
      let movementsQuery = supabase
        .from('movements')
        .select('amount, movement_date, type_id')
        .eq('organization_id', organizationId)
        .gte('movement_date', startDate.toISOString())
      if (projectId) {
        movementsQuery = movementsQuery.eq('project_id', projectId)
      }
      const { data: movements, error } = await movementsQuery
      if (error) throw error
      if (!movements) return []
      // Group by month using amount sign (positive = income, negative = expense)
      const monthlyData: MonthlyFlowData[] = months.map(month => {
        const monthStart = startOfMonth(month)
        const monthEnd = endOfMonth(month)
        
        let income = 0
        let expenses = 0
        movements.forEach(movement => {
          const movementDate = new Date(movement.movement_date)
          if (movementDate >= monthStart && movementDate <= monthEnd) {
            const amount = movement.amount || 0
            
            if (amount > 0) {
              income += Math.abs(amount)
            } else {
              expenses += Math.abs(amount)
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
    },
    enabled: !!organizationId
  })
}
export function useWalletBalances(organizationId: string | undefined, projectId: string | undefined) {
  return useQuery({
    queryKey: ['wallet-balances', organizationId, projectId],
    queryFn: async (): Promise<WalletBalance[]> => {
      if (!organizationId || !supabase) return []
      let query = supabase
        .from('movements')
        .select(`
          amount,
          wallet_id,
          type_id,
          organization_wallets(id, wallets(id, name))
        `)
        .eq('organization_id', organizationId)
      if (projectId) {
        query = query.eq('project_id', projectId)
      }
      const { data: movements, error } = await query
      if (error) throw error
      // Calculate balances by wallet
      const walletBalances: { [key: string]: number } = {}
      const walletNames: { [key: string]: string } = {}
      movements?.forEach((movement: any) => {
        const walletId = movement.wallet_id
        const orgWallet = Array.isArray(movement.organization_wallets) 
          ? movement.organization_wallets[0] 
          : movement.organization_wallets
        const walletData = Array.isArray(orgWallet?.wallets) 
          ? orgWallet?.wallets[0] 
          : orgWallet?.wallets
        const walletName = walletData?.name || 'Sin billetera'
        const amount = movement.amount || 0
        
        walletNames[walletId] = walletName
        
        if (!walletBalances[walletId]) {
          walletBalances[walletId] = 0
        }
        if (amount > 0) {
          walletBalances[walletId] += Math.abs(amount)
        } else {
          walletBalances[walletId] -= Math.abs(amount)
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
      // Convert to array
      const result: WalletBalance[] = Object.entries(walletBalances).map(([walletId, balance], index) => ({
        wallet: walletNames[walletId] || 'Sin billetera',
        balance: Math.max(0, balance), // Only show positive balances
        color: colors[index % colors.length]
      })).filter(item => item.balance > 0)
      return result
    },
    enabled: !!organizationId
  })
}
export function useRecentMovements(organizationId: string | undefined, projectId: string | undefined, limit: number = 5) {
  return useQuery({
    queryKey: ['recent-movements', organizationId, projectId, limit],
    queryFn: async () => {
      if (!organizationId || !supabase) return []
      let query = supabase
        .from('movements')
        .select(`
          id,
          description,
          amount,
          movement_date,
          created_by,
          type_id,
          profiles(full_name, avatar_url)
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
    },
    enabled: !!organizationId
  })
}