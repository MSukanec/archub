import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useSubcontractAnalysis(projectId: string | null) {
  return useQuery({
    queryKey: ['subcontract-analysis', projectId],
    queryFn: async () => {
      if (!projectId || !supabase) return []

      // Query para obtener subcontratos con sus pagos asociados
      const { data, error } = await supabase
        .from('subcontracts')
        .select(`
          id,
          title,
          amount_total,
          currency_id,
          contact:contacts(id, first_name, last_name, full_name),
          movement_subcontracts(
            id,
            amount,
            movement:movements(
              id,
              amount,
              type_id,
              currency_id,
              exchange_rate
            )
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Procesar los datos para calcular pagos y saldos
      const processedData = data?.map(subcontract => {
        // Calcular total pagado sumando todos los movimientos asociados
        const totalPaid = subcontract.movement_subcontracts?.reduce((sum, ms) => {
          if (ms.movement?.type_id === 'bdb66fac-ade1-46de-a13d-918edf1b94c7') { // Solo EGRESOS
            const movementAmount = ms.movement.amount || 0
            const exchangeRate = ms.movement.exchange_rate || 1
            
            // Convertir a pesos (pesificado) para comparación uniforme
            const convertedAmount = ms.movement.currency_id === '58c50aa7-b8b1-4035-b509-58028dd0e33f' // USD
              ? movementAmount * exchangeRate
              : movementAmount
            
            return sum + convertedAmount
          }
          return sum
        }, 0) || 0

        // Convertir monto total del subcontrato a pesos si es necesario
        const totalAmount = subcontract.currency_id === '58c50aa7-b8b1-4035-b509-58028dd0e33f' // USD
          ? subcontract.amount_total * 1000 // Asumir tasa de cambio de 1000 para USD (ajustar según sea necesario)
          : subcontract.amount_total

        const balance = totalAmount - totalPaid

        return {
          id: subcontract.id,
          subcontrato: subcontract.title,
          proveedor: subcontract.contact?.full_name || `${subcontract.contact?.first_name || ''} ${subcontract.contact?.last_name || ''}`.trim() || 'Sin proveedor',
          montoTotal: totalAmount,
          pagoALaFecha: totalPaid,
          saldo: balance,
          currencyId: subcontract.currency_id
        }
      }) || []

      return processedData
    },
    enabled: !!projectId,
  })
}