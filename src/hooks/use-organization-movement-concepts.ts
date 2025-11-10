import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface MovementConceptOrganization {
  id: string;
  name: string;
  description?: string;
  parent_id: string | null;
  organization_id: string | null;
  is_system: boolean;
  view_mode: string;

  created_at: string;
  updated_at: string;
  children?: MovementConceptOrganization[];
}

export function useOrganizationMovementConcepts(organizationId: string | undefined) {
  return useQuery({
    queryKey: ['organization-movement-concepts', organizationId],
    enabled: !!organizationId,
    retry: false,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      if (!supabase || !organizationId) {
        throw new Error('Supabase client not initialized or organization ID missing');
      }

      console.log('🔍 Fetching organization movement concepts for:', organizationId);

      // Get both system concepts (is_system = true) AND organization's own concepts
      const { data: concepts, error } = await supabase
        .from('movement_concepts')
        .select('id, name, description, parent_id, organization_id, is_system, view_mode, created_at, updated_at')
        .or(`and(is_system.eq.true,organization_id.is.null),organization_id.eq.${organizationId}`)
        .order('name');

      console.log('📊 Organization movement concepts query result:', { 
        concepts, 
        error, 
        count: concepts?.length,
        organizationId 
      });

      if (error) {
        throw error;
      }

      if (!concepts) {
        return [];
      }

      // Build hierarchical structure
      const conceptMap = new Map();
      const rootConcepts: MovementConceptOrganization[] = [];

      // First pass: create map and identify roots
      concepts.forEach((concept: MovementConceptOrganization) => {
        conceptMap.set(concept.id, { ...concept, children: [] });
        if (!concept.parent_id) {
          rootConcepts.push(conceptMap.get(concept.id));
        }
      });

      // Second pass: build hierarchy
      concepts.forEach((concept: MovementConceptOrganization) => {
        if (concept.parent_id) {
          const parent = conceptMap.get(concept.parent_id);
          if (parent) {
            parent.children.push(conceptMap.get(concept.id));
          }
        }
      });

      // Sort children recursively
      const sortConcepts = (concepts: MovementConceptOrganization[]) => {
        concepts.sort((a, b) => a.name.localeCompare(b.name));
        concepts.forEach(concept => {
          if (concept.children && concept.children.length > 0) {
            sortConcepts(concept.children);
          }
        });
      };

      sortConcepts(rootConcepts);

      console.log('🌳 Organization movement concepts tree built:', rootConcepts);

      return rootConcepts;
    },
  });
}