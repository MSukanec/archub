import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

export interface MovementConceptAdmin {
  id: string;
  name: string;
  parent_id: string | null;
  organization_id: string;
  is_system: boolean;
  view_mode: string;
  extra_fields: any;
  created_at: string;
  updated_at: string;
  children?: MovementConceptAdmin[];
}

export interface CreateMovementConceptData {
  name: string;
  parent_id?: string | null;
  organization_id: string;
  is_system?: boolean;
  view_mode?: string;
  extra_fields?: any;
}

export interface UpdateMovementConceptData extends CreateMovementConceptData {
  id: string;
}

export function useMovementConceptsAdmin(organizationId: string | undefined) {
  return useQuery({
    queryKey: ['movement-concepts-admin', organizationId],
    enabled: !!organizationId,
    retry: false,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      if (!supabase || !organizationId) {
        throw new Error('Supabase client not initialized or organization ID missing');
      }

      const { data: concepts, error } = await supabase
        .from('movement_concepts')
        .select('*')
        .eq('organization_id', organizationId)
        .order('name');

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