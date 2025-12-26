import { useOptimisticMutation } from '@/core/save-engine';
import { createGeneralCostPayment } from '../services/createGeneralCostPayment';
import { generalCostsKeys } from '@/core/query-keys';
import type { InsertGeneralCostPayment, GeneralCostPayment } from '../types';
export function useCreateGeneralCostPayment(organizationId: string | null) {
  return useOptimisticMutation({
    mutationFn: (payment: InsertGeneralCostPayment) => createGeneralCostPayment(payment),
    queryKey: generalCostsKeys.paymentList(organizationId),
    optimisticUpdate: (oldData: GeneralCostPayment[] | undefined, newPayment: InsertGeneralCostPayment) => {
      if (!oldData) return oldData;
      const tempPayment: GeneralCostPayment = {
        id: `temp-${Date.now()}`,
        organization_id: newPayment.organization_id,
        amount: newPayment.amount,
        currency_id: newPayment.currency_id,
        exchange_rate: newPayment.exchange_rate || null,
        payment_date: newPayment.payment_date,
        notes: newPayment.notes || null,
        reference: newPayment.reference || null,
        wallet_id: newPayment.wallet_id || null,
        general_cost_id: newPayment.general_cost_id || null,
        status: (newPayment.status as GeneralCostPayment['status']) || 'confirmed',
        created_by: newPayment.created_by || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return [tempPayment, ...oldData];
    },
    additionalQueryKeys: [
      generalCostsKeys.list(organizationId),
      generalCostsKeys.monthlySummaryList(organizationId),
      generalCostsKeys.byCategoryList(organizationId),
    ],
    onSuccessMessage: 'Pago registrado',
    onErrorMessage: 'No se pudo registrar el pago',
  });
}
