import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useClientAnalysis(projectId: string | null) {
  return useQuery({
    queryKey: ['client-analysis', projectId],
    queryFn: async () => {
      if (!projectId || !supabase) {
        console.log('⚠️ ClientAnalysis: Missing projectId or supabase', { projectId, supabase: !!supabase })
        return null
      }

      console.log('🔄 ClientAnalysis: Starting analysis for project:', projectId)

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

      if (clientsError) {
        console.error('❌ ClientAnalysis: Error fetching project clients:', clientsError)
        throw clientsError
      }
      
      console.log('✅ ClientAnalysis: Project clients found:', projectClients?.length || 0)

      // 2. Obtener todos los movimientos del proyecto de tipo egreso (pagos)
      const { data: movements, error: movementsError } = await supabase
        .from('movements')
        .select(`
          id,
          amount,
          currency_id,
          exchange_rate,
          movement_clients(
            id,
            project_client_id
          )
        `)
        .eq('project_id', projectId)

      if (movementsError) {
        console.error('❌ ClientAnalysis: Error fetching movements:', movementsError)
        throw movementsError
      }
      
      console.log('✅ ClientAnalysis: Total movements found:', movements?.length || 0)
      
      // 3. Filtrar solo los movimientos que tienen vinculaciones con project_clients
      const clientPayments = (movements || []).filter(movement => 
        movement.movement_clients && movement.movement_clients.length > 0
      )
      
      console.log('✅ ClientAnalysis: Client payments found:', clientPayments.length)

      // 4. Calcular KPIs
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

      // Calcular total pagado en ARS - usar solo movimientos vinculados a clientes
      const totalPaidAmount = clientPayments.reduce((sum, movement) => {
        return sum + Math.abs(movement.amount || 0)
      }, 0)

      // Calcular saldo restante
      const remainingBalance = totalCommittedAmount - totalPaidAmount

      // Calcular porcentaje pagado
      const paymentPercentage = totalCommittedAmount > 0 
        ? (totalPaidAmount / totalCommittedAmount) * 100 
        : 0

      // Porcentaje restante
      const remainingPercentage = 100 - paymentPercentage

      const result = {
        totalCommitments,
        totalCommittedAmount, // Este es el valor que usaremos para la primera KPI
        totalPaidAmount,
        remainingBalance,
        paymentPercentage,
        remainingPercentage,
        projectClients: projectClients || [],
        movements: clientPayments
      }
      
      console.log('📊 ClientAnalysis: Final result:', result)
      
      return result
    },
    enabled: !!projectId && !!supabase
  })
}