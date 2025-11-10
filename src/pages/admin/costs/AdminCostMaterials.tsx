import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from '@/hooks/use-toast'
import { useMaterials, Material, useDeleteMaterial } from '@/hooks/use-materials'
import { useMaterialCategories } from '@/hooks/use-material-categories'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import AdminMaterialRow from '@/components/ui/data-row/rows/AdminMaterialRow'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { Table } from '@/components/ui-custom/tables-and-trees/Table'
import { cn } from '@/lib/utils'

import { Plus, Edit, Trash2, Package, Crown, Copy, Wrench } from 'lucide-react'

const AdminCostMaterials = () => {
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

  // Function to find the top-level category (without parent_id) for a given category
  const findTopLevelCategory = (categoryId: string): string => {
    // First, find all categories in a flat list with their hierarchy info
    const flattenAllCategories = (cats: any[], parentName?: string): Array<{id: string, name: string, topLevelName: string}> => {
      const result: Array<{id: string, name: string, topLevelName: string}> = []
      
      cats.forEach(cat => {
        const topLevel = parentName || cat.name // If no parent, this IS the top level
        result.push({
          id: cat.id,
          name: cat.name,
          topLevelName: topLevel
        })
        
        if (cat.children && cat.children.length > 0) {
          result.push(...flattenAllCategories(cat.children, topLevel))
        }
      })
      
      return result
    }
    
    const flatCategories = flattenAllCategories(categories)
    const foundCategory = flatCategories.find(cat => cat.id === categoryId)
    return foundCategory?.topLevelName || 'Sin categoría'
  }

  // Apply client-side filtering
  const filteredMaterials = materials.filter(material => {
    const matchesSearch = searchValue === '' || material.name.toLowerCase().includes(searchValue.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || material.category_name?.toLowerCase() === categoryFilter
    return matchesSearch && matchesCategory
  })

  // Apply client-side sorting
  const sortedMaterials = [...filteredMaterials].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name)
    } else if (sortBy === 'category') {
      return (a.category_name || '').localeCompare(b.category_name || '')
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
      // Agrupar por categoría
      const grouped = sortedMaterials.reduce((acc, material) => {
        const groupKey = material.category_name || 'Sin categoría';
        if (!acc[groupKey]) {
          acc[groupKey] = [];
        }
        acc[groupKey].push(material);
        return acc;
      }, {} as Record<string, Material[]>);
      
      // Ordenar alfabéticamente dentro de cada grupo y luego aplanar
      return Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b)) // Ordenar categorías alfabéticamente
        .flatMap(([groupKey, materials]) => 
          materials
            .sort((a, b) => a.name.localeCompare(b.name)) // Ordenar materiales alfabéticamente dentro del grupo
            .map(material => ({
              ...material,
              groupKey
            }))
        );
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

  // Render grouping popover content
  const renderGroupingContent = () => {
    const groupingOptions = [
      { value: 'none', label: 'Sin agrupar' },
      { value: 'categories', label: 'Por categorías' }
    ];

    return (
      <>
        <div className="text-xs font-medium mb-2 block">Agrupar por</div>
        <div className="space-y-1">
          {groupingOptions.map((option) => (
            <Button
              key={option.value}
              variant={groupingType === option.value ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setGroupingType(option.value as 'none' | 'categories')}
              className={cn(
                "w-full justify-start text-xs font-normal h-8",
                groupingType === option.value ? "button-secondary-pressed hover:bg-secondary" : ""
              )}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </>
    );
  };

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
          {material.category_name ? (
            <Badge variant="outline" className="text-xs">
              {material.category_name}
            </Badge>
          ) : (
            <span className="text-muted-foreground text-xs">Sin categoría</span>
          )}
        </div>
      )
    }] : []),
    {
      key: 'unit_of_computation',
      label: 'Unidad de Cómputo',
      width: '12%',
      render: (material: Material) => (
        <div>
          {material.unit_of_computation ? (
            <Badge variant="secondary" className="text-xs">
              {material.unit_of_computation}
            </Badge>
          ) : (
            <span className="text-muted-foreground text-xs">Sin unidad</span>
          )}
        </div>
      )
    },
    {
      key: 'avg_price',
      label: 'Precio Promedio',
      width: '15%',
      render: (material: Material) => (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium">
            {material.avg_price !== null && material.avg_price !== undefined ? 
              `ARS ${material.avg_price.toFixed(2)}` : 
              '–'
            }
          </span>
          {material.provider_product_count && material.provider_product_count > 0 && (
            <span className="text-xs text-muted-foreground">
              {material.provider_product_count} proveedor{material.provider_product_count > 1 ? 'es' : ''}
            </span>
          )}
        </div>
      )
    }
  ]

  // Dynamic columns based on grouping (using baseColumns which already handles the conditional inclusion)
  const columns = baseColumns;

  return (
    <div className="space-y-6">
      <Table
        data={processedMaterials}
        columns={columns}
        isLoading={isLoading}
        groupBy={groupingType === 'none' ? undefined : 'groupKey'}
        rowActions={(material: Material) => [
          {
            icon: Edit,
            label: 'Editar',
            onClick: () => handleEdit(material)
          },
          {
            icon: Copy,
            label: 'Duplicar',
            onClick: () => handleDuplicate(material)
          },
          {
            icon: Trash2,
            label: 'Eliminar',
            onClick: () => handleDelete(material),
            variant: 'destructive' as const
          }
        ]}
        renderCard={(material) => (
          <AdminMaterialRow
            material={material}
            onClick={() => handleEdit(material)}
            density="normal"
          />
        )}
        topBar={{
          showSearch: true,
          searchValue: searchValue,
          onSearchChange: setSearchValue,
          showFilter: true,
          isFilterActive: categoryFilter !== 'all',
          renderFilterContent: () => (
            <>
              <div>
                <Label className="text-xs font-medium mb-2 block">Categoría</Label>
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
            </>
          ),
          onClearFilters: clearFilters,
          renderGroupingContent: renderGroupingContent,
          isGroupingActive: groupingType !== 'none'
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
    </div>
  )
}

export default AdminCostMaterials