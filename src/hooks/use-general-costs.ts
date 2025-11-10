import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

// Tipo para el gasto general con sus valores
export interface GeneralCost {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  category?: string;
  unit?: {
    id: string;
    name: string;
    symbol: string;
  };
  current_value?: {
    amount: number;
    currency_id: string;
    valid_from: string;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

// Tipo para insertar un gasto general
export interface InsertGeneralCost {
  organization_id: string;
  name: string;
  description?: string | undefined;
}

// Tipo para insertar un valor de gasto general
export interface InsertGeneralCostValue {
  general_cost_id?: string;
  amount: number;
  currency_id: string;
  valid_from: string;
}

// Hook para obtener gastos generales de una organización
export function useGeneralCosts(organizationId: string | null) {
  return useQuery({
    queryKey: ['general-costs', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from('general_costs')
        .select(`
          id,
          organization_id,
          name,
          description,
          created_at,
          updated_at
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Transform data to match expected interface
      const transformedData = data?.map(cost => ({
        ...cost,
        is_active: true, // Assuming all are active for now
        category: 'General', // Default category
        current_value: undefined, // No values for now - can be extended later
        unit: undefined // No units for now - can be extended later
      })) || [];

      return transformedData;
    },
    enabled: !!organizationId,
  });
}

// Hook para obtener un gasto general específico
export function useGeneralCost(generalCostId: string | null) {
  return useQuery({
    queryKey: ['general-cost', generalCostId],
    queryFn: async () => {
      if (!generalCostId) return null;

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from('general_costs')
        .select(`
          id,
          organization_id,
          name,
          description,
          created_at,
          updated_at
        `)
        .eq('id', generalCostId)
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    enabled: !!generalCostId,
  });
}

// Hook para crear gastos generales
export function useCreateGeneralCost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ generalCost }: { generalCost: InsertGeneralCost }) => {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from('general_costs')
        .insert(generalCost)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['general-costs'] });
      
      toast({
        title: 'Gasto general creado',
        description: `El gasto general "${data.name}" ha sido creado correctamente.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el gasto general',
        variant: 'destructive',
      });
    },
  });
}

// Hook para actualizar gastos generales
export function useUpdateGeneralCost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      generalCostId, 
      generalCost 
    }: { 
      generalCostId: string; 
      generalCost: Partial<InsertGeneralCost> 
    }) => {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from('general_costs')
        .update({
          ...generalCost,
          updated_at: new Date().toISOString()
        })
        .eq('id', generalCostId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['general-costs'] });
      queryClient.invalidateQueries({ queryKey: ['general-cost', data.id] });
      
      toast({
        title: 'Gasto general actualizado',
        description: `El gasto general "${data.name}" ha sido actualizado correctamente.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el gasto general',
        variant: 'destructive',
      });
    },
  });
}

// Hook para eliminar gastos generales
export function useDeleteGeneralCost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (generalCostId: string) => {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { error } = await supabase
        .from('general_costs')
        .delete()
        .eq('id', generalCostId);

      if (error) {
        throw error;
      }

      return generalCostId;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['general-costs'] });
      
      toast({
        title: 'Gasto general eliminado',
        description: 'El gasto general ha sido eliminado correctamente.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el gasto general',
        variant: 'destructive',
      });
    },
  });
}