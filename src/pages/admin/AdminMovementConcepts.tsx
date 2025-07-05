import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

import { Layout } from '@/components/layout/desktop/Layout'
import { CustomTable } from '@/components/ui-custom/misc/CustomTable'
import { NewAdminMovementConceptModal } from '@/modals/admin/NewAdminMovementConceptModal'
import { useMovementConceptsAdmin, useDeleteMovementConcept, type MovementConceptAdmin } from '@/hooks/use-movement-concepts-admin'

import { Plus, Edit, Trash2, Package2, Settings, CheckCircle, Users } from 'lucide-react'

export default function AdminMovementConcepts() {
  const [searchValue, setSearchValue] = useState('')
  const [systemFilter, setSystemFilter] = useState('all')
  const [newConceptModalOpen, setNewConceptModalOpen] = useState(false)
  const [editingConcept, setEditingConcept] = useState<MovementConceptAdmin | null>(null)
  const [deletingConcept, setDeletingConcept] = useState<MovementConceptAdmin | null>(null)

  const { data: concepts = [], isLoading } = useMovementConceptsAdmin()
  const deleteConceptMutation = useDeleteMovementConcept()

  // Flatten concepts for table display
  const flattenConcepts = (concepts: MovementConceptAdmin[]): MovementConceptAdmin[] => {
    const flattened: MovementConceptAdmin[] = []
    
    const flatten = (items: MovementConceptAdmin[], level = 0) => {
      items.forEach(item => {
        flattened.push({ ...item, level })
        if (item.children && item.children.length > 0) {
          flatten(item.children, level + 1)
        }
      })
    }
    
    flatten(concepts)
    return flattened
  }

  const flatConcepts = flattenConcepts(concepts)

  // Statistics calculations
  const totalConcepts = flatConcepts.length
  const systemConcepts = flatConcepts.filter(c => c.is_system).length
  const customConcepts = flatConcepts.filter(c => !c.is_system).length
  const parentConcepts = flatConcepts.filter(c => !c.parent_id).length

  // Filter concepts
  const filteredConcepts = flatConcepts.filter(concept => {
    const matchesSearch = concept.name.toLowerCase().includes(searchValue.toLowerCase()) ||
                         (concept.description && concept.description.toLowerCase().includes(searchValue.toLowerCase()))
    
    const matchesSystemFilter = systemFilter === 'all' || 
                               (systemFilter === 'system' && concept.is_system) ||
                               (systemFilter === 'custom' && !concept.is_system)
    
    return matchesSearch && matchesSystemFilter
  })

  const clearFilters = () => {
    setSearchValue('')
    setSystemFilter('all')
  }

  const handleEdit = (concept: MovementConceptAdmin) => {
    setEditingConcept(concept)
    setNewConceptModalOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingConcept) return
    
    try {
      await deleteConceptMutation.mutateAsync(deletingConcept.id)
      setDeletingConcept(null)
    } catch (error) {
      console.error('Error deleting concept:', error)
    }
  }

  const columns = [
    {
      key: 'name',
      label: 'Nombre',
      width: '25%',
      render: (concept: MovementConceptAdmin & { level?: number }) => (
        <div className={`flex items-center gap-2 ${concept.level ? `ml-${concept.level * 4}` : ''}`}>
          <span className="font-medium">{concept.name}</span>
          <Badge variant={concept.is_system ? "default" : "secondary"} className="text-xs">
            {concept.is_system ? "Sistema" : "Personalizado"}
          </Badge>
          {concept.parent_id && (
            <Badge variant="outline" className="text-xs">
              Subcategoría
            </Badge>
          )}
        </div>
      )
    },
    {
      key: 'description',
      label: 'Descripción',
      width: '35%',
      render: (concept: MovementConceptAdmin) => (
        <span className="text-sm text-muted-foreground">
          {concept.description || 'Sin descripción'}
        </span>
      )
    },
    {
      key: 'type',
      label: 'Tipo',
      width: '15%',
      render: (concept: MovementConceptAdmin) => (
        <Badge variant={concept.is_system ? "default" : "secondary"}>
          {concept.is_system ? "Sistema" : "Personalizado"}
        </Badge>
      )
    },
    {
      key: 'created_at',
      label: 'Fecha de Creación',
      width: '15%',
      render: (concept: MovementConceptAdmin) => (
        <span className="text-xs text-muted-foreground">
          {new Date(concept.created_at).toLocaleDateString()}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      width: '10%',
      render: (concept: MovementConceptAdmin) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(concept)}
            className="h-8 w-8 p-0 hover:bg-[var(--button-ghost-hover-bg)]"
          >
            <Edit className="w-4 h-4" />
          </Button>
          {!concept.is_system && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeletingConcept(concept)}
              className="h-8 w-8 p-0 hover:bg-[var(--button-ghost-hover-bg)]"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          )}
        </div>
      )
    }
  ]

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
        size="sm"
        className="gap-2"
      >
        <Plus className="h-4 w-4" />
        Nuevo Concepto
      </Button>
    ]
  }

  return (
    <Layout wide headerProps={headerProps}>
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Conceptos</p>
                <p className="text-lg font-semibold">{totalConcepts}</p>
              </div>
              <Package2 className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Conceptos Sistema</p>
                <p className="text-lg font-semibold">{systemConcepts}</p>
              </div>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Conceptos Personalizados</p>
                <p className="text-lg font-semibold">{customConcepts}</p>
              </div>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Conceptos Principales</p>
                <p className="text-lg font-semibold">{parentConcepts}</p>
              </div>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>
        </div>

        {/* Table */}
        <CustomTable
          columns={columns}
          data={filteredConcepts}
          isLoading={isLoading}
          emptyState={{
            title: "No hay conceptos",
            description: "No se encontraron conceptos de movimientos que coincidan con los filtros aplicados.",
            action: {
              label: "Nuevo Concepto",
              onClick: () => {
                setEditingConcept(null)
                setNewConceptModalOpen(true)
              }
            }
          }}
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
              onClick={handleDelete}
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