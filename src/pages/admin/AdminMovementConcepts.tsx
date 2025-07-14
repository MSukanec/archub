import React, { useState } from 'react';
import { Plus, Package2, Settings, CheckCircle, XCircle, Filter, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

import { Layout } from '@/components/layout/desktop/Layout';
import { MovementConceptTree } from '@/components/ui-custom/MovementConceptTree';

import { 
  useMovementConceptsAdmin, 
  useDeleteMovementConcept, 
  MovementConceptAdmin 
} from '@/hooks/use-movement-concepts-admin';
import { useCurrentUser } from '@/hooks/use-current-user';
import { NewAdminMovementConceptModal } from '@/modals/admin/NewAdminMovementConceptModal';

export default function AdminMovementConcepts() {
  const { data: userData } = useCurrentUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedConcepts, setExpandedConcepts] = useState<Set<string>>(new Set());
  const [systemFilter, setSystemFilter] = useState<'all' | 'system' | 'user'>('all');
  
  // Modal states
  const [isConceptModalOpen, setIsConceptModalOpen] = useState(false);
  const [editingConcept, setEditingConcept] = useState<MovementConceptAdmin | null>(null);
  
  // Delete confirmation states
  const [deleteConceptId, setDeleteConceptId] = useState<string | null>(null);

  const { data: concepts = [], isLoading, error, isError, refetch } = useMovementConceptsAdmin(userData?.organization?.id);
  const deleteConceptMutation = useDeleteMovementConcept();

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

  // Auto-expand concepts that have children (only on initial load)
  React.useEffect(() => {
    if (concepts.length > 0 && expandedConcepts.size === 0) {
      const conceptsToExpand = new Set<string>();
      
      const checkForChildren = (concepts: MovementConceptAdmin[]) => {
        concepts.forEach(concept => {
          // If concept has children, expand it
          if (concept.children && concept.children.length > 0) {
            conceptsToExpand.add(concept.id);
            checkForChildren(concept.children);
          }
        });
      };
      
      checkForChildren(concepts);
      
      if (conceptsToExpand.size > 0) {
        setExpandedConcepts(conceptsToExpand);
      }
    }
  }, [concepts.length]);

  // Filter concepts based on search and filters
  const filterConcepts = (concepts: MovementConceptAdmin[]): MovementConceptAdmin[] => {
    return concepts.filter(concept => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        concept.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      // System filter
      const matchesSystemFilter = systemFilter === 'all' || 
        (systemFilter === 'system' && concept.is_system) ||
        (systemFilter === 'user' && !concept.is_system);
      
      return matchesSearch && matchesSystemFilter;
    }).map(concept => ({
      ...concept,
      children: concept.children ? filterConcepts(concept.children) : []
    }));
  };

  const filteredConcepts = filterConcepts(concepts);

  const handleOpenCreateModal = () => {
    setEditingConcept(null);
    setIsConceptModalOpen(true);
  };

  const handleOpenEditModal = (concept: MovementConceptAdmin) => {
    setEditingConcept(concept);
    setIsConceptModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsConceptModalOpen(false);
    setEditingConcept(null);
  };

  const handleDeleteConcept = async (conceptId: string) => {
    try {
      await deleteConceptMutation.mutateAsync(conceptId);
      setDeleteConceptId(null);
    } catch (error) {
      console.error('Error deleting concept:', error);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSystemFilter('all');
  };

  const hasActiveFilters = searchTerm !== '' || systemFilter !== 'all';

  const headerProps = {
    title: "Conceptos de Movimientos",
    showSearch: true,
    searchValue: searchTerm,
    onSearchChange: setSearchTerm,
    showFilters: true,
    filters: [
      { 
        label: "Todos", 
        isActive: systemFilter === 'all',
        onClick: () => setSystemFilter('all') 
      },
      { 
        label: "Sistema", 
        isActive: systemFilter === 'system',
        onClick: () => setSystemFilter('system') 
      },
      { 
        label: "Usuario", 
        isActive: systemFilter === 'user',
        onClick: () => setSystemFilter('user') 
      }
    ],
    onClearFilters: clearFilters,
    hasActiveFilters,
    actions: (
      <Button onClick={handleOpenCreateModal} className="h-8 px-3 text-sm">
        <Plus className="h-4 w-4 mr-1" />
        CREAR CONCEPTO
      </Button>
    )
  };

  if (isError) {
    console.error('❌ AdminMovementConcepts error:', error);
  }

  return (
    <Layout headerProps={headerProps}>
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

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>Estructura de Conceptos</CardTitle>
            <CardDescription>
              Gestiona la jerarquía de conceptos de movimientos financieros. 
              Los conceptos pueden organizarse de forma jerárquica para facilitar la categorización.
            </CardDescription>
          </CardHeader>
          <CardContent>
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
              <MovementConceptTree
                concepts={filteredConcepts}
                expandedConcepts={expandedConcepts}
                onToggleExpand={(conceptId) => {
                  const newExpanded = new Set(expandedConcepts);
                  if (newExpanded.has(conceptId)) {
                    newExpanded.delete(conceptId);
                  } else {
                    newExpanded.add(conceptId);
                  }
                  setExpandedConcepts(newExpanded);
                }}
                onEdit={handleOpenEditModal}
                onDelete={(conceptId) => setDeleteConceptId(conceptId)}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Modal */}
      <NewAdminMovementConceptModal
        isOpen={isConceptModalOpen}
        onClose={handleCloseModal}
        editingConcept={editingConcept}
        parentConcepts={concepts}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConceptId} onOpenChange={() => setDeleteConceptId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el concepto
              y todos sus subconceptos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConceptId && handleDeleteConcept(deleteConceptId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}