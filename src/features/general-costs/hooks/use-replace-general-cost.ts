import { useOptimisticMutation } from '@/core/save-engine';
import { replaceGeneralCost } from '../services/replaceGeneralCost';
import { generalCostsKeys } from '@/core/query-keys';
import type { GeneralCost } from '../types';

interface ReplaceParams {
  oldId: string;
  newId: string;
}

export function useReplaceGeneralCost(organizationId: string | null) {
  return useOptimisticMutation({
    mutationFn: ({ oldId, newId }: ReplaceParams) => replaceGeneralCost(oldId, newId),
    queryKey: generalCostsKeys.list(organizationId),
    optimisticUpdate: (oldData: GeneralCost[] | undefined, { oldId }: ReplaceParams) => {
      if (!oldData) return oldData;
      return oldData.filter((cost) => cost.id !== oldId);
    },
    additionalQueryKeys: [
      generalCostsKeys.paymentList(organizationId),
      generalCostsKeys.byCategoryList(organizationId),
      generalCostsKeys.monthlySummaryList(organizationId),
    ],
    onSuccessMessage: 'Concepto reemplazado',
    onErrorMessage: 'No se pudo reemplazar el concepto de gasto',
  });
}
