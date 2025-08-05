import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from '@/hooks/use-toast'
import { useMaterials, Material, useDeleteMaterial } from '@/hooks/use-materials'
import { useMaterialCategories } from '@/hooks/use-material-categories'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'


import { Layout } from '@/components/layout/desktop/Layout'
import { Table } from '@/components/ui-custom/Table'

import { Plus, Edit, Trash2, Package, Crown, Copy } from 'lucide-react'

export default function AdminMaterials() {
  const [searchValue, setSearchValue] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [categoryFilter, setCategoryFilter] = useState('all')
  
  const { openModal } = useGlobalModalStore()

  // Fetch materials and categories using the hooks
  const { data: materials = [], isLoading } = useMaterials()
  const { data: categories = [] } = useMaterialCategories()
  const deleteMaterialMutation = useDeleteMaterial()

  // Function to build category hierarchy path
  const buildCategoryPath = (categoryId: string): string => {
    const findCategoryPath = (cats: any[], targetId: string, path: string[] = []): string[] | null => {
      for (const cat of cats) {
        if (cat.id === targetId) {
          return [...path, cat.name]
        }
        if (cat.children && cat.children.length > 0) {
          const found = findCategoryPath(cat.children, targetId, [...path, cat.name])
          if (found) return found
        }
      }
      return null
    }
    
    const path = findCategoryPath(categories, categoryId)
    return path ? path.join(' / ') : 'Sin categoría'
  }

  // Remove KPI statistics - no longer needed

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

  const handleDuplicate = (material: Material) => {
    openModal('material-form', { 
      editingMaterial: material,
      isDuplicating: true 
    })
  }

  const handleDelete = (material: Material) => {
    // Crear lista de materiales disponibles para reemplazo (excluyendo el actual)
    const replacementOptions = materials
      .filter(m => m.id !== material.id)
      .map(m => ({
        value: m.id,
        label: m.name
      }))

    openModal('delete-confirmation', {
      mode: 'replace',
      title: 'Eliminar Material',
      description: `¿Estás seguro que deseas eliminar el material "${material.name}"? Esta acción no se puede deshacer.`,
      itemName: material.name,
      destructiveActionText: 'Eliminar Material',
      onDelete: () => deleteMaterialMutation.mutate(material.id),
      onReplace: (newMaterialId: string) => {
        // Aquí puedes implementar la lógica de reemplazo si es necesaria
        console.log('Reemplazar material', material.id, 'por', newMaterialId)
        // Por ahora solo eliminamos el material actual
        deleteMaterialMutation.mutate(material.id)
      },
      replacementOptions,
      currentCategoryId: material.id,
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
          {buildCategoryPath(material.category_id)}
        </span>
      )
    },
    {
      key: 'unit_id',
      label: 'Unidad de Cómputo',
      width: '8%',
      render: (material: Material) => (
        <span className="text-xs text-muted-foreground">
          {material.unit?.name || 'N/A'}
        </span>
      )
    },
    {
      key: 'default_unit_presentation_id',
      label: 'Unidad de Venta por Defecto',
      width: '10%',
      render: (material: Material) => (
        <span className="text-xs text-muted-foreground">
          {material.default_unit_presentation?.name || 'N/A'}
        </span>
      )
    },
    {
      key: 'basic_price_override',
      label: 'Precio por Defecto',
      width: '8%',
      render: (material: Material) => (
        <span className="text-xs text-muted-foreground">
          {material.basic_price_override ? `$${material.basic_price_override.toLocaleString()}` : 'N/A'}
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
            className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-[var(--button-ghost-hover-bg)]"
            onClick={() => handleDuplicate(material)}
          >
            <Copy className="h-3 w-3" />
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
    actionButton: {
      label: "Nuevo Material",
      icon: Plus,
      onClick: handleCreate
    }
  }

  return (
    <Layout wide headerProps={headerProps}>
      <div className="space-y-6">
        {/* KPI Cards removed as requested */}

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