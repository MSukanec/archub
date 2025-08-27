import React, { useState } from 'react';
import { Plus, Package2, Settings, CheckCircle, XCircle, Filter, Search, ArrowUpDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { HierarchicalTree } from '@/components/ui-custom/tables-and-trees/HierarchicalTree';

import { 
  useMovementConceptsAdmin, 
  useDeleteMovementConcept, 
  useMoveConceptToParent,
  MovementConceptAdmin 
} from '@/hooks/use-movement-concepts-admin';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';

const AdminGeneralMovementConcepts = () => {
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
          } as MovementConceptAdmin;
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

  const handleCreateChildConcept = (parentConcept: any) => {
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

  if (isError) {
    console.error('❌ AdminMovementConcepts error:', error);
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conceptos</CardTitle>
            <Package2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalConcepts}</div>
            <p className="text-xs text-muted-foreground">
              Conceptos de movimientos registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conceptos Sistema</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.systemConcepts}</div>
            <p className="text-xs text-muted-foreground">
              Conceptos predefinidos del sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conceptos Usuario</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.userConcepts}</div>
            <p className="text-xs text-muted-foreground">
              Conceptos creados por usuarios
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Direct Tree without Card */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Cargando conceptos...</div>
        </div>
      ) : filteredConcepts.length === 0 ? (
        <div className="text-center py-8">
          <Package2 className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No hay conceptos</h3>
          <p className="mt-1 text-sm text-gray-500">
            {hasActiveFilters 
              ? 'No se encontraron conceptos con los filtros aplicados.'
              : 'Comienza creando tu primer concepto de movimiento.'
            }
          </p>
          {!hasActiveFilters && (
            <div className="mt-6">
              <Button onClick={handleOpenCreateModal}>
                <Plus className="h-4 w-4 mr-1" />
                Crear primer concepto
              </Button>
            </div>
          )}
        </div>
      ) : (
        <HierarchicalTree
          categories={filteredConcepts.map(concept => ({
            id: concept.id,
            name: concept.name,
            description: concept.description,
            parent_id: concept.parent_id,
            is_system: concept.is_system,
            children: concept.children?.map(child => ({
              id: child.id,
              name: child.name,
              description: child.description,
              parent_id: child.parent_id,
              is_system: child.is_system,
              children: child.children?.map(grandchild => ({
                id: grandchild.id,
                name: grandchild.name,
                description: grandchild.description,
                parent_id: grandchild.parent_id,
                is_system: grandchild.is_system,
                children: []
              })) || []
            })) || []
          }))}
          expandedCategories={expandedConcepts}
          onToggleExpanded={(conceptId) => {
            const newExpanded = new Set(expandedConcepts);
            if (newExpanded.has(conceptId)) {
              newExpanded.delete(conceptId);
            } else {
              newExpanded.add(conceptId);
            }
            setExpandedConcepts(newExpanded);
          }}
          onEdit={(concept: any) => {
            handleOpenEditModal(concept as MovementConceptAdmin);
          }}
          onDelete={handleDeleteConcept}
          onTemplate={() => {}}
          onCreateChild={handleCreateChildConcept}
          enableDragAndDrop={false}
        />
      )}
    </div>
  );
}

export default AdminGeneralMovementConcepts;