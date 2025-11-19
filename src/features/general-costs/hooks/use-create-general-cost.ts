import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createGeneralCost } from '../services/createGeneralCost';
import { GENERAL_COSTS_QUERY_KEYS } from '../constants';
import { toast } from '@/hooks/use-toast';
import type { InsertGeneralCost } from '../types';

export function useCreateGeneralCost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (generalCost: InsertGeneralCost) => createGeneralCost(generalCost),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: GENERAL_COSTS_QUERY_KEYS.lists() });
      
      toast({
        title: 'Gasto general creado',
        description: `El gasto general "${data.name}" ha sido creado correctamente.`,
      });
    },
    onError: (error: any) => {
      console.error('Error creating general cost:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el gasto general',
        variant: 'destructive',
      });
    },
  });
}
