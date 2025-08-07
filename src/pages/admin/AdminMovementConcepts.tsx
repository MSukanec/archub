import React, { useState } from 'react';
import { Plus, Package2, Settings, CheckCircle, XCircle, Filter, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { Layout } from '@/components/layout/desktop/Layout';
import { DraggableConceptTree, MovementConceptNode } from '@/components/ui-custom/DraggableConceptTree';

import { 
  useMovementConceptsAdmin, 
  useDeleteMovementConcept, 
  useMoveConceptToParent,
  MovementConceptAdmin 
} from '@/hooks/use-movement-concepts-admin';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';

export default function AdminMovementConcepts() {
  const { data: userData } = useCurrentUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedConcepts, setExpandedConcepts] = useState<Set<string>>(new Set());
  const [systemFilter, setSystemFilter] = useState<'all' | 'system' | 'user'>('all');
  
  // Global modal store
  const { openModal } = useGlobalModalStore();

  const { data: concepts = [], isLoading, error, isError, refetch } = useMovementConceptsAdmin();
  
  // Debug logging
  React.useEffect(() => {
    console.log('📋 System movement concepts data:', concepts);
    console.log('⚠️ Movement concepts error:', error);
    console.log('🔄 Is loading:', isLoading);
  }, [concepts, error, isLoading]);
  
  const deleteConceptMutation = useDeleteMovementConcept();
  const moveConceptMutation = useMoveConceptToParent();

  // Calculate statistics
  const calculateStats = (concepts: MovementConceptAdmin[]) => {
    let totalConcepts = 0;
    let systemConcepts = 0;
    let userConcepts = 0;

    const countRecursive = (concepts: MovementConceptAdmin[]) => {
      concepts.forEach(concept => {
        totalConcepts++;
        
        if (concept.is_system) {
          systemConcepts++;
        } else {
          userConcepts++;
        }
        
        if (concept.children && concept.children.length > 0) {
          countRecursive(concept.children);
        }
      });
    };

    countRecursive(concepts);
    return { 
      totalConcepts, 
      systemConcepts, 
      userConcepts 
    };
  };

  const stats = calculateStats(concepts);

  // Filter concepts based on search term and system filter
  const filterConcepts = (concepts: MovementConceptAdmin[]): MovementConceptAdmin[] => {
    return concepts
      .map(concept => {
        // First filter children recursively
        const filteredChildren = concept.children ? filterConcepts(concept.children) : [];
        
        // Check if current concept matches filters
        const matchesSearch = searchTerm === '' || 
          concept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (concept.description && concept.description.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesSystemFilter = systemFilter === 'all' ||
          (systemFilter === 'system' && concept.is_system) ||
          (systemFilter === 'user' && !concept.is_system);
        
        // Include concept if it matches filters OR has matching children
        if ((matchesSearch && matchesSystemFilter) || filteredChildren.length > 0) {
          return {
            ...concept,
            children: filteredChildren
          };
        }
        
        return null;
      })
      .filter((concept): concept is MovementConceptAdmin => concept !== null);
  };

  const filteredConcepts = filterConcepts(concepts);

  const handleOpenCreateModal = () => {
    openModal('movement-concept');
  };

  const handleOpenEditModal = (concept: MovementConceptAdmin) => {
    openModal('movement-concept', { editingConcept: concept });
  };

  const handleCreateChildConcept = (parentConcept: MovementConceptNode) => {
    openModal('movement-concept', { 
      parentConcept: {
        id: parentConcept.id,
        name: parentConcept.name,
        parent_id: parentConcept.parent_id,
        is_system: parentConcept.is_system
      }
    });
  };

  const handleDeleteConcept = (conceptId: string) => {
    // Find the concept to get its name for the modal
    const findConceptInTree = (concepts: MovementConceptAdmin[], id: string): MovementConceptAdmin | null => {
      for (const concept of concepts) {
        if (concept.id === id) return concept;
        if (concept.children) {
          const found = findConceptInTree(concept.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    const concept = findConceptInTree(concepts, conceptId);
    if (!concept) return;

    // Get all other concepts as replacement options (excluding the current one and its children)
    const getAllConcepts = (concepts: MovementConceptAdmin[]): MovementConceptAdmin[] => {
      let allConcepts: MovementConceptAdmin[] = [];
      concepts.forEach(concept => {
        allConcepts.push(concept);
        if (concept.children) {
          allConcepts = allConcepts.concat(getAllConcepts(concept.children));
        }
      });
      return allConcepts;
    };

    const allConcepts = getAllConcepts(concepts);
    const replacementOptions = allConcepts
      .filter(c => c.id !== conceptId) // Exclude only the current concept being deleted
      .map(c => ({
        label: c.name,
        value: c.id
      }));

    openModal('delete-confirmation', {
      mode: 'replace',
      title: 'Eliminar Concepto de Movimiento',
      description: `¿Qué querés hacer con el concepto "${concept.name}"? Podés eliminarlo completamente o reemplazarlo por otro concepto existente.`,
      itemName: concept.name,
      itemType: "concepto",
      destructiveActionText: "Eliminar concepto",
      onDelete: async () => {
        try {
          await deleteConceptMutation.mutateAsync(conceptId);
        } catch (error) {
          console.error('Error deleting concept:', error);
        }
      },
      onReplace: async (newConceptId: string) => {
        // Implementation for replacement would go here
        // For now, just delete since replacement logic needs to be implemented
        try {
          await deleteConceptMutation.mutateAsync(conceptId);
        } catch (error) {
          console.error('Error replacing concept:', error);
        }
      },
      replacementOptions,
      currentCategoryId: conceptId,
      isLoading: deleteConceptMutation.isPending
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSystemFilter('all');
  };

  const hasActiveFilters = searchTerm !== '' || systemFilter !== 'all';

  const handleMoveToParent = async (conceptId: string, newParentId: string | null) => {
    try {
      await moveConceptMutation.mutateAsync({ conceptId, newParentId });
    } catch (error) {
      console.error('Error moving concept:', error);
    }
  };

  const headerProps = {
    title: "Conceptos de Movimientos",
    showSearch: true,
    searchValue: searchTerm,
    onSearchChange: setSearchTerm,
    showFilters: true,
    filters: [
      { 
        label: "Todos", 
        onClick: () => setSystemFilter('all') 
      },
      { 
        label: "Sistema", 
        onClick: () => setSystemFilter('system') 
      },
      { 
        label: "Usuario", 
        onClick: () => setSystemFilter('user') 
      }
    ],
    onClearFilters: clearFilters,
    actionButton: {
      label: "Nuevo Concepto",
      icon: Plus,
      onClick: handleOpenCreateModal
    }
  };

  if (isError) {
    console.error('❌ AdminMovementConcepts error:', error);
  }

  return (
    <Layout headerProps={headerProps}>
        {/* Statistics Cards */}
          <Card>
            </CardHeader>
            <CardContent>
                Conceptos de movimientos registrados
              </p>
            </CardContent>
          </Card>

          <Card>
            </CardHeader>
            <CardContent>
                Conceptos predefinidos del sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            </CardHeader>
            <CardContent>
                Conceptos creados por usuarios
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Direct Tree without Card */}
        {isLoading ? (
          </div>
        ) : filteredConcepts.length === 0 ? (
              {hasActiveFilters 
                ? 'No se encontraron conceptos con los filtros aplicados.'
                : 'Comienza creando tu primer concepto de movimiento.'
              }
            </p>
            {!hasActiveFilters && (
                <Button onClick={handleOpenCreateModal}>
                  Crear primer concepto
                </Button>
              </div>
            )}
          </div>
        ) : (
          <DraggableConceptTree
            concepts={filteredConcepts.map(concept => ({
              id: concept.id,
              name: concept.name,
              description: concept.description,
              parent_id: concept.parent_id,
              is_system: concept.is_system,
              view_mode: concept.view_mode || undefined,
              children: concept.children?.map(child => ({
                id: child.id,
                name: child.name,
                description: child.description,
                parent_id: child.parent_id,
                is_system: child.is_system,
                view_mode: child.view_mode || undefined,
                children: child.children?.map(grandchild => ({
                  id: grandchild.id,
                  name: grandchild.name,
                  description: grandchild.description,
                  parent_id: grandchild.parent_id,
                  is_system: grandchild.is_system,
                  view_mode: grandchild.view_mode || undefined,
                  children: []
                })) || []
              })) || []
            }))}
            expandedConcepts={expandedConcepts}
            onToggleExpanded={(conceptId) => {
              const newExpanded = new Set(expandedConcepts);
              if (newExpanded.has(conceptId)) {
                newExpanded.delete(conceptId);
              } else {
                newExpanded.add(conceptId);
              }
              setExpandedConcepts(newExpanded);
            }}
            onEdit={(concept) => {
              handleOpenEditModal(concept);
            }}
            onDelete={handleDeleteConcept}
            onCreateChild={handleCreateChildConcept}
            onMoveToParent={handleMoveToParent}
          />
        )}
      </div>
    </Layout>
  );
}