import { useOptimisticMutation } from '@/core/save-engine';
import { updateGeneralCostPayment } from '../services/updateGeneralCostPayment';
import { generalCostsKeys } from '@/core/query-keys';
import type { GeneralCostPayment } from '../types';

interface UpdateGeneralCostPaymentParams {
  id: string;
  organizationId: string;
  updates: Partial<GeneralCostPayment>;
}

export function useUpdateGeneralCostPayment(organizationId: string | null) {
  return useOptimisticMutation({
    mutationFn: ({ id, organizationId: orgId, updates }: UpdateGeneralCostPaymentParams) =>
      updateGeneralCostPayment(id, orgId, updates),
    queryKey: generalCostsKeys.paymentList(organizationId),
    optimisticUpdate: (oldData: GeneralCostPayment[] | undefined, { id, updates }: UpdateGeneralCostPaymentParams) => {
      if (!oldData) return oldData;
      return oldData.map((payment) =>
        payment.id === id
          ? { ...payment, ...updates, updated_at: new Date().toISOString() }
          : payment
      );
    },
    additionalQueryKeys: [
      generalCostsKeys.list(organizationId),
      generalCostsKeys.monthlySummaryList(organizationId),
      generalCostsKeys.byCategoryList(organizationId),
    ],
    onSuccessMessage: 'Pago actualizado',
    onErrorMessage: 'No se pudo actualizar el pago',
  });
}
