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

      // 2. Obtener todos los pagos realizados a clientes del proyecto
      const projectClientsSubcategoryId = 'f3b96eda-15d5-4c96-ade7-6f53685115d3'
      
      const { data: movements, error: movementsError } = await supabase
        .from('movements')
        .select(`
          id,
          amount,
          currency_id,
          exchange_rate,
          movement_clients!inner(
            id,
            project_client_id,
            amount,
            project_clients!inner(
              id,
              client_id,
              unit,
              committed_amount,
              currency_id
            )
          )
        `)
        .eq('project_id', projectId)
        .eq('subcategory_id', projectClientsSubcategoryId)

      if (movementsError) throw movementsError

      // 3. Calcular KPIs
      const totalCommitments = projectClients?.length || 0
      
      // Calcular total comprometido en ARS (conversión básica)
      const totalCommittedAmount = (projectClients || []).reduce((sum, client) => {
        const amount = client.committed_amount || 0
        // Conversión simple para USD a ARS (se puede mejorar con tasas dinámicas)
        if (client.currency_id === '58c50aa7-b8b1-4035-b509-58028dd0e33f') { // USD
          return sum + (amount * 1125) // Tasa fija temporal
        }
        return sum + amount
      }, 0)

      // Calcular total pagado en ARS
      const totalPaidAmount = (movements || []).reduce((sum, movement) => {
        return sum + (movement.movement_clients?.[0]?.amount || 0)
      }, 0)

      // Calcular saldo restante
      const remainingBalance = totalCommittedAmount - totalPaidAmount

      // Calcular porcentaje pagado
      const paymentPercentage = totalCommittedAmount > 0 
        ? (totalPaidAmount / totalCommittedAmount) * 100 
        : 0

      // Porcentaje restante
      const remainingPercentage = 100 - paymentPercentage

      return {
        totalCommitments,
        totalCommittedAmount, // Este es el valor que usaremos para la primera KPI
        totalPaidAmount,
        remainingBalance,
        paymentPercentage,
        remainingPercentage,
        projectClients: projectClients || [],
        movements: movements || []
      }
    },
    enabled: !!projectId && !!supabase
  })
}