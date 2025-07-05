import { useState } from 'react';
import { Search, Plus, ChevronRight, ChevronDown, Edit, Trash2, DollarSign, TrendingUp, TrendingDown, MoreHorizontal, Filter, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

import { Layout } from '@/components/layout/desktop/Layout';
import { useToast } from '@/hooks/use-toast';

import { useMovementConceptsAdmin, useDeleteMovementConcept, MovementConceptAdmin } from '@/hooks/use-movement-concepts-admin';
import { NewAdminMovementConceptModal } from '@/modals/admin/NewAdminMovementConceptModal';

export default function AdminMovementConcepts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedConcepts, setExpandedConcepts] = useState<Set<string>>(new Set());
  const [conceptFilter, setConceptFilter] = useState<'all' | 'system' | 'organization'>('all');
  
  // Modal states
  const [isConceptModalOpen, setIsConceptModalOpen] = useState(false);
  const [editingConcept, setEditingConcept] = useState<MovementConceptAdmin | null>(null);
  
  // Delete confirmation states
  const [deleteConceptId, setDeleteConceptId] = useState<string | null>(null);

  const { data: concepts = [], isLoading } = useMovementConceptsAdmin();
  const deleteConceptMutation = useDeleteMovementConcept();
  const { toast } = useToast();

  // Calculate statistics
  const calculateStats = (concepts: MovementConceptAdmin[]) => {
    let totalConcepts = 0;
    let systemConcepts = 0;
    let organizationConcepts = 0;
    let parentConcepts = 0;

    const countRecursive = (cons: MovementConceptAdmin[]) => {
      cons.forEach(con => {
        totalConcepts++;
        if (con.organization_id === null) {
          systemConcepts++;
        } else {
          organizationConcepts++;
        }
        if (!con.parent_id) {
          parentConcepts++;
        }
        if (con.children && con.children.length > 0) {
          countRecursive(con.children);
        }
      });
    };

    countRecursive(concepts);

    return {
      totalConcepts,
      systemConcepts,
      organizationConcepts,
      parentConcepts
    };
  };

  const stats = calculateStats(concepts);

  // Filter concepts based on search and type
  const filterConcepts = (concepts: MovementConceptAdmin[]): MovementConceptAdmin[] => {
    return concepts.filter(concept => {
      const matchesSearch = concept.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = conceptFilter === 'all' || 
        (conceptFilter === 'system' && concept.organization_id === null) ||
        (conceptFilter === 'organization' && concept.organization_id !== null);
      
      return matchesSearch && matchesFilter;
    }).map(concept => ({
      ...concept,
      children: concept.children ? filterConcepts(concept.children) : []
    }));
  };

  const filteredConcepts = filterConcepts(concepts);

  const toggleExpanded = (conceptId: string) => {
    const newExpanded = new Set(expandedConcepts);
    if (newExpanded.has(conceptId)) {
      newExpanded.delete(conceptId);
    } else {
      newExpanded.add(conceptId);
    }
    setExpandedConcepts(newExpanded);
  };

  const handleEdit = (concept: MovementConceptAdmin) => {
    setEditingConcept(concept);
    setIsConceptModalOpen(true);
  };

  const handleDelete = async (conceptId: string) => {
    try {
      await deleteConceptMutation.mutateAsync(conceptId);
      toast({
        title: "Concepto eliminado",
        description: "El concepto ha sido eliminado correctamente."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el concepto. Verifique que no tenga movimientos asociados.",
        variant: "destructive"
      });
    }
    setDeleteConceptId(null);
  };

  const getConceptIcon = (conceptName: string) => {
    if (conceptName.toLowerCase().includes('ingreso')) return TrendingUp;
    if (conceptName.toLowerCase().includes('egreso')) return TrendingDown;
    return DollarSign;
  };

  const renderConcept = (concept: MovementConceptAdmin, level = 0) => {
    const isExpanded = expandedConcepts.has(concept.id);
    const hasChildren = concept.children && concept.children.length > 0;
    const IconComponent = getConceptIcon(concept.name);

    return (
      <div key={concept.id} className="border border-border rounded-lg mb-2">
        <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(concept.id)}>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3 flex-1">
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0"
                  disabled={!hasChildren}
                >
                  {hasChildren ? (
                    isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                  ) : (
                    <div className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>

              <IconComponent className="h-4 w-4 text-muted-foreground" />
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{concept.name}</span>
                  {concept.organization_id === null ? (
                    <Badge variant="secondary" className="text-xs">Sistema</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">Organización</Badge>
                  )}
                </div>
                {concept.description && (
                  <p className="text-sm text-muted-foreground mt-1">{concept.description}</p>
                )}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleEdit(concept)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                {concept.organization_id !== null && (
                  <DropdownMenuItem 
                    onClick={() => setDeleteConceptId(concept.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {hasChildren && (
            <CollapsibleContent className="px-4 pb-4">
              <div className="pl-6 space-y-2">
                {concept.children!.map((child: any) => renderConcept(child, level + 1))}
              </div>
            </CollapsibleContent>
          )}
        </Collapsible>
      </div>
    );
  };

  return (
    <Layout>
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Conceptos de Movimientos</h2>
            <p className="text-muted-foreground">
              Gestiona los conceptos utilizados para categorizar movimientos financieros
            </p>
          </div>
          <Button onClick={() => {
            setEditingConcept(null);
            setIsConceptModalOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Concepto
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Conceptos</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalConcepts}</div>
              <p className="text-xs text-muted-foreground">
                Conceptos en el sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conceptos Sistema</CardTitle>
              <Badge variant="secondary" className="text-xs">Sistema</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.systemConcepts}</div>
              <p className="text-xs text-muted-foreground">
                Conceptos predefinidos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conceptos Organización</CardTitle>
              <Badge variant="outline" className="text-xs">Org</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.organizationConcepts}</div>
              <p className="text-xs text-muted-foreground">
                Conceptos personalizados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categorías Principales</CardTitle>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.parentConcepts}</div>
              <p className="text-xs text-muted-foreground">
                Conceptos padre
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar conceptos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
                onClick={() => setSearchTerm('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <Select value={conceptFilter} onValueChange={(value: any) => setConceptFilter(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los conceptos</SelectItem>
              <SelectItem value="system">Solo sistema</SelectItem>
              <SelectItem value="organization">Solo organización</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Concepts List */}
        <Card>
          <CardHeader>
            <CardTitle>Conceptos de Movimientos</CardTitle>
            <CardDescription>
              Vista jerárquica de todos los conceptos disponibles para categorizar movimientos financieros
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : filteredConcepts.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No se encontraron conceptos</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Comienza creando tu primer concepto'}
                </p>
                <Button onClick={() => {
                  setEditingConcept(null);
                  setIsConceptModalOpen(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Concepto
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredConcepts.map(concept => renderConcept(concept))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* New Concept Modal */}
        <NewAdminMovementConceptModal
          open={isConceptModalOpen}
          onClose={() => {
            setIsConceptModalOpen(false);
            setEditingConcept(null);
          }}
          editingConcept={editingConcept}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteConceptId} onOpenChange={() => setDeleteConceptId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar concepto?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. El concepto será eliminado permanentemente.
                Asegúrate de que no tenga movimientos asociados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deleteConceptId && handleDelete(deleteConceptId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}