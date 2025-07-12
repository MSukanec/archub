import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from '@/hooks/use-toast'
import { useMaterials } from '@/hooks/use-materials'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

import { Layout } from '@/components/layout/desktop/Layout'
import { CustomTable } from '@/components/ui-custom/CustomTable'
import { NewAdminMaterialModal } from '@/modals/admin/NewAdminMaterialModal'

import { Plus, Edit, Trash2, Package, Crown } from 'lucide-react'

interface Material {
  id: string
  name: string
  unit_id: string
  cost: number
  category_id: string
  created_at: string
  unit?: { name: string }
  category?: { name: string }
}

export default function AdminMaterials() {
  const [searchValue, setSearchValue] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [newMaterialModalOpen, setNewMaterialModalOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [deletingMaterial, setDeletingMaterial] = useState<Material | null>(null)

  // Fetch materials using the hook
  const { data: materials = [], isLoading } = useMaterials()
  // Temporary placeholder until delete functionality is implemented

  // Statistics calculations
  const totalMaterials = materials.length
  const averageCost = materials.length > 0 ? materials.reduce((sum, mat) => sum + (mat.cost || 0), 0) / materials.length : 0
  const highValueMaterials = materials.filter(mat => (mat.cost || 0) > 1000).length
  const recentMaterials = materials.filter(mat => {
    const createdDate = new Date(mat.created_at)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return createdDate > weekAgo
  }).length

  // Apply client-side filtering
  const filteredMaterials = materials.filter(material => {
    const matchesSearch = searchValue === '' || material.name.toLowerCase().includes(searchValue.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || material.category?.name?.toLowerCase() === categoryFilter
    return matchesSearch && matchesCategory
  })

  // Apply client-side sorting
  const sortedMaterials = [...filteredMaterials].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name)
    } else if (sortBy === 'cost') {
      return (b.cost || 0) - (a.cost || 0)
    } else {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  const handleEdit = (material: Material) => {
    setEditingMaterial(material)
    setNewMaterialModalOpen(true)
  }

  const handleDelete = (material: Material) => {
    setDeletingMaterial(material)
  }

  const handleConfirmDelete = () => {
    if (deletingMaterial) {
      // Temporary placeholder for delete functionality
      console.log('Delete material:', deletingMaterial.id)
      toast({
        title: "Función pendiente",
        description: "La eliminación de materiales estará disponible próximamente"
      })
      setDeletingMaterial(null)
    }
  }

  const clearFilters = () => {
    setSearchValue('')
    setSortBy('name')
    setCategoryFilter('all')
  }

  const columns = [
    {
      key: 'created_at',
      label: 'Fecha de Creación',
      width: '5%',
      render: (material: Material) => (
        <span className="text-xs text-muted-foreground">
          {format(new Date(material.created_at), 'dd/MM/yy', { locale: es })}
        </span>
      )
    },
    {
      key: 'name',
      label: 'Material',
      render: (material: Material) => (
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">{material.name}</span>
        </div>
      )
    },
    {
      key: 'category_id',
      label: 'Categoría',
      render: (material: Material) => (
        <span className="text-xs text-muted-foreground">
          {material.category?.name || 'N/A'}
        </span>
      )
    },
    {
      key: 'unit_id',
      label: 'Unidad',
      width: '5%',
      render: (material: Material) => (
        <span className="text-xs text-muted-foreground">
          {material.unit?.name || 'N/A'}
        </span>
      )
    },
    {
      key: 'cost',
      label: 'Costo',
      width: '5%',
      render: (material: Material) => (
        <Badge variant="outline" className="text-xs">
          ${material.cost?.toLocaleString() || '0'}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      width: '5%',
      render: (material: Material) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-[var(--button-ghost-hover-bg)]"
            onClick={() => handleEdit(material)}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-[var(--button-ghost-hover-bg)]"
            onClick={() => handleDelete(material)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )
    }
  ]

  const customFilters = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs font-medium">Ordenar por</Label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Nombre</SelectItem>
            <SelectItem value="cost">Costo</SelectItem>
            <SelectItem value="created_at">Fecha de creación</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label className="text-xs font-medium">Categoría</Label>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="construction">Construcción</SelectItem>
            <SelectItem value="electrical">Eléctrico</SelectItem>
            <SelectItem value="plumbing">Plomería</SelectItem>
            <SelectItem value="painting">Pintura</SelectItem>
            <SelectItem value="flooring">Pisos</SelectItem>
            <SelectItem value="roofing">Techos</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  const headerProps = {
    title: 'Materiales',
    showSearch: true,
    searchValue,
    onSearchChange: setSearchValue,
    customFilters,
    onClearFilters: clearFilters,
    actions: [
      <Button 
        key="new-material"
        onClick={() => {
          setEditingMaterial(null)
          setNewMaterialModalOpen(true)
        }}
        size="sm"
        className="gap-2"
      >
        <Plus className="h-4 w-4" />
        Nuevo Material
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
                <p className="text-xs text-muted-foreground">Total Materiales</p>
                <p className="text-lg font-semibold">{totalMaterials}</p>
              </div>
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Costo Promedio</p>
                <p className="text-lg font-semibold">${averageCost.toLocaleString()}</p>
              </div>
              <Crown className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Alto Valor</p>
                <p className="text-lg font-semibold">{highValueMaterials}</p>
              </div>
              <Crown className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Nuevos (7 días)</p>
                <p className="text-lg font-semibold">{recentMaterials}</p>
              </div>
              <Crown className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>
        </div>

        {/* Materials Table */}
        <CustomTable
          data={sortedMaterials}
          columns={columns}
          isLoading={isLoading}
          emptyState={
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-muted-foreground">No hay materiales</h3>
              <p className="text-sm text-muted-foreground mt-1">No hay materiales que coincidan con los filtros seleccionados.</p>
            </div>
          }
        />
      </div>

      {/* Material Modal */}
      <NewAdminMaterialModal
        open={newMaterialModalOpen}
        onClose={() => {
          setNewMaterialModalOpen(false)
          setEditingMaterial(null)
        }}
        material={editingMaterial}
      />

      <AlertDialog open={!!deletingMaterial} onOpenChange={() => setDeletingMaterial(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar material?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El material "{deletingMaterial?.name}" será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  )
}