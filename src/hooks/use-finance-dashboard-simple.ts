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
        // Get movements data first
        let movementsQuery = supabase
          .from('movements')
          .select('amount, movement_date, type_id')
          .eq('organization_id', organizationId)

        if (projectId) {
          movementsQuery = movementsQuery.eq('project_id', projectId)
        }

        const { data: movements, error } = await movementsQuery

        if (error) throw error
        if (!movements || movements.length === 0) {
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

        // Get unique type IDs
        const typeIds = Array.from(new Set(movements.map(m => m.type_id).filter(Boolean)))
        
        // Get movement concepts separately
        const { data: concepts } = await supabase
          .from('movement_concepts')
          .select('id, name')
          .in('id', typeIds)

        // Create lookup map
        const conceptsMap = new Map()
        concepts?.forEach(concept => {
          conceptsMap.set(concept.id, concept.name)
        })

        // Calculate totals
        let totalIncome = 0
        let totalExpenses = 0
        let thisMonthIncome = 0
        let thisMonthExpenses = 0

        const currentMonth = new Date()
        const monthStart = startOfMonth(currentMonth)
        const monthEnd = endOfMonth(currentMonth)

        movements.forEach(movement => {
          const amount = Math.abs(movement.amount || 0)
          const typeName = conceptsMap.get(movement.type_id)?.toLowerCase() || ''
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
        if (!movements || movements.length === 0) return []

        // Get unique type IDs
        const typeIds = Array.from(new Set(movements.map(m => m.type_id).filter(Boolean)))
        
        // Get movement concepts separately
        const { data: concepts } = await supabase
          .from('movement_concepts')
          .select('id, name')
          .in('id', typeIds)

        // Create lookup map
        const conceptsMap = new Map()
        concepts?.forEach(concept => {
          conceptsMap.set(concept.id, concept.name)
        })

        // Group by month
        const monthlyData: MonthlyFlowData[] = months.map(month => {
          const monthStart = startOfMonth(month)
          const monthEnd = endOfMonth(month)
          
          let income = 0
          let expenses = 0

          movements.forEach(movement => {
            const movementDate = new Date(movement.movement_date)
            if (movementDate >= monthStart && movementDate <= monthEnd) {
              const amount = Math.abs(movement.amount || 0)
              const typeName = conceptsMap.get(movement.type_id)?.toLowerCase() || ''
              
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
        // Get movements data
        let movementsQuery = supabase
          .from('movements')
          .select('amount, type_id, wallet_id')
          .eq('organization_id', organizationId)

        if (projectId) {
          movementsQuery = movementsQuery.eq('project_id', projectId)
        }

        const { data: movements, error } = await movementsQuery

        if (error) throw error
        if (!movements || movements.length === 0) {
          console.log('No movements found for wallet balances')
          return []
        }

        console.log('Movements found for wallets:', movements.length)

        // Get unique IDs
        const typeIds = Array.from(new Set(movements.map(m => m.type_id).filter(Boolean)))
        const walletIds = Array.from(new Set(movements.map(m => m.wallet_id).filter(Boolean)))
        
        console.log('Wallet IDs found:', walletIds)
        
        // Get concepts and wallets separately
        const [conceptsResult, walletsResult] = await Promise.all([
          supabase.from('movement_concepts').select('id, name').in('id', typeIds),
          supabase.from('wallets').select('id, name').in('id', walletIds)
        ])

        // Create lookup maps
        const conceptsMap = new Map()
        conceptsResult.data?.forEach(concept => {
          conceptsMap.set(concept.id, concept.name)
        })

        const walletsMap = new Map()
        walletsResult.data?.forEach(wallet => {
          walletsMap.set(wallet.id, wallet.name)
        })

        // Calculate balances by wallet
        const walletBalances: { [key: string]: number } = {}

        movements.forEach(movement => {
          const walletName = walletsMap.get(movement.wallet_id) || 'Sin billetera'
          const amount = movement.amount || 0
          const typeName = conceptsMap.get(movement.type_id)?.toLowerCase() || ''
          
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

        console.log('Wallet balances calculated:', walletBalances)

        // Convert to array - show absolute values for all balances
        const result: WalletBalance[] = Object.entries(walletBalances)
          .map(([walletName, balance], index) => ({
            wallet: walletName,
            balance: Math.abs(balance), // Show absolute value (both positive and negative balances)
            color: colors[index % colors.length]
          }))
          .filter(item => item.balance > 0.01) // Filter only very small amounts

        console.log('Final wallet chart data:', result)
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
        // Get recent movements
        let movementsQuery = supabase
          .from('movements')
          .select('id, description, amount, movement_date, type_id')
          .eq('organization_id', organizationId)
          .order('movement_date', { ascending: false })
          .limit(limit)

        if (projectId) {
          movementsQuery = movementsQuery.eq('project_id', projectId)
        }

        const { data: movements, error } = await movementsQuery

        if (error) throw error
        if (!movements || movements.length === 0) return []

        // Get unique type IDs
        const typeIds = Array.from(new Set(movements.map(m => m.type_id).filter(Boolean)))
        
        // Get movement concepts
        const { data: concepts } = await supabase
          .from('movement_concepts')
          .select('id, name')
          .in('id', typeIds)

        // Create lookup map
        const conceptsMap = new Map()
        concepts?.forEach(concept => {
          conceptsMap.set(concept.id, concept.name)
        })

        // Add concept names to movements
        const enrichedMovements = movements.map(movement => ({
          ...movement,
          movement_concepts: {
            name: conceptsMap.get(movement.type_id) || 'Desconocido'
          }
        }))

        return enrichedMovements
      } catch (error) {
        console.error('Error in useRecentMovements:', error)
        return []
      }
    },
    enabled: !!organizationId
  })
}