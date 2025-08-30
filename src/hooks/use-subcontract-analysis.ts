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
          exchange_rate,
          contact:contacts(id, first_name, last_name, full_name),
          movement_subcontracts(
            id,
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
        const totalPaid = (subcontract.movement_subcontracts || []).reduce((sum, ms) => {
          // Manejar si movement es un array (relación múltiple) o un objeto (relación única)
          const movement = Array.isArray(ms.movement) ? ms.movement[0] : ms.movement
          
          if (movement && movement.type_id === 'bdb66fac-ade1-46de-a13d-918edf1b94c7') { // Solo EGRESOS
            const movementAmount = movement.amount || 0
            const exchangeRate = movement.exchange_rate || 1
            
            // Convertir a pesos (pesificado) para comparación uniforme
            const convertedAmount = movement.currency_id === '58c50aa7-b8b1-4035-b509-58028dd0e33f' // USD
              ? movementAmount * exchangeRate
              : movementAmount
            
            return sum + convertedAmount
          }
          return sum
        }, 0)

        // Calcular monto total en moneda original y USD
        const totalAmountOriginal = subcontract.amount_total
        const totalAmountUSD = subcontract.currency_id === '58c50aa7-b8b1-4035-b509-58028dd0e33f' // USD
          ? totalAmountOriginal
          : totalAmountOriginal / (subcontract.exchange_rate || 1)

        // Calcular pago total en USD
        const totalPaidUSD = (subcontract.movement_subcontracts || []).reduce((sum, ms) => {
          // Manejar si movement es un array (relación múltiple) o un objeto (relación única)
          const movement = Array.isArray(ms.movement) ? ms.movement[0] : ms.movement
          
          if (movement && movement.type_id === 'bdb66fac-ade1-46de-a13d-918edf1b94c7') { // Solo EGRESOS
            const movementAmount = movement.amount || 0
            const movementAmountUSD = movement.currency_id === '58c50aa7-b8b1-4035-b509-58028dd0e33f' // USD
              ? movementAmount
              : movementAmount / (movement.exchange_rate || 1)
            return sum + movementAmountUSD
          }
          return sum
        }, 0)

        const balanceOriginal = totalAmountOriginal - totalPaid
        const balanceUSD = totalAmountUSD - totalPaidUSD

        return {
          id: subcontract.id,
          subcontrato: subcontract.title,
          proveedor: Array.isArray(subcontract.contact) 
            ? (subcontract.contact.length > 0 
                ? (subcontract.contact[0]?.full_name || `${subcontract.contact[0]?.first_name || ''} ${subcontract.contact[0]?.last_name || ''}`.trim() || 'Sin proveedor')
                : 'Sin proveedor')
            : (subcontract.contact?.full_name || `${subcontract.contact?.first_name || ''} ${subcontract.contact?.last_name || ''}`.trim() || 'Sin proveedor'),
          montoTotal: totalAmountOriginal,
          montoTotalUSD: totalAmountUSD,
          pagoALaFecha: totalPaid,
          pagoALaFechaUSD: totalPaidUSD,
          saldo: balanceOriginal,
          saldoUSD: balanceUSD,
          currencySymbol: subcontract.currency_id === '58c50aa7-b8b1-4035-b509-58028dd0e33f' ? 'USD' : 'ARS',
          exchangeRate: subcontract.exchange_rate || 1
        }
      }) || []

      return processedData
    },
    enabled: !!projectId,
  })
}