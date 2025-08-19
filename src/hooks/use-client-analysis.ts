import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useClientAnalysis(projectId: string | null) {
  return useQuery({
    queryKey: ['client-analysis', projectId],
    queryFn: async () => {
      if (!projectId || !supabase) return null

      // 1. Obtener todos los compromisos de clientes del proyecto
      const { data: projectClients, error: clientsError } = await supabase
        .from('project_clients')
        .select(`
          id,
          client_id,
          unit,
          committed_amount,
          currency_id,
          exchange_rate,
          contacts!inner(
            id,
            first_name,
            last_name,
            company_name,
            full_name
          )
        `)
        .eq('project_id', projectId)

      if (clientsError) throw clientsError

      // 2. Obtener todos los pagos usando la nueva vista MOVEMENT_PAYMENTS_VIEW
      const { data: clientPayments, error: paymentsError } = await supabase
        .from('movement_payments_view')
        .select('*')
        .eq('project_id', projectId)

      if (paymentsError) throw paymentsError

      // 4. Calcular KPIs por moneda
      const totalCommitments = projectClients?.length || 0
      
      // Agrupar compromisos por moneda
      const commitmentsByCurrency = (projectClients || []).reduce((acc: Record<string, any>, client: any) => {
        const currencyId = client.currency_id
        const amount = client.committed_amount || 0
        
        if (!acc[currencyId]) {
          acc[currencyId] = {
            totalCommitted: 0,
            totalPaid: 0,
            currencyId
          }
        }
        
        acc[currencyId].totalCommitted += amount
        return acc
      }, {} as Record<string, any>)

      // Agrupar pagos por moneda
      (clientPayments || []).forEach((payment: any) => {
        const currencyId = payment.currency_id
        const amount = Math.abs(payment.amount || 0)
        
        if (commitmentsByCurrency[currencyId]) {
          commitmentsByCurrency[currencyId].totalPaid += amount
        }
      })

      // Calcular métricas por moneda
      const currencyMetrics = Object.values(commitmentsByCurrency).map((currency: any) => {
        const remainingBalance = currency.totalCommitted - currency.totalPaid
        const paymentPercentage = currency.totalCommitted > 0 
          ? (currency.totalPaid / currency.totalCommitted) * 100 
          : 0
        const remainingPercentage = 100 - paymentPercentage

        return {
          ...currency,
          remainingBalance,
          paymentPercentage,
          remainingPercentage
        }
      })

      // Para compatibilidad, usar la primera moneda como principal o calcular totales generales
      const primaryCurrency = currencyMetrics[0] || {
        totalCommitted: 0,
        totalPaid: 0,
        remainingBalance: 0,
        paymentPercentage: 0,
        remainingPercentage: 100
      }

      // Totales legacy para compatibilidad
      const totalCommittedAmount = primaryCurrency.totalCommitted
      const totalPaidAmount = primaryCurrency.totalPaid
      const remainingBalance = primaryCurrency.remainingBalance
      const paymentPercentage = primaryCurrency.paymentPercentage
      const remainingPercentage = primaryCurrency.remainingPercentage

      return {
        totalCommitments,
        totalCommittedAmount,
        totalPaidAmount,
        remainingBalance,
        paymentPercentage,
        remainingPercentage,
        currencyMetrics,
        projectClients: projectClients || [],
        movements: clientPayments
      }
    },
    enabled: !!projectId && !!supabase
  })
}