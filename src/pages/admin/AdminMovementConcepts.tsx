import React, { useState, useMemo } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Users, CheckCircle, FolderTree } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { HierarchicalTree, type HierarchicalItem } from '@/components/ui-custom/HierarchicalTree'
import { NewAdminMovementConceptModal } from '@/modals/admin/NewAdminMovementConceptModal'
import { useMovementConceptsAdmin, useDeleteMovementConcept, type MovementConceptAdmin } from '@/hooks/use-movement-concepts-admin'

export default function AdminMovementConcepts() {
  const [searchValue, setSearchValue] = useState('')
  const [systemFilter, setSystemFilter] = useState('all')
  const [newConceptModalOpen, setNewConceptModalOpen] = useState(false)
  const [editingConcept, setEditingConcept] = useState<MovementConceptAdmin | null>(null)
  const [deletingConcept, setDeletingConcept] = useState<MovementConceptAdmin | null>(null)

  const { data: concepts, isLoading } = useMovementConceptsAdmin()
  const deleteConceptMutation = useDeleteMovementConcept()

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



  const handleDeleteConcept = async () => {
    if (!deletingConcept) return
    try {
      await deleteConceptMutation.mutateAsync(deletingConcept.id)
      setDeletingConcept(null)
    } catch (error) {
      console.error('Error deleting concept:', error)
    }
  }

  // Event handlers for the hierarchical tree
  const handleEdit = (item: HierarchicalItem) => {
    setEditingConcept(item as MovementConceptAdmin)
    setNewConceptModalOpen(true)
  }

  const handleDelete = (item: HierarchicalItem) => {
    setDeletingConcept(item as MovementConceptAdmin)
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
        <HierarchicalTree
          items={filteredConcepts}
          isLoading={isLoading}
          emptyMessage="No hay conceptos creados"
          searchValue={searchValue}
          onEdit={handleEdit}
          onDelete={handleDelete}
          showSystemBadge={true}
          allowDelete={(item) => !item.is_system}
        />
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