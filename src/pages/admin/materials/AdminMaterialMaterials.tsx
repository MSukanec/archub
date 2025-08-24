import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from '@/hooks/use-toast'
import { useMaterials, Material, useDeleteMaterial } from '@/hooks/use-materials'
import { useMaterialCategories } from '@/hooks/use-material-categories'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { Table } from '@/components/ui-custom/tables-and-trees/Table'

import { Plus, Edit, Trash2, Package, Crown, Copy, Wrench } from 'lucide-react'

const AdminMaterialMateriales = () => {
  const [searchValue, setSearchValue] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [groupingType, setGroupingType] = useState<'none' | 'categories'>('categories')
  
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

  // Process materials for grouping
  const processedMaterials = useMemo(() => {
    if (groupingType === 'none') {
      return sortedMaterials;
    }
    
    if (groupingType === 'categories') {
      return sortedMaterials.map(material => ({
        ...material,
        groupKey: material.category?.name || 'Sin categoría'
      }));
    }
    
    return sortedMaterials;
  }, [sortedMaterials, groupingType])

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
    setGroupingType('categories')
  }

  // Table columns configuration - hide 'Categoría' column when grouped by categories
  const baseColumns = [
    {
      key: 'is_completed',
      label: 'Completado',
      width: '8%',
      render: (material: Material) => (
        <div className="flex justify-center">
          {material.is_completed ? (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              Completado
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
              Incompleto
            </span>
          )}
        </div>
      )
    },
    {
      key: 'name',
      label: 'Material',
      width: 'minmax(0, 1fr)',
      render: (material: Material) => (
        <div className="font-medium text-xs">
          {material.name}
        </div>
      )
    },
    ...(groupingType !== 'categories' ? [{
      key: 'category_id',
      label: 'Categoría',
      width: '12%',
      render: (material: Material) => (
        <div>
          {material.category?.name ? (
            <Badge variant="outline" className="text-xs">
              {material.category.name}
            </Badge>
          ) : (
            <span className="text-muted-foreground text-xs">Sin categoría</span>
          )}
        </div>
      )
    }] : []),
    {
      key: 'provider',
      label: 'Proveedor',
      width: '10%',
      render: (material: Material) => (
        <span className="text-xs text-muted-foreground">
          {material.provider || '–'}
        </span>
      )
    },
    {
      key: 'unit_id',
      label: 'Unidad',
      width: '8%',
      render: (material: Material) => (
        <div>
          {material.unit?.name ? (
            <Badge variant="secondary" className="text-xs">
              {material.unit.name}
            </Badge>
          ) : (
            <span className="text-muted-foreground text-xs">Sin unidad</span>
          )}
        </div>
      )
    },
    {
      key: 'base_price_override',
      label: 'Precio',
      width: '8%',
      render: (material: Material) => (
        <span className="text-xs font-medium">
          {material.base_price_override ? `$${material.base_price_override.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}` : '–'}
        </span>
      )
    },

    {
      key: 'actions',
      label: 'Acciones',
      width: '120px',
      render: (material: Material) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(material)}
            className="h-8 w-8 p-0"
            title="Editar material"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDuplicate(material)}
            className="h-8 w-8 p-0"
            title="Duplicar material"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(material)}
            className="h-8 w-8 p-0"
            title="Eliminar material"
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      )
    }
  ]

  // Dynamic columns based on grouping (using baseColumns which already handles the conditional inclusion)
  const columns = baseColumns;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-0">
          <Table
            data={processedMaterials}
            columns={columns}
            isLoading={isLoading}
            groupBy={groupingType === 'none' ? undefined : 'groupKey'}
            topBar={{
              tabs: ['Sin Agrupar', 'Por Categorías'],
              activeTab: groupingType === 'none' ? 'Sin Agrupar' : 'Por Categorías',
              onTabChange: (tab: string) => {
                if (tab === 'Sin Agrupar') setGroupingType('none')
                else if (tab === 'Por Categorías') setGroupingType('categories')
              },
              showSearch: true,
              searchValue: searchValue,
              onSearchChange: setSearchValue,
              showFilter: true,
              isFilterActive: categoryFilter !== 'all',
              renderFilterContent: () => (
                <div className="space-y-3 p-2 min-w-[200px]">
                  <div>
                    <Label className="text-xs font-medium mb-1 block">Categoría</Label>
                    <Select value={categoryFilter} onValueChange={(value: string) => setCategoryFilter(value)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Todas las categorías" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las categorías</SelectItem>
                        {categories.map((category: any) => (
                          <SelectItem key={category.id} value={category.name.toLowerCase()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ),
              showClearFilters: categoryFilter !== 'all' || groupingType !== 'categories',
              onClearFilters: clearFilters,
            }}
            renderGroupHeader={groupingType === 'none' ? undefined : (groupKey: string, groupRows: any[]) => (
              <div className="col-span-full text-sm font-medium">
                {groupKey} ({groupRows.length} {groupRows.length === 1 ? 'Material' : 'Materiales'})
              </div>
            )}
            emptyState={
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-sm">No se encontraron materiales</p>
                <p className="text-xs">No hay materiales que coincidan con los filtros aplicados.</p>
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminMaterialMateriales