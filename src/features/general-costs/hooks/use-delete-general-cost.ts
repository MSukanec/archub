import { useOptimisticMutation } from '@/core/save-engine';
import { deleteGeneralCost } from '../services/deleteGeneralCost';
import { generalCostsKeys } from '@/core/query-keys';
import type { GeneralCost } from '../types';

export function useDeleteGeneralCost(organizationId: string | null) {
  return useOptimisticMutation({
    mutationFn: (generalCostId: string) => deleteGeneralCost(generalCostId),
    queryKey: generalCostsKeys.list(organizationId),
    optimisticUpdate: (oldData: GeneralCost[] | undefined, generalCostId: string) => {
      if (!oldData) return oldData;
      return oldData.filter((cost) => cost.id !== generalCostId);
    },
    additionalQueryKeys: [
      generalCostsKeys.paymentList(organizationId),
      generalCostsKeys.byCategoryList(organizationId),
      generalCostsKeys.monthlySummaryList(organizationId),
    ],
    onSuccessMessage: 'Gasto general eliminado',
    onErrorMessage: 'No se pudo eliminar el gasto general',
  });
}
