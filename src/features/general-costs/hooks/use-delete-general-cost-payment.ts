import { useOptimisticMutation } from '@/core/save-engine';
import { deleteGeneralCostPayment } from '../services/deleteGeneralCostPayment';
import { generalCostsKeys } from '@/core/query-keys';
import type { GeneralCostPayment } from '../types';

interface DeleteGeneralCostPaymentParams {
  id: string;
  organizationId: string;
}

export function useDeleteGeneralCostPayment(organizationId: string | null) {
  return useOptimisticMutation({
    mutationFn: ({ id, organizationId: orgId }: DeleteGeneralCostPaymentParams) =>
      deleteGeneralCostPayment(id, orgId),
    queryKey: generalCostsKeys.paymentList(organizationId),
    optimisticUpdate: (oldData: GeneralCostPayment[] | undefined, { id }: DeleteGeneralCostPaymentParams) => {
      if (!oldData) return oldData;
      return oldData.filter((payment) => payment.id !== id);
    },
    additionalQueryKeys: [
      generalCostsKeys.list(organizationId),
      generalCostsKeys.monthlySummaryList(organizationId),
      generalCostsKeys.byCategoryList(organizationId),
    ],
    onSuccessMessage: 'Pago eliminado',
    onErrorMessage: 'No se pudo eliminar el pago',
  });
}
