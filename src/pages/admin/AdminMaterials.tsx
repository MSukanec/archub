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
      key: 'is_completed',
      label: 'Completado',
      width: '8%',
      render: (material: Material) => (
          {material.is_completed ? (
              Completado
            </span>
          ) : (
              Incompleto
            </span>
          )}
        </div>
      )
    },
    {
      key: 'name',
      label: 'Material',
      render: (material: Material) => (
        </div>
      )
    },
    {
      key: 'category_id',
      label: 'Categoría',
      render: (material: Material) => (
          {buildCategoryPath(material.category_id)}
        </span>
      )
    },
    {
      key: 'provider',
      label: 'Proveedor',
      width: '10%',
      render: (material: Material) => (
          {material.provider || 'N/A'}
        </span>
      )
    },
    {
      key: 'unit_id',
      label: 'Unidad de Cómputo',
      width: '8%',
      render: (material: Material) => (
          {material.unit?.name || 'N/A'}
        </span>
      )
    },
    {
      key: 'default_unit_presentation_id',
      label: 'Unidad de Venta por Defecto',
      width: '10%',
      render: (material: Material) => (
          {material.default_unit_presentation?.name || 'N/A'}
        </span>
      )
    },
    {
      key: 'base_price_override',
      label: 'Precio por Defecto',
      width: '8%',
      render: (material: Material) => (
          {material.base_price_override ? `$${material.base_price_override.toLocaleString()}` : 'N/A'}
        </span>
      )
    },

    {
      key: 'actions',
      label: 'Acciones',
      width: '5%',
      render: (material: Material) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(material)}
          >
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDuplicate(material)}
          >
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(material)}
          >
          </Button>
        </div>
      )
    }
  ]

  const customFilters = (
        <Select value={sortBy} onValueChange={setSortBy}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Nombre</SelectItem>
            <SelectItem value="category">Categoría</SelectItem>
            <SelectItem value="created_at">Fecha de creación</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
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
        {/* KPI Cards removed as requested */}

        {/* Materials Table */}
        <Table
          data={sortedMaterials}
          columns={columns}
          isLoading={isLoading}
          emptyState={
            </div>
          }
        />
      </div>


    </Layout>
  )
}