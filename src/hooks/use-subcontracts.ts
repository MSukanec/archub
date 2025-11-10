import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import type { InsertSubcontract, InsertSubcontractTask } from '@shared/schema';

// Hook para obtener subcontratos de un proyecto
export function useSubcontracts(projectId: string | null) {
  return useQuery({
    queryKey: ['subcontracts', projectId],
    queryFn: async () => {
      if (!projectId || !supabase) return [];
      
      const { data, error } = await supabase
        .from('subcontracts')
        .select(`
          *,
          contact:contacts(id, first_name, last_name, full_name, company_name, email),
          winner_bid:subcontract_bids!winner_bid_id(
            id,
            contacts(id, first_name, last_name, full_name, company_name, email)
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      
      return data || [];
    },
    enabled: !!projectId,
  });
}

// Hook para obtener un subcontrato individual
export function useSubcontract(subcontractId: string | null) {
  return useQuery({
    queryKey: ['subcontract', subcontractId],
    queryFn: async () => {
      if (!subcontractId || !supabase) return null;
      
      const { data, error } = await supabase
        .from('subcontracts')
        .select(`
          *,
          contact:contacts(id, first_name, last_name, full_name, company_name, email)
        `)
        .eq('id', subcontractId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!subcontractId,
  });
}

// Hook para crear un subcontrato con tareas
export function useCreateSubcontract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      subcontract, 
      taskIds 
    }: { 
      subcontract: InsertSubcontract; 
      taskIds: string[] 
    }) => {
      if (!supabase) throw new Error('Supabase not available');

      // Crear el subcontrato
      const { data: newSubcontract, error: subcontractError } = await supabase
        .from('subcontracts')
        .insert(subcontract)
        .select()
        .single();

      if (subcontractError) throw subcontractError;

      // Crear las tareas del subcontrato
      if (taskIds.length > 0) {
        const subcontractTasks: InsertSubcontractTask[] = taskIds.map(taskId => ({
          subcontract_id: newSubcontract.id,
          task_id: taskId,
          amount: 0,
          notes: null,
        }));

        const { error: tasksError } = await supabase
          .from('subcontract_tasks')
          .insert(subcontractTasks);

        if (tasksError) throw tasksError;
      }

      return newSubcontract;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subcontracts', data.project_id] });
      toast({
        title: "Subcontrato creado",
        description: "El pedido de subcontrato ha sido creado exitosamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear el subcontrato",
        variant: "destructive",
      });
    },
  });
}

// Hook para actualizar un subcontrato
export function useUpdateSubcontract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      subcontractId,
      subcontract, 
      taskIds 
    }: { 
      subcontractId: string;
      subcontract: Partial<InsertSubcontract>; 
      taskIds: string[] 
    }) => {
      if (!supabase) throw new Error('Supabase not available');

      // Actualizar el subcontrato
      const { data: updatedSubcontract, error: subcontractError } = await supabase
        .from('subcontracts')
        .update(subcontract)
        .eq('id', subcontractId)
        .select()
        .single();

      if (subcontractError) throw subcontractError;

      // TODO: Actualizar las tareas del subcontrato cuando la tabla esté lista
      // Primero eliminar todas las tareas existentes, luego insertar las nuevas
      // if (taskIds.length > 0) {
      //   await supabase
      //     .from('subcontract_tasks')
      //     .delete()
      //     .eq('subcontract_id', subcontractId);

      //   const subcontractTasks: InsertSubcontractTask[] = taskIds.map(taskId => ({
      //     subcontract_id: subcontractId,
      //     task_id: taskId,
      //     amount: 0,
      //     notes: null,
      //   }));

      //   const { error: tasksError } = await supabase
      //     .from('subcontract_tasks')
      //     .insert(subcontractTasks);

      //   if (tasksError) throw tasksError;
      // }

      return updatedSubcontract;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subcontracts', data.project_id] });
      queryClient.invalidateQueries({ queryKey: ['subcontract', data.id] });
      toast({
        title: "Subcontrato actualizado",
        description: "El subcontrato ha sido actualizado exitosamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el subcontrato",
        variant: "destructive",
      });
    },
  });
}

// Hook para eliminar un subcontrato
export function useDeleteSubcontract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subcontractId: string) => {
      if (!supabase) throw new Error('Supabase not available');

      const { error } = await supabase
        .from('subcontracts')
        .delete()
        .eq('id', subcontractId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcontracts'] });
      toast({
        title: "Subcontrato eliminado",
        description: "El subcontrato ha sido eliminado correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el subcontrato",
        variant: "destructive",
      });
    },
  });
}

// Hook para obtener contactos/proveedores
export function useContacts(organizationId: string | null) {
  return useQuery({
    queryKey: ['contacts', organizationId],
    queryFn: async () => {
      if (!organizationId || !supabase) return [];
      
      const { data, error } = await supabase
        .from('contacts')
        .select('id, name, email, phone, contact_type')
        .eq('organization_id', organizationId)
        .order('name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });
}