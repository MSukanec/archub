import { supabase } from '@/lib/supabase';
import { convert } from '@/lib/money';
export interface SubcontractAnalysisData {
  id: string;
  subcontrato: string;
  proveedor: string;
  montoTotal: number;
  montoTotalUSD: number;
  pagoALaFecha: number;
  pagoALaFechaUSD: number;
  saldo: number;
  saldoUSD: number;
  currencySymbol: string;
  exchangeRate: number;
}
export async function getSubcontractAnalysis(projectId: string): Promise<SubcontractAnalysisData[]> {
  if (!projectId || !supabase) {
    return [];
  }
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
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching subcontract analysis:', error);
    throw error;
  }
  const processedData = data?.map(subcontract => {
    const totalPaid = (subcontract.movement_subcontracts || []).reduce((sum, ms) => {
      const movement = Array.isArray(ms.movement) ? ms.movement[0] : ms.movement;
      
      if (movement && movement.type_id === 'bdb66fac-ade1-46de-a13d-918edf1b94c7') {
        const movementAmount = movement.amount || 0;
        
        const convertedAmount = movement.currency_id === '58c50aa7-b8b1-4035-b509-58028dd0e33f'
          ? convert(movementAmount, movement.exchange_rate)
          : movementAmount;
        
        return sum + convertedAmount;
      }
      return sum;
    }, 0);
    const totalAmountOriginal = subcontract.amount_total || 0;
    const totalAmountUSD = subcontract.currency_id === '58c50aa7-b8b1-4035-b509-58028dd0e33f'
      ? totalAmountOriginal
      : convert(totalAmountOriginal, subcontract.exchange_rate, { direction: 'divide'});
    const totalPaidUSD = (subcontract.movement_subcontracts || []).reduce((sum, ms) => {
      const movement = Array.isArray(ms.movement) ? ms.movement[0] : ms.movement;
      
      if (movement && movement.type_id === 'bdb66fac-ade1-46de-a13d-918edf1b94c7') {
        const movementAmount = movement.amount || 0;
        const movementAmountUSD = movement.currency_id === '58c50aa7-b8b1-4035-b509-58028dd0e33f'
          ? movementAmount
          : convert(movementAmount, movement.exchange_rate, { direction: 'divide'});
        return sum + movementAmountUSD;
      }
      return sum;
    }, 0);
    const balanceOriginal = totalAmountOriginal - totalPaid;
    const balanceUSD = totalAmountUSD - totalPaidUSD;
    const contact = Array.isArray(subcontract.contact) ? subcontract.contact[0] : subcontract.contact;
    const proveedorName = !contact 
      ? 'Sin proveedor'
      : contact.full_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Sin proveedor';
    return {
      id: subcontract.id,
      subcontrato: subcontract.title,
      proveedor: proveedorName,
      montoTotal: totalAmountOriginal,
      montoTotalUSD: totalAmountUSD,
      pagoALaFecha: totalPaid,
      pagoALaFechaUSD: totalPaidUSD,
      saldo: balanceOriginal,
      saldoUSD: balanceUSD,
      currencySymbol: subcontract.currency_id === '58c50aa7-b8b1-4035-b509-58028dd0e33f'? 'USD': 'ARS',
      exchangeRate: subcontract.exchange_rate || 1
    };
  }) || [];
  return processedData;
}
