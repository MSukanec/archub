import { useOptimisticMutation } from '@/core/save-engine';
import { updateGeneralCost } from '../services/updateGeneralCost';
import { generalCostsKeys } from '@/core/query-keys';
import type { InsertGeneralCost, GeneralCost } from '../types';
interface UpdateParams {
  generalCostId: string;
  generalCost: Partial<InsertGeneralCost>;
  organizationId: string;
}
export function useUpdateGeneralCost(organizationId: string | null) {
  return useOptimisticMutation({
    mutationFn: ({ generalCostId, generalCost }: UpdateParams) =>
      updateGeneralCost(generalCostId, generalCost),
    queryKey: generalCostsKeys.list(organizationId),
    optimisticUpdate: (oldData: GeneralCost[] | undefined, { generalCostId, generalCost }: UpdateParams) => {
      if (!oldData) return oldData;
      return oldData.map((cost) =>
        cost.id === generalCostId
          ? { ...cost, ...generalCost, updated_at: new Date().toISOString() }
          : cost
      );
    },
    additionalQueryKeys: [
      generalCostsKeys.byCategoryList(organizationId),
    ],
    onSuccessMessage: 'Gasto general actualizado',
    onErrorMessage: 'No se pudo actualizar el gasto general',
  });
}
