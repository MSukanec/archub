import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from '@/hooks/use-toast'
import { useMaterials, Material, useDeleteMaterial } from '@/hooks/use-materials'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'


import { Layout } from '@/components/layout/desktop/Layout'
import { Table } from '@/components/ui-custom/Table'

import { Plus, Edit, Trash2, Package, Crown } from 'lucide-react'

export default function AdminMaterials() {
  const [searchValue, setSearchValue] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [categoryFilter, setCategoryFilter] = useState('all')
  
  const { openModal } = useGlobalModalStore()

  // Fetch materials using the hook
  const { data: materials = [], isLoading } = useMaterials()
  const deleteMaterialMutation = useDeleteMaterial()

  // Statistics calculations
  const totalMaterials = materials.length
  const totalCategories = Array.from(new Set(materials.map(mat => mat.category?.name).filter(Boolean))).length
  const totalUnits = Array.from(new Set(materials.map(mat => mat.unit?.name).filter(Boolean))).length
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
    } else if (sortBy === 'category') {
      return (a.category?.name || '').localeCompare(b.category?.name || '')
    } else {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  const handleEdit = (material: Material) => {
    openModal('material-form', { editingMaterial: material })
  }

  const handleCreate = () => {
    openModal('material-form', { editingMaterial: null })
  }

  const handleDelete = (material: Material) => {
    openModal('delete-confirmation', {
      mode: 'replace',
      title: 'Eliminar Material',
      description: `¿Estás seguro que deseas eliminar el material "${material.name}"? Esta acción no se puede deshacer.`,
      itemName: material.name,
      destructiveActionText: 'Eliminar Material',
      onDelete: () => deleteMaterialMutation.mutate(material.id),
      isLoading: deleteMaterialMutation.isPending
    })
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
            <SelectItem value="category">Categoría</SelectItem>
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
        onClick={handleCreate}
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
                <p className="text-xs text-muted-foreground">Total Categorías</p>
                <p className="text-lg font-semibold">{totalCategories}</p>
              </div>
              <Crown className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Unidades</p>
                <p className="text-lg font-semibold">{totalUnits}</p>
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
        <Table
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


    </Layout>
  )
}