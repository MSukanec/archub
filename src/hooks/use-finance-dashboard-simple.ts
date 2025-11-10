import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval, startOfYear, endOfYear, subYears, subQuarters, startOfQuarter, endOfQuarter } from 'date-fns'
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

// Helper function to get date range based on time period
function getDateRange(timePeriod: string) {
  const now = new Date()
  
  switch (timePeriod) {
    case 'mes':
      return {
        start: startOfMonth(now),
        end: endOfMonth(now)
      }
    case 'trimestre':
      return {
        start: startOfQuarter(now),
        end: endOfQuarter(now)
      }
    case 'semestre':
      return {
        start: startOfMonth(subMonths(now, 5)),
        end: endOfMonth(now)
      }
    case 'año':
      return {
        start: startOfYear(now),
        end: endOfYear(now)
      }
    case 'desde-siempre':
    default:
      return null // No date filtering
  }
}

export function useFinancialSummary(organizationId: string | undefined, projectId: string | undefined, timePeriod: string = 'desde-siempre') {
  return useQuery({
    queryKey: ['financial-summary', organizationId, projectId, timePeriod],
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

        // Apply date filtering if needed
        const dateRange = getDateRange(timePeriod)
        if (dateRange) {
          movementsQuery = movementsQuery
            .gte('movement_date', dateRange.start.toISOString())
            .lte('movement_date', dateRange.end.toISOString())
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

export function useMonthlyFlowData(organizationId: string | undefined, projectId: string | undefined, timePeriod: string = 'desde-siempre') {
  return useQuery({
    queryKey: ['monthly-flow', organizationId, projectId, timePeriod],
    queryFn: async (): Promise<MonthlyFlowData[]> => {
      if (!organizationId || !supabase) return []

      try {
        // Adjust time range based on period
        let endDate = new Date()
        let startDate: Date
        let months: Date[]

        const dateRange = getDateRange(timePeriod)
        if (dateRange) {
          startDate = dateRange.start
          endDate = dateRange.end
        } else {
          // Default: last 12 months
          startDate = subMonths(endDate, 11)
        }

        // Generate months within the range
        months = eachMonthOfInterval({ start: startDate, end: endDate })

        // Get movements data
        let movementsQuery = supabase
          .from('movements')
          .select('amount, movement_date, type_id')
          .eq('organization_id', organizationId)
          .gte('movement_date', startDate.toISOString())
          .lte('movement_date', endDate.toISOString())

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
        return []
      }
    },
    enabled: !!organizationId
  })
}

export function useWalletBalances(organizationId: string | undefined, projectId: string | undefined, timePeriod: string = 'desde-siempre') {
  return useQuery({
    queryKey: ['wallet-balances', organizationId, projectId, timePeriod],
    queryFn: async (): Promise<WalletBalance[]> => {
      if (!organizationId || !supabase) return []

      try {
        // Get movements data
        let movementsQuery = supabase
          .from('movements')
          .select('amount, type_id, wallet_id, movement_date')
          .eq('organization_id', organizationId)

        if (projectId) {
          movementsQuery = movementsQuery.eq('project_id', projectId)
        }

        // Apply date filtering if needed
        const dateRange = getDateRange(timePeriod)
        if (dateRange) {
          movementsQuery = movementsQuery
            .gte('movement_date', dateRange.start.toISOString())
            .lte('movement_date', dateRange.end.toISOString())
        }

        const { data: movements, error } = await movementsQuery

        if (error) throw error
        if (!movements || movements.length === 0) {
          return []
        }


        // Get unique IDs
        const typeIds = Array.from(new Set(movements.map(m => m.type_id).filter(Boolean)))
        const walletIds = Array.from(new Set(movements.map(m => m.wallet_id).filter(Boolean)))
        
        
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

        // Generate colors - using hardcoded HSL values like ExpensesByCategory
        const colors = [
          'hsl(110, 40%, 50%)',
          'hsl(173, 58%, 39%)',
          'hsl(197, 37%, 24%)',
          'hsl(43, 74%, 66%)',
          'hsl(0, 87%, 67%)'
        ]


        // Convert to array - show absolute values for all balances
        const result: WalletBalance[] = Object.entries(walletBalances)
          .map(([walletName, balance], index) => ({
            wallet: walletName,
            balance: Math.abs(balance), // Show absolute value (both positive and negative balances)
            color: colors[index % colors.length]
          }))
          .filter(item => item.balance > 0.01) // Filter only very small amounts

        return result
      } catch (error) {
        return []
      }
    },
    enabled: !!organizationId
  })
}

export function useRecentMovements(organizationId: string | undefined, projectId: string | undefined, limit: number = 5, timePeriod: string = 'desde-siempre') {
  return useQuery({
    queryKey: ['recent-movements', organizationId, projectId, limit, timePeriod],
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

        // Apply date filtering if needed
        const dateRange = getDateRange(timePeriod)
        if (dateRange) {
          movementsQuery = movementsQuery
            .gte('movement_date', dateRange.start.toISOString())
            .lte('movement_date', dateRange.end.toISOString())
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
        return []
      }
    },
    enabled: !!organizationId
  })
}

interface ExpensesCategoryData {
  category: string
  amount: number
  percentage: number
  color: string
}

export function useExpensesByCategory(organizationId: string | undefined, projectId: string | undefined, timePeriod: string = 'desde-siempre') {
  return useQuery({
    queryKey: ['expenses-by-category', organizationId, projectId, timePeriod],
    queryFn: async (): Promise<ExpensesCategoryData[]> => {
      if (!organizationId || !supabase) return []

      try {
        // First, get the EGRESO type concept IDs
        const { data: egresoTypes } = await supabase
          .from('movement_concepts')
          .select('id, name')
          .ilike('name', '%egreso%')
          
        if (!egresoTypes || egresoTypes.length === 0) {
          return []
        }
        
        const egresoTypeIds = egresoTypes.map(type => type.id)
        
        // Base query for movements - get all movements filtered by EGRESO types
        let movementsQuery = supabase
          .from('movements')
          .select(`
            amount,
            type_id,
            category_id,
            subcategory_id
          `)
          .eq('organization_id', organizationId)
          .in('type_id', egresoTypeIds) // Only EGRESO movements
          .neq('amount', 0) // Exclude zero amounts

        if (projectId) {
          movementsQuery = movementsQuery.eq('project_id', projectId)
        }

        // Apply date filtering if needed
        const dateRange = getDateRange(timePeriod)
        if (dateRange) {
          movementsQuery = movementsQuery
            .gte('movement_date', dateRange.start.toISOString())
            .lte('movement_date', dateRange.end.toISOString())
        }

        const { data: movements, error } = await movementsQuery

        if (error) throw error
        
        if (!movements || movements.length === 0) {
          return []
        }

        // Get unique category IDs
        const categoryIds = Array.from(new Set(movements.map(m => m.category_id).filter(Boolean)))
        
        // Get movement concepts (categories)
        const { data: categories } = await supabase
          .from('movement_concepts')
          .select('id, name')
          .in('id', categoryIds)

        // Create lookup map
        const categoriesMap = new Map()
        categories?.forEach(category => {
          categoriesMap.set(category.id, category.name)
        })

        // Group by category and sum amounts
        const categoryTotals = new Map<string, number>()
        let totalExpenses = 0

        // Process expense movements by category
        movements.forEach((movement: any) => {
          const categoryName = categoriesMap.get(movement.category_id) || 'Sin Categoría'
          const amount = Math.abs(movement.amount) // Convert to positive for display
          
          categoryTotals.set(categoryName, (categoryTotals.get(categoryName) || 0) + amount)
          totalExpenses += amount
        })

        // Convert to array with percentages and colors
        const colors = [
          "hsl(110, 40%, 50%)",
          "hsl(173, 58%, 39%)",
          "hsl(197, 37%, 24%)",
          "hsl(43, 74%, 66%)",
          "hsl(0, 87%, 67%)",
          "hsl(270, 50%, 50%)",
          "hsl(20, 70%, 50%)",
          "hsl(60, 80%, 50%)",
          "hsl(120, 60%, 40%)",
          "hsl(300, 70%, 60%)"
        ]

        const result: ExpensesCategoryData[] = Array.from(categoryTotals.entries())
          .map(([category, amount], index) => ({
            category,
            amount,
            percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
            color: colors[index % colors.length]
          }))
          .sort((a, b) => b.amount - a.amount) // Sort by amount descending
          .filter(item => item.amount > 0) // Only include positive amounts



        return result
      } catch (error) {
        return []
      }
    },
    enabled: !!organizationId
  })
}