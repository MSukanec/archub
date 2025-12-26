import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

// Tipo para el costo indirecto con sus valores
export interface IndirectCost {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  created_at: string;
  updated_at: string | null;
  current_value?: {
    amount: number;
    currency_id: string;
    valid_from: string;
  };
}

// Tipo para insertar un costo indirecto
export interface InsertIndirectCost {
  organization_id: string;
  name: string;
  description?: string | undefined;
  category_id?: string | undefined;
}

// Tipo para insertar un valor de costo indirecto
export interface InsertIndirectCostValue {
  indirect_cost_id?: string;
  amount: number;
  currency_id: string;
  valid_from: string;
}

// Hook para obtener costos indirectos de una organización
export function useIndirectCosts(organizationId: string | null) {
  return useQuery({
    queryKey: ['indirect-costs', organizationId],
    queryFn: async () => {
      if (!organizationId || !supabase) return [];
      
      const { data, error } = await supabase
        .from('indirect_costs')
        .select(`
          *,
          current_value:indirect_cost_values!indirect_cost_values_indirect_cost_id_fkey(
            amount,
            currency_id,
            valid_from
          )
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching indirect costs:', error);
        throw error;
      }
      
      // Procesar los datos para obtener el valor actual más reciente
      const processedData = data?.map(cost => ({
        ...cost,
        current_value: cost.current_value?.[0] || null
      })) || [];
      
      return processedData;
    },
    enabled: !!organizationId,
  });
}

// Hook para obtener un costo indirecto individual
export function useIndirectCost(indirectCostId: string | null) {
  return useQuery({
    queryKey: ['indirect-cost', indirectCostId],
    queryFn: async () => {
      if (!indirectCostId || !supabase) return null;
      
      const { data, error } = await supabase
        .from('indirect_costs')
        .select(`
          *,
          values:indirect_cost_values!indirect_cost_values_indirect_cost_id_fkey(
            id,
            amount,
            currency_id,
            valid_from
          )
        `)
        .eq('id', indirectCostId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!indirectCostId,
  });
}

// Hook para crear un costo indirecto
export function useCreateIndirectCost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      indirectCost, 
      initialValue 
    }: { 
      indirectCost: InsertIndirectCost; 
      initialValue?: InsertIndirectCostValue 
    }) => {
      if (!supabase) throw new Error('Supabase not available');

      // Crear el costo indirecto
      const { data: newIndirectCost, error: indirectCostError } = await supabase
        .from('indirect_costs')
        .insert(indirectCost)
        .select()
        .single();

      if (indirectCostError) throw indirectCostError;

      // Crear el valor inicial si se proporciona
      if (initialValue) {
        const valueToInsert = {
          indirect_cost_id: newIndirectCost.id,
          amount: initialValue.amount,
          currency_id: initialValue.currency_id,
          valid_from: initialValue.valid_from,
        };

        const { error: valueError } = await supabase
          .from('indirect_cost_values')
          .insert(valueToInsert);

        if (valueError) throw valueError;
      }

      return newIndirectCost;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['indirect-costs', data.organization_id] });
      toast({
        title: "Costo indirecto creado",
        description: "El costo indirecto ha sido creado exitosamente",
      });
    },
    onError: (error) => {
      console.error('Error creating indirect cost:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el costo indirecto",
        variant: "destructive",
      });
    },
  });
}

// Hook para actualizar un costo indirecto
export function useUpdateIndirectCost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      indirectCostId,
      indirectCost,
      newValue
    }: { 
      indirectCostId: string;
      indirectCost: Partial<InsertIndirectCost>; 
      newValue?: InsertIndirectCostValue 
    }) => {
      if (!supabase) throw new Error('Supabase not available');

      // Actualizar el costo indirecto
      const { data: updatedIndirectCost, error: indirectCostError } = await supabase
        .from('indirect_costs')
        .update(indirectCost)
        .eq('id', indirectCostId)
        .select()
        .single();

      if (indirectCostError) throw indirectCostError;

      // Agregar nuevo valor si se proporciona
      if (newValue) {
        const valueToInsert = {
          indirect_cost_id: indirectCostId,
          amount: newValue.amount,
          currency_id: newValue.currency_id,
          valid_from: newValue.valid_from,
        };

        const { error: valueError } = await supabase
          .from('indirect_cost_values')
          .insert(valueToInsert);

        if (valueError) throw valueError;
      }

      return updatedIndirectCost;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['indirect-costs', data.organization_id] });
      queryClient.invalidateQueries({ queryKey: ['indirect-cost', data.id] });
      toast({
        title: "Costo indirecto actualizado",
        description: "El costo indirecto ha sido actualizado exitosamente",
      });
    },
    onError: (error) => {
      console.error('Error updating indirect cost:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el costo indirecto",
        variant: "destructive",
      });
    },
  });
}

// Hook para eliminar un costo indirecto
export function useDeleteIndirectCost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (indirectCostId: string) => {
      if (!supabase) throw new Error('Supabase not available');

      // Hard delete - eliminar el registro
      const { error } = await supabase
        .from('indirect_costs')
        .delete()
        .eq('id', indirectCostId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indirect-costs'] });
      toast({
        title: "Costo indirecto eliminado",
        description: "El costo indirecto ha sido eliminado correctamente",
      });
    },
    onError: (error) => {
      console.error('Error deleting indirect cost:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el costo indirecto",
        variant: "destructive",
      });
    },
  });
}