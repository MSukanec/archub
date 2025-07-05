import React, { useState, useMemo } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, CheckCircle, FolderTree, Edit, Trash2, ChevronDown, ChevronRight, MoreVertical } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { NewAdminMovementConceptModal } from '@/modals/admin/NewAdminMovementConceptModal'
import { useMovementConceptsAdmin, type MovementConceptAdmin } from '@/hooks/use-movement-concepts-admin'

export default function AdminMovementConcepts() {
  const [searchValue, setSearchValue] = useState('')
  const [systemFilter, setSystemFilter] = useState('all')
  const [newConceptModalOpen, setNewConceptModalOpen] = useState(false)
  const [editingConcept, setEditingConcept] = useState<MovementConceptAdmin | null>(null)
  const [deletingConcept, setDeletingConcept] = useState<MovementConceptAdmin | null>(null)
  const [expandedConcepts, setExpandedConcepts] = useState<Set<string>>(new Set())

  const { 
    concepts, 
    isLoading, 
    deleteConceptMutation 
  } = useMovementConceptsAdmin()

  // Clear filters function
  const clearFilters = () => {
    setSearchValue('')
    setSystemFilter('all')
  }

  // Filter concepts
  const filteredConcepts = useMemo(() => {
    if (!concepts) return []
    
    return concepts.filter(concept => {
      const matchesSearch = !searchValue || 
        concept.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        (concept.description && concept.description.toLowerCase().includes(searchValue.toLowerCase()))
      
      const matchesSystem = systemFilter === 'all' || 
        (systemFilter === 'system' && concept.is_system) ||
        (systemFilter === 'custom' && !concept.is_system)
      
      return matchesSearch && matchesSystem
    })
  }, [concepts, searchValue, systemFilter])

  // Event handlers
  const handleEditConcept = (concept: MovementConceptAdmin) => {
    setEditingConcept(concept)
    setNewConceptModalOpen(true)
  }

  const handleDeleteConcept = async () => {
    if (!deletingConcept) return
    try {
      await deleteConceptMutation.mutateAsync(deletingConcept.id)
      setDeletingConcept(null)
    } catch (error) {
      console.error('Error deleting concept:', error)
    }
  }

  const toggleExpanded = (conceptId: string) => {
    const newExpanded = new Set(expandedConcepts)
    if (newExpanded.has(conceptId)) {
      newExpanded.delete(conceptId)
    } else {
      newExpanded.add(conceptId)
    }
    setExpandedConcepts(newExpanded)
  }

  // Render concept tree structure
  const renderConcept = (concept: MovementConceptAdmin, level = 0) => {
    const hasChildren = concept.children && concept.children.length > 0
    const isExpanded = expandedConcepts.has(concept.id)

    return (
      <div key={concept.id} className={`${level > 0 ? 'ml-6' : ''}`}>
        <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(concept.id)}>
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                {hasChildren && (
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-auto p-0 w-4">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                )}
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{concept.name}</span>
                    <Badge variant={concept.is_system ? "default" : "secondary"} className="text-xs">
                      {concept.is_system ? "Sistema" : "Personalizado"}
                    </Badge>
                    {concept.parent_id && (
                      <Badge variant="outline" className="text-xs">
                        Subcategoría
                      </Badge>
                    )}
                    {hasChildren && (
                      <Badge variant="outline" className="text-xs">
                        {concept.children!.length} {concept.children!.length === 1 ? 'hijo' : 'hijos'}
                      </Badge>
                    )}
                  </div>
                  {concept.description && (
                    <p className="text-sm text-muted-foreground">{concept.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Creado: {new Date(concept.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEditConcept(concept)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  {!concept.is_system && (
                    <DropdownMenuItem 
                      onClick={() => setDeletingConcept(concept)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </Card>

          {hasChildren && (
            <CollapsibleContent className="mt-2">
              <div className="space-y-2">
                {concept.children?.map((child: any) => renderConcept(child, level + 1))}
              </div>
            </CollapsibleContent>
          )}
        </Collapsible>
      </div>
    )
  }

  // Statistics calculations with recursive count
  const countConcepts = (concepts: MovementConceptAdmin[]): { total: number; system: number; custom: number; parents: number } => {
    let total = 0
    let system = 0
    let custom = 0
    let parents = 0

    const count = (items: MovementConceptAdmin[], isParent = true) => {
      items.forEach(item => {
        total++
        if (item.is_system) system++
        else custom++
        if (isParent) parents++
        
        if (item.children && item.children.length > 0) {
          count(item.children, false)
        }
      })
    }

    count(concepts)
    return { total, system, custom, parents }
  }

  const stats = countConcepts(concepts || [])

  const customFilters = (
    <div className="w-[288px] space-y-4">
      <div className="space-y-2">
        <Label className="text-xs font-medium">Filtrar por tipo</Label>
        <Select value={systemFilter} onValueChange={setSystemFilter}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los conceptos</SelectItem>
            <SelectItem value="system">Solo sistema</SelectItem>
            <SelectItem value="custom">Solo personalizados</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  const headerProps = {
    title: 'Conceptos de Movimientos',
    showSearch: true,
    searchValue,
    onSearchChange: setSearchValue,
    customFilters,
    onClearFilters: clearFilters,
    actions: [
      <Button
        key="new-concept"
        onClick={() => {
          setEditingConcept(null)
          setNewConceptModalOpen(true)
        }}
        className="gap-2"
      >
        <Plus className="w-4 h-4" />
        Nuevo Concepto
      </Button>
    ]
  }

  return (
    <Layout headerProps={headerProps}>
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Conceptos</p>
                <p className="text-lg font-semibold">{stats.total}</p>
              </div>
              <FolderTree className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Conceptos del Sistema</p>
                <p className="text-lg font-semibold">{stats.system}</p>
              </div>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Conceptos Personalizados</p>
                <p className="text-lg font-semibold">{stats.custom}</p>
              </div>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Conceptos Principales</p>
                <p className="text-lg font-semibold">{stats.parents}</p>
              </div>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>
        </div>

        {/* Concepts Tree */}
        <div className="space-y-2">
          {filteredConcepts.length === 0 ? (
            <Card className="p-8">
              <div className="text-center text-muted-foreground">
                {searchValue ? 'No se encontraron conceptos que coincidan con la búsqueda' : 'No hay conceptos creados'}
              </div>
            </Card>
          ) : (
            filteredConcepts.map(concept => renderConcept(concept))
          )}
        </div>
      </div>

      {/* Modals */}
      <NewAdminMovementConceptModal
        open={newConceptModalOpen}
        onClose={() => {
          setNewConceptModalOpen(false)
          setEditingConcept(null)
        }}
        editingConcept={editingConcept}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingConcept} onOpenChange={() => setDeletingConcept(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar concepto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El concepto "{deletingConcept?.name}" será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConcept}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  )
}