import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

export interface MovementConceptAdmin {
  id: string;
  name: string;
  description?: string;
  parent_id: string | null;
  organization_id: string;
  is_system: boolean;
  view_mode: string;

  created_at: string;
  updated_at: string;
  children?: MovementConceptAdmin[];
}

export interface CreateMovementConceptData {
  name: string;
  description?: string;
  parent_id?: string | null;
  organization_id: string;
  is_system?: boolean;
  view_mode?: string;

}

export interface UpdateMovementConceptData extends CreateMovementConceptData {
  id: string;
}

export function useMovementConceptsAdmin() {
  return useQuery({
    queryKey: ['movement-concepts-admin'],
    enabled: true,
    retry: false,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      console.log('🔍 Fetching system movement concepts...');

      const { data: concepts, error } = await supabase
        .from('movement_concepts')
        .select('id, name, description, parent_id, organization_id, is_system, view_mode, created_at, updated_at')
        .eq('is_system', true)
        .order('name');

      console.log('📊 Movement concepts query result:', { concepts, error, count: concepts?.length });

      if (error) {
        throw error;
      }

      // Build hierarchical structure
      const conceptMap = new Map();
      const rootConcepts: MovementConceptAdmin[] = [];

      // First pass: create map and identify roots
      concepts.forEach((concept: MovementConceptAdmin) => {
        conceptMap.set(concept.id, { ...concept, children: [] });
        if (!concept.parent_id) {
          rootConcepts.push(conceptMap.get(concept.id));
        }
      });

      // Second pass: build hierarchy
      concepts.forEach((concept: MovementConceptAdmin) => {
        if (concept.parent_id) {
          const parent = conceptMap.get(concept.parent_id);
          if (parent) {
            parent.children.push(conceptMap.get(concept.id));
          }
        }
      });

      // Sort children recursively
      const sortConcepts = (concepts: MovementConceptAdmin[]) => {
        concepts.sort((a, b) => a.name.localeCompare(b.name));
        concepts.forEach(concept => {
          if (concept.children && concept.children.length > 0) {
            sortConcepts(concept.children);
          }
        });
      };

      sortConcepts(rootConcepts);
      return rootConcepts;
    },
  });
}

export function useCreateMovementConcept() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conceptData: CreateMovementConceptData) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      
      const { data, error } = await supabase
        .from('movement_concepts')
        .insert([conceptData])
        .select()
        .single();

      if (error) {
        console.error('Error creating movement concept:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movement-concepts-admin'] });
      toast({
        title: "Concepto creado",
        description: "El concepto de movimiento se ha creado exitosamente.",
      });
    },
    onError: (error: any) => {
      console.error('Create movement concept error:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el concepto. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateMovementConcept() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conceptData: UpdateMovementConceptData) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      
      const { id, ...updateData } = conceptData;
      const { data, error } = await supabase
        .from('movement_concepts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating movement concept:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movement-concepts-admin'] });
      toast({
        title: "Concepto actualizado",
        description: "El concepto de movimiento se ha actualizado exitosamente.",
      });
    },
    onError: (error: any) => {
      console.error('Update movement concept error:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el concepto. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteMovementConcept() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conceptId: string) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      
      const { error } = await supabase
        .from('movement_concepts')
        .delete()
        .eq('id', conceptId);

      if (error) {
        console.error('Error deleting movement concept:', error);
        throw error;
      }

      return conceptId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movement-concepts-admin'] });
      queryClient.invalidateQueries({ queryKey: ['organization-movement-concepts'] });
      queryClient.invalidateQueries({ queryKey: ['system-movement-concepts'] });
      toast({
        title: "Concepto eliminado",
        description: "El concepto de movimiento se ha eliminado exitosamente.",
      });
    },
    onError: (error: any) => {
      console.error('Delete movement concept error:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el concepto. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });
}

export function useMoveConceptToParent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ conceptId, newParentId }: { conceptId: string; newParentId: string | null }) => {
      const { error } = await supabase
        .from('movement_concepts')
        .update({ parent_id: newParentId })
        .eq('id', conceptId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movement-concepts-admin'] });
      queryClient.invalidateQueries({ queryKey: ['organization-movement-concepts'] });
      queryClient.invalidateQueries({ queryKey: ['system-movement-concepts'] });
    },
  });
}