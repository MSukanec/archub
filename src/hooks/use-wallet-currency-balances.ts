import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface WalletCurrencyBalance {
  wallet: string
  currency: string
  balance: number
  state: 'Positivo' | 'Negativo' | 'Neutro'
}

export function useWalletCurrencyBalances(
  organizationId: string | undefined, 
  projectId: string | undefined, 
  timePeriod: string = 'desde-siempre'
) {
  return useQuery({
    queryKey: ['wallet-currency-balances', organizationId, projectId, timePeriod],
    queryFn: async (): Promise<WalletCurrencyBalance[]> => {
      if (!organizationId || !supabase) return []

      try {
        // Get movements with all necessary joins
        let movementsQuery = supabase
          .from('movements')
          .select(`
            amount,
            wallet_id,
            currency_id,
            type_id,
            movement_date
          `)
          .eq('organization_id', organizationId)
          .not('wallet_id', 'is', null)
          .not('currency_id', 'is', null)

        if (projectId) {
          movementsQuery = movementsQuery.eq('project_id', projectId)
        }

        // Apply date filtering based on timePeriod
        if (timePeriod !== 'desde-siempre') {
          const now = new Date()
          let startDate: Date

          switch (timePeriod) {
            case 'mes':
              startDate = new Date(now.getFullYear(), now.getMonth(), 1)
              break
            case 'trimestre':
              startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1)
              break
            case 'semestre':
              startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1)
              break
            case 'año':
              startDate = new Date(now.getFullYear(), 0, 1)
              break
            default:
              startDate = new Date(0) // Desde siempre
          }

          if (timePeriod !== 'desde-siempre') {
            movementsQuery = movementsQuery.gte('movement_date', startDate.toISOString().split('T')[0])
          }
        }

        const { data: movements, error } = await movementsQuery

        if (error) throw error
        if (!movements || movements.length === 0) {
          console.log('No movements found for wallet-currency balances')
          return []
        }

        console.log('Movements found for wallet-currency analysis:', movements.length)

        // Get unique IDs to fetch related data
        const walletIds = Array.from(new Set(movements.map(m => m.wallet_id).filter(Boolean)))
        const currencyIds = Array.from(new Set(movements.map(m => m.currency_id).filter(Boolean)))
        const typeIds = Array.from(new Set(movements.map(m => m.type_id).filter(Boolean)))

        console.log('Wallet IDs from movements:', walletIds)
        console.log('Currency IDs from movements:', currencyIds)
        console.log('Type IDs from movements:', typeIds)

        // Fetch related data in parallel - usar organization_wallets para obtener los nombres de billeteras
        const [walletsResult, currenciesResult, conceptsResult] = await Promise.all([
          supabase
            .from('organization_wallets')
            .select('id, wallets(name)')
            .in('id', walletIds),
          supabase.from('currencies').select('id, name').in('id', currencyIds),
          supabase.from('movement_concepts').select('id, name').in('id', typeIds)
        ])

        console.log('Wallets fetched from organization_wallets:', walletsResult.data)
        console.log('Currencies fetched:', currenciesResult.data)
        console.log('Concepts fetched:', conceptsResult.data)

        // Create lookup maps
        const walletsMap = new Map()
        walletsResult.data?.forEach(orgWallet => {
          // Acceder al nombre de la billetera desde la relación anidada
          const walletName = orgWallet.wallets?.name || 'Sin nombre'
          walletsMap.set(orgWallet.id, walletName)
        })

        const currenciesMap = new Map()
        currenciesResult.data?.forEach(currency => {
          currenciesMap.set(currency.id, currency.name)
        })

        const conceptsMap = new Map()
        conceptsResult.data?.forEach(concept => {
          conceptsMap.set(concept.id, concept.name)
        })

        // Calculate balances by wallet + currency combination
        const balanceMap = new Map<string, {
          wallet: string
          currency: string
          balance: number
        }>()

        movements.forEach(movement => {
          const walletName = walletsMap.get(movement.wallet_id) || 'Sin billetera'
          const currencyName = currenciesMap.get(movement.currency_id) || 'Sin moneda'
          const amount = movement.amount || 0
          const typeName = conceptsMap.get(movement.type_id)?.toLowerCase() || ''
          
          const key = `${walletName}|${currencyName}`
          
          if (!balanceMap.has(key)) {
            balanceMap.set(key, {
              wallet: walletName,
              currency: currencyName,
              balance: 0
            })
          }

          const balanceEntry = balanceMap.get(key)!
          
          // Apply movement based on type
          if (typeName.includes('ingreso')) {
            balanceEntry.balance += Math.abs(amount)
          } else if (typeName.includes('egreso')) {
            balanceEntry.balance -= Math.abs(amount)
          }
        })

        // Convert to result array with state classification
        const result: WalletCurrencyBalance[] = Array.from(balanceMap.values())
          .map(entry => ({
            wallet: entry.wallet,
            currency: entry.currency,
            balance: entry.balance,
            state: entry.balance > 0 ? 'Positivo' : entry.balance < 0 ? 'Negativo' : 'Neutro'
          }))
          .sort((a, b) => {
            // Sort by wallet name first, then by currency
            if (a.wallet !== b.wallet) {
              return a.wallet.localeCompare(b.wallet)
            }
            return a.currency.localeCompare(b.currency)
          })

        console.log('Final wallet-currency balance data:', result)
        return result

      } catch (error) {
        console.error('Error in useWalletCurrencyBalances:', error)
        return []
      }
    },
    enabled: !!organizationId
  })
}